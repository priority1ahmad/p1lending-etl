"""
DNC (Do Not Call) Checker Service using SQLite Database (ported from old_app)
"""

import os
import sqlite3
from typing import List, Dict, Optional
from pathlib import Path

from app.core.config import settings
from app.core.logger import etl_logger


class DNCCheckerDB:
    """DNC list checker using SQLite database for efficient lookup"""
    
    def __init__(self, dnc_file_path: str = None):
        """
        Initialize DNC checker with database
        
        Args:
            dnc_file_path: Path to the DNC list file (optional, will look for default)
        """
        # Default DNC file path (can be overridden)
        if dnc_file_path is None:
            # Look for DNC file in common locations
            # Priority: Docker mount path first, then production host path, then local paths
            possible_paths = [
                "/app/dnc_database.db",  # Docker mount (production) - mounted from /home/ubuntu/etl_app/dnc_database.db
                "/app/data/dnc_database.db",  # Docker volume path (if mounted separately)
                "/home/ubuntu/etl_app/dnc_database.db",  # Production host path (primary location)
                "data/dnc_database.db",       # Local data directory
                "dnc_database.db",            # Current directory
                "../old_app/dnc_database.db", # Old app location
                "/home/ubuntu/etl_app/data/dnc_database.db",  # Production data path (alternative)
            ]
            dnc_file_path = None
            for path in possible_paths:
                if os.path.exists(path):
                    dnc_file_path = path
                    break
        
        self.db_path = dnc_file_path or "dnc_database.db"
        self.logger = etl_logger.logger.getChild("DNCCheckerDB")
        
        # Verify database exists and is accessible
        self._verify_database()
    
    def _verify_database(self) -> bool:
        """
        Verify that the DNC database exists and is accessible.
        Returns True if database is available, False otherwise.
        """
        if not os.path.exists(self.db_path):
            self.logger.warning(f"DNC database not found at {self.db_path}. DNC checking will be disabled.")
            self.logger.warning(f"Please ensure the DNC database file exists at one of these locations:")
            self.logger.warning(f"  - /app/dnc_database.db (Docker mount - recommended, from /home/ubuntu/etl_app/dnc_database.db)")
            self.logger.warning(f"  - /app/data/dnc_database.db (Docker volume)")
            self.logger.warning(f"  - /home/ubuntu/etl_app/dnc_database.db (Production host)")
            self.logger.warning(f"  - {os.path.abspath('data/dnc_database.db')}")
            self.logger.warning(f"  - {os.path.abspath('dnc_database.db')}")
            return False
        
        # Try to connect and verify table exists
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='dnc_list'")
            table_exists = cursor.fetchone() is not None
            conn.close()
            
            if table_exists:
                self.logger.info(f"✅ DNC database verified: {os.path.abspath(self.db_path)}")
                return True
            else:
                self.logger.warning(f"DNC database exists but 'dnc_list' table not found. DNC checking will be disabled.")
                return False
        except Exception as e:
            self.logger.error(f"Error verifying DNC database: {e}. DNC checking will be disabled.")
            return False
    
    def _extract_area_code_and_number(self, phone: str) -> tuple:
        """Extract area code and phone number from a phone string"""
        digits = ''.join(filter(str.isdigit, phone))

        if len(digits) == 10:
            area_code = digits[:3]
            phone_number = digits[3:]
            return area_code, phone_number
        elif len(digits) == 11 and digits.startswith('1'):
            area_code = digits[1:4]
            phone_number = digits[4:]
            return area_code, phone_number
        else:
            return None, None

    def _normalize_to_full_phone(self, phone: str) -> Optional[str]:
        """
        Normalize phone to 10-digit format for database lookup using full_phone column.

        Args:
            phone: Phone number (any format)

        Returns:
            10-digit phone string (e.g., "5551234567") or None if invalid
        """
        if not phone:
            return None

        # Extract digits only
        digits = ''.join(filter(str.isdigit, str(phone)))

        if len(digits) == 10:
            return digits  # Already 10 digits
        elif len(digits) == 11 and digits.startswith('1'):
            return digits[1:]  # Remove leading '1' (US country code)
        else:
            return None  # Invalid format

    def check_single_phone(self, phone: str) -> Dict:
        """Check if a single phone number is in the DNC list"""
        if not os.path.exists(self.db_path):
            return {
                'phone': phone,
                'in_dnc_list': False,
                'status': 'error',
                'error': 'DNC database not found'
            }
        
        try:
            area_code, phone_number = self._extract_area_code_and_number(phone)
            
            if not area_code or not phone_number:
                return {
                    'phone': phone,
                    'in_dnc_list': False,
                    'status': 'error',
                    'error': 'Invalid phone number format'
                }
            
            # Query database
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute(
                'SELECT 1 FROM dnc_list WHERE area_code = ? AND phone_number = ? LIMIT 1',
                (area_code, phone_number)
            )
            
            in_dnc_list = cursor.fetchone() is not None
            conn.close()
            
            return {
                'phone': phone,
                'area_code': area_code,
                'phone_number': phone_number,
                'in_dnc_list': in_dnc_list,
                'status': 'success'
            }
            
        except Exception as e:
            self.logger.error(f"Error checking phone {phone}: {e}")
            return {
                'phone': phone,
                'in_dnc_list': False,
                'status': 'error',
                'error': str(e)
            }
    
    def check_multiple_phones(self, phones: List[str]) -> List[Dict]:
        """
        Check multiple phone numbers against DNC list using batched WHERE IN query.
        Optimized from sequential queries (6-30s) to single batch query (1-3s) for 600 phones.

        Args:
            phones: List of phone numbers to check

        Returns:
            List of dictionaries with phone check results
        """
        # Early exit for empty list
        if not phones:
            return []

        # Database existence check
        if not os.path.exists(self.db_path):
            self.logger.warning(f"DNC database not found at {self.db_path}. Returning empty results.")
            return [
                {
                    'phone': str(phone) if not isinstance(phone, str) else phone,
                    'in_dnc_list': False,
                    'status': 'error',
                    'error': f'DNC database not found at {self.db_path}'
                }
                for phone in phones
            ]

        total_phones = len(phones)
        self.logger.info(f"🔍 Checking {total_phones} phone numbers against DNC database (batched query)")

        # Establish database connection
        try:
            conn = sqlite3.connect(self.db_path, timeout=30.0)
            cursor = conn.cursor()
        except Exception as e:
            self.logger.error(f"Failed to connect to DNC database: {e}")
            return [
                {
                    'phone': str(phone) if not isinstance(phone, str) else phone,
                    'in_dnc_list': False,
                    'status': 'error',
                    'error': f'Database connection error: {str(e)}'
                }
                for phone in phones
            ]

        try:
            # Build phone normalization map and collect valid phones
            phone_map = {}  # normalized → original phone
            normalized_phones = []
            invalid_phones = []

            for phone in phones:
                phone_str = str(phone) if not isinstance(phone, str) else phone
                normalized = self._normalize_to_full_phone(phone_str)

                if normalized:
                    normalized_phones.append(normalized)
                    if normalized not in phone_map:
                        phone_map[normalized] = phone_str
                else:
                    invalid_phones.append(phone_str)

            # If no valid phones, return error results
            if not normalized_phones:
                self.logger.warning(f"No valid phone numbers to check (all {total_phones} phones invalid)")
                return [
                    {
                        'phone': phone_str,
                        'in_dnc_list': False,
                        'status': 'error',
                        'error': 'Invalid phone number format'
                    }
                    for phone_str in invalid_phones
                ]

            # Chunk phones to respect SQLite parameter limit (999)
            SQLITE_MAX_PARAMS = 900  # Conservative limit
            chunks = [
                normalized_phones[i:i + SQLITE_MAX_PARAMS]
                for i in range(0, len(normalized_phones), SQLITE_MAX_PARAMS)
            ]

            # Query DNC database in chunks
            dnc_phones_set = set()

            for chunk_idx, chunk in enumerate(chunks):
                placeholders = ','.join(['?'] * len(chunk))
                query = f"""
                    SELECT full_phone
                    FROM dnc_list
                    WHERE full_phone IN ({placeholders})
                """

                try:
                    cursor.execute(query, chunk)
                    chunk_results = cursor.fetchall()
                    dnc_phones_set.update(row[0] for row in chunk_results)

                    if len(chunks) > 1:
                        self.logger.debug(f"DNC chunk {chunk_idx + 1}/{len(chunks)}: {len(chunk)} phones, {len(chunk_results)} matches")
                except Exception as e:
                    self.logger.error(f"Error querying DNC chunk {chunk_idx + 1}: {e}")
                    continue

            conn.close()

            # Build results preserving original phone order and format
            results = []

            for phone in phones:
                phone_str = str(phone) if not isinstance(phone, str) else phone
                normalized = self._normalize_to_full_phone(phone_str)

                if not normalized:
                    # Invalid phone format
                    results.append({
                        'phone': phone_str,
                        'in_dnc_list': False,
                        'status': 'error',
                        'error': 'Invalid phone number format'
                    })
                else:
                    # Valid phone - check if in DNC
                    in_dnc_list = normalized in dnc_phones_set

                    # Extract area code and phone number for compatibility
                    area_code = normalized[:3]
                    phone_number = normalized[3:]

                    results.append({
                        'phone': phone_str,
                        'area_code': area_code,
                        'phone_number': phone_number,
                        'in_dnc_list': in_dnc_list,
                        'status': 'success'
                    })

            # Log summary
            in_dnc_count = sum(1 for r in results if r.get('in_dnc_list', False))
            success_count = sum(1 for r in results if r.get('status') == 'success')
            self.logger.info(f"✅ DNC check completed (batched): {in_dnc_count}/{total_phones} phones found in DNC list ({success_count} successful checks)")

            return results

        except Exception as e:
            self.logger.error(f"Error during batched DNC check: {e}")
            try:
                conn.close()
            except:
                pass
            return [
                {
                    'phone': str(phone) if not isinstance(phone, str) else phone,
                    'in_dnc_list': False,
                    'status': 'error',
                    'error': f'Database query error: {str(e)}'
                }
                for phone in phones
            ]

