"""
CCC API Service for checking phone numbers against litigator list (ported from old_app)
"""

import requests
import time
from typing import List, Dict, Any, Optional
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

from app.core.config import settings
from app.core.logger import etl_logger
from app.services.etl.cache_service import PhoneCache, SnowflakeCacheService


class CCCAPIService:
    """CCC API service for litigator list checking"""
    
    def __init__(self, api_key: str = None):
        """Initialize CCC API service"""
        self.api_key = api_key or settings.ccc_api.api_key
        self.base_url = settings.ccc_api.base_url
        self.batch_size = settings.ccc_api.batch_size
        self.rate_limit_delay = settings.ccc_api.rate_limit_delay
        self.logger = etl_logger.logger.getChild("CCCAPI")
        self.session = requests.Session()
        self.session.headers.update({
            'loginId': self.api_key,
            'User-Agent': 'Lodasoft-ETL/1.0'
        })
        
        # Initialize caches - Snowflake as primary, CSV as backup
        self.snowflake_cache = SnowflakeCacheService()
        self.phone_cache = PhoneCache()  # Keep CSV cache as backup
    
    def _safe_string_key(self, value: Any) -> Optional[str]:
        """
        GUARANTEED string conversion for dictionary keys.
        Returns None if conversion is impossible.
        CRITICAL: This must NEVER return a list, tuple, or any unhashable type.
        """
        if value is None:
            return None
        
        # Already a string - most common case
        if isinstance(value, str):
            stripped = value.strip()
            return stripped if stripped else None
        
        # List: extract SECOND element if present (for [formatted, cleaned] format from JSON cache)
        # Otherwise extract first element recursively
        if isinstance(value, list):
            if len(value) >= 2:
                # JSON cache format: ["formatted", "cleaned"] - take cleaned (second element)
                result = self._safe_string_key(value[1])
                if result:
                    return result
                # Fallback to first element
                return self._safe_string_key(value[0])
            elif len(value) == 1:
                return self._safe_string_key(value[0])
            return None
        
        # Tuple: extract second element (cleaned phone) or first
        if isinstance(value, tuple):
            if len(value) >= 2:
                result = self._safe_string_key(value[1])
                if result:
                    return result
                return self._safe_string_key(value[0])
            elif len(value) == 1:
                return self._safe_string_key(value[0])
            return None
        
        # Any other type: force string conversion
        try:
            result = str(value).strip()
            # CRITICAL FINAL CHECK: verify we actually got a string
            if not isinstance(result, str):
                self.logger.error(f"CRITICAL: str() returned non-string: {type(result)}")
                return None
            return result if result else None
        except Exception as e:
            self.logger.error(f"CRITICAL: Failed to convert to string: {value}, error: {e}")
            return None
    
    def _normalize_phone_to_string(self, phone_value: Any) -> Optional[str]:
        """
        Safely convert any phone value to a string.
        Handles strings, lists, tuples, and other types.
        Returns None if conversion is not possible.
        CRITICAL: Uses same logic as _safe_string_key for consistency.
        """
        # Delegate to _safe_string_key for consistent handling
        return self._safe_string_key(phone_value)
    
    def _clean_phone_number(self, phone: Any) -> str:
        """Clean phone number to standard format. Handles strings, lists, tuples, and other types."""
        # Normalize phone to string first
        if phone is None:
            return ""
        
        # If it's a list, extract the first element
        if isinstance(phone, list):
            if len(phone) > 0:
                phone = phone[0]
            else:
                return ""
        
        # If it's a tuple, extract the cleaned phone (usually second element)
        if isinstance(phone, tuple):
            if len(phone) >= 2:
                phone = phone[1]  # Usually tuple is (formatted, cleaned) - take cleaned
            elif len(phone) == 1:
                phone = phone[0]
            else:
                return ""
        
        # Convert to string if not already
        if not isinstance(phone, str):
            phone = str(phone)
        
        # Extract digits
        digits = ''.join(filter(str.isdigit, phone))
        
        if len(digits) == 10:
            return digits
        elif len(digits) == 11 and digits.startswith('1'):
            return digits[1:]  # Remove country code
        else:
            return digits
    
    def _parse_litigator_result(self, api_response: Dict[str, Any]) -> bool:
        """Parse CCC API response to determine if phone is in litigator list"""
        try:
            # Handle array responses
            if isinstance(api_response, list) and len(api_response) > 0:
                return self._parse_litigator_result(api_response[0])
            
            # Handle single object response
            if isinstance(api_response, dict):
                # New Litigator-Only API format: {"Phone": "1234567890", "IsLitigator": true/false}
                if 'IsLitigator' in api_response:
                    return bool(api_response['IsLitigator'])
                
                # Fallback to old API format
                if 'Reason' in api_response:
                    reason = str(api_response['Reason']).strip()
                    if reason.lower() == 'litigator':
                        return True
                
                if 'ResultCode' in api_response:
                    result_code = str(api_response['ResultCode']).strip()
                    if result_code == 'D':  # Do not call
                        return True
                
                # Check for litigator-related fields
                litigator_fields = ['litigator', 'litigation', 'dnc', 'do_not_call', 'restricted']
                for field in litigator_fields:
                    if field in api_response and api_response[field]:
                        return True
            
            return False
            
        except Exception as e:
            self.logger.error(f"Error parsing litigator result: {e}")
            return False
    
    def _check_batch_phones(self, phones: List[str]) -> List[Dict[str, Any]]:
        """Check multiple phone numbers in a single API request with retry logic"""
        try:
            # Clean all phone numbers
            cleaned_phones = [self._clean_phone_number(phone) for phone in phones]
            phone_list = ",".join(cleaned_phones)
            
            # Build query parameters for Litigator-Only API
            params = {
                'phoneList': phone_list,
                'loginId': self.api_key
            }
            
            headers = {
                'User-Agent': 'Lodasoft-ETL/1.0'
            }
            
            # Retry logic: try up to 2 times
            max_retries = 2
            api_results = None
            
            for attempt in range(max_retries):
                try:
                    response = requests.get(self.base_url, params=params, headers=headers, timeout=30)
                    response.raise_for_status()
                    api_results = response.json()
                    break
                except Exception as e:
                    if attempt < max_retries - 1:
                        self.logger.warning(f"API request failed (attempt {attempt + 1}/{max_retries}): {e}. Retrying in 10 seconds...")
                        time.sleep(10)
                        continue
                    else:
                        raise e
            
            # Process API results
            if not isinstance(api_results, list):
                raise ValueError(f"Expected list response, got {type(api_results)}")
            
            results = []
            for i, original_phone in enumerate(phones):
                cleaned_phone = cleaned_phones[i]
                
                # Find matching result in API response
                api_result = None
                for result in api_results:
                    api_phone = result.get('Phone')
                    if api_phone == cleaned_phone or str(api_phone) == cleaned_phone:
                        api_result = result
                        break
                
                if api_result:
                    in_litigator_list = api_result.get('IsLitigator', False)
                    confidence = 95 if in_litigator_list else 85
                    
                    # Normalize phone to string - handle lists, tuples, etc.
                    phone_str = self._normalize_phone_to_string(original_phone) or str(original_phone)
                    cleaned_phone_str = str(cleaned_phone) if not isinstance(cleaned_phone, str) else cleaned_phone
                    
                    result_dict = {
                        'phone': phone_str,
                        'cleaned_phone': cleaned_phone_str,
                        'in_litigator_list': in_litigator_list,
                        'confidence': confidence,
                        'status': 'success',
                        'api_response': api_result
                    }
                else:
                    # Normalize phone to string - handle lists, tuples, etc.
                    phone_str = self._normalize_phone_to_string(original_phone) or str(original_phone)
                    cleaned_phone_str = str(cleaned_phone) if not isinstance(cleaned_phone, str) else cleaned_phone
                    
                    result_dict = {
                        'phone': phone_str,
                        'cleaned_phone': cleaned_phone_str,
                        'in_litigator_list': False,
                        'confidence': 0,
                        'status': 'not_found',
                        'error': 'Phone not found in API response'
                    }
                
                results.append(result_dict)
            
            return results
        
        except Exception as e:
            self.logger.error(f"Error in batch phone check: {e}")
            return [
                {
                    'phone': self._normalize_phone_to_string(phone) or str(phone),
                    'cleaned_phone': self._clean_phone_number(phone),
                    'in_litigator_list': False,
                    'confidence': 0,
                    'status': 'error',
                    'error': str(e)
                }
                for phone in phones
            ]
    
    def check_multiple_phones_threaded(self, phones: List[Any], max_workers: int = 8) -> List[Dict[str, Any]]:
        """
        Check multiple phone numbers against litigator list with batch threading and caching
        
        Args:
            phones: List of phone numbers to check (can be strings, lists, tuples, etc.)
            max_workers: Number of threads to use for parallel batch processing (default 8)
            
        Returns:
            List of dictionaries with check results
        """
        results = [None] * len(phones)
        total_phones = len(phones)
        
        self.logger.info(f"Starting threaded litigator check for {total_phones} phone numbers using {max_workers} threads")
        
        # Normalize all phones at entry point - USE SAFE CONVERSION
        normalized_phones = []
        phone_mapping = {}
        for i, phone in enumerate(phones):
            # CRITICAL: Use _safe_string_key, not _normalize_phone_to_string
            normalized = self._safe_string_key(phone)
            if not normalized:
                # Fallback: force string representation
                try:
                    if isinstance(phone, (list, tuple)) and len(phone) > 0:
                        normalized = str(phone[0]) if not isinstance(phone[0], (list, tuple)) else str(phone)
                    else:
                        normalized = str(phone) if phone else ""
                except Exception:
                    normalized = ""
                    
            # ASSERTION: normalized MUST be a string at this point
            if not isinstance(normalized, str):
                self.logger.error(f"CRITICAL: normalized is not a string: {type(normalized)} - {normalized}")
                normalized = str(normalized) if normalized else ""
            
            normalized_phones.append(normalized)
            
            if normalized:
                # SAFE: normalized is guaranteed to be a string
                if normalized not in phone_mapping:
                    phone_mapping[normalized] = []
                phone_mapping[normalized].append(i)
        
        # Check cache first using normalized phones
        cached_results = self.phone_cache.get_cached_results(normalized_phones)
        uncached_phones = self.phone_cache.get_uncached_phones(normalized_phones)
        
        cache_hits = sum(1 for result in cached_results if result is not None)
        self.logger.info(f"Cache stats: {cache_hits} hits, {len(uncached_phones)} misses out of {total_phones} phones")
        
        # Add cached results - map back to original indices
        for i, cached_result in enumerate(cached_results):
            if cached_result is not None:
                normalized_phone = normalized_phones[i]
                if normalized_phone and normalized_phone in phone_mapping:
                    # Map result to all original indices that correspond to this normalized phone
                    for orig_idx in phone_mapping[normalized_phone]:
                        results[orig_idx] = {
                            'phone': normalized_phone,
                            'cleaned_phone': normalized_phone,
                            'in_litigator_list': cached_result['in_litigator_list'],
                            'confidence': cached_result['confidence'],
                            'status': 'success',
                            'cached': True
                        }
        
        # Process uncached phones with batch threading
        if uncached_phones:
            self.logger.info(f"Making API calls for {len(uncached_phones)} uncached phones")
            
            # Split uncached phones into batches of 20
            phone_batches = []
            for i in range(0, len(uncached_phones), self.batch_size):
                phone_batches.append(uncached_phones[i:i + self.batch_size])
            
            # Use ThreadPoolExecutor for parallel batch processing
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                future_to_batch = {
                    executor.submit(self._check_batch_phones, batch): batch
                    for batch in phone_batches
                }
                
                batch_results_map = {}
                for future in as_completed(future_to_batch):
                    batch = future_to_batch[future]
                    try:
                        batch_results = future.result()
                        batch_results_map[tuple(batch)] = batch_results
                    except Exception as e:
                        self.logger.error(f"Error processing batch: {e}")
                        # Create error results for this batch
                        batch_results_map[tuple(batch)] = [
                            {
                                'phone': self._normalize_phone_to_string(phone) or str(phone),
                                'cleaned_phone': self._clean_phone_number(phone),
                                'in_litigator_list': False,
                                'confidence': 0,
                                'status': 'error',
                                'error': str(e)
                            }
                            for phone in batch
                        ]
            
            # Update results list and cache
            bulk_cache_data = []
            for batch, batch_results in batch_results_map.items():
                for result in batch_results:
                    phone = result.get('phone')
                    # Normalize phone to string for index lookup
                    phone = self._normalize_phone_to_string(phone) or str(phone)
                    
                    try:
                        # Use phone_mapping to find original indices
                        if phone in phone_mapping:
                            # Map result to all original indices that correspond to this normalized phone
                            for orig_idx in phone_mapping[phone]:
                                results[orig_idx] = result
                        else:
                            # Fallback: try to find by matching normalized phones
                            for idx, norm_phone in enumerate(normalized_phones):
                                if norm_phone == phone:
                                    if norm_phone in phone_mapping:
                                        for orig_idx in phone_mapping[norm_phone]:
                                            results[orig_idx] = result
                                    break
                    except Exception as lookup_error:
                        self.logger.warning(f"Could not map result for phone {phone}: {lookup_error}")
                        continue
                    
                    # Collect for bulk Snowflake cache update
                    if result['status'] == 'success':
                        bulk_cache_data.append(result)
                        
                        # Update CSV cache individually
                        self.phone_cache.cache_result(phone, result)
            
            # Bulk update Snowflake cache
            if bulk_cache_data:
                self.logger.info(f"Bulk uploading {len(bulk_cache_data)} phone results to Snowflake")
                self.snowflake_cache.bulk_add_phones_to_cache(bulk_cache_data)
            
            # Save CSV cache
            self.phone_cache.save_cache()
        
        # Log summary
        successful_checks = sum(1 for r in results if r and r['status'] == 'success')
        in_list_count = sum(1 for r in results if r and r.get('in_litigator_list', False))
        
        self.logger.info(f"Litigator check completed: {successful_checks}/{total_phones} successful, {in_list_count} found in list")
        
        return results

