"""
Cache service for person and phone lookups (CSV + Snowflake dual-layer)

Performance Optimizations:
- LRU eviction for in-memory cache (prevents unbounded memory growth)
- Feature flags: ETL_CACHE_LRU_ENABLED, ETL_CACHE_LRU_MAX_SIZE
"""

import os
import json
import hashlib
import threading
from collections import OrderedDict
from typing import Dict, Optional, List, Any
from datetime import datetime
import pandas as pd

from app.core.config import settings
from app.core.logger import etl_logger
from app.services.etl.snowflake_service import SnowflakeConnection


class LRUCache:
    """
    Thread-safe LRU (Least Recently Used) cache with configurable max size.

    When the cache exceeds max_size, the least recently used entries are evicted.
    This prevents unbounded memory growth in long-running processes.

    Thread-safe: Uses a lock to protect concurrent access.
    """

    def __init__(self, max_size: int = None, name: str = "LRUCache"):
        self.max_size = max_size or settings.etl.cache_lru_max_size
        self.name = name
        self._cache: OrderedDict = OrderedDict()
        self._lock = threading.RLock()
        self._hits = 0
        self._misses = 0
        self._evictions = 0
        self.logger = etl_logger.logger.getChild(f"LRUCache.{name}")

    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache, moving it to end (most recently used).

        Returns None if key not found.
        """
        with self._lock:
            if key in self._cache:
                # Move to end (most recently used)
                self._cache.move_to_end(key)
                self._hits += 1
                return self._cache[key]
            self._misses += 1
            return None

    def set(self, key: str, value: Any):
        """
        Set value in cache, evicting oldest entries if over max size.
        """
        with self._lock:
            # If key exists, update and move to end
            if key in self._cache:
                self._cache[key] = value
                self._cache.move_to_end(key)
                return

            # Add new entry
            self._cache[key] = value

            # Evict oldest entries if over max size
            while len(self._cache) > self.max_size:
                oldest_key = next(iter(self._cache))
                del self._cache[oldest_key]
                self._evictions += 1

    def __contains__(self, key: str) -> bool:
        """Check if key exists in cache (does not update LRU order)"""
        with self._lock:
            return key in self._cache

    def __len__(self) -> int:
        """Return number of items in cache"""
        return len(self._cache)

    def items(self):
        """Return cache items (for iteration/serialization)"""
        with self._lock:
            return list(self._cache.items())

    def clear(self):
        """Clear all entries from cache"""
        with self._lock:
            self._cache.clear()

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        with self._lock:
            total_requests = self._hits + self._misses
            hit_rate = (self._hits / total_requests * 100) if total_requests > 0 else 0
            return {
                "name": self.name,
                "size": len(self._cache),
                "max_size": self.max_size,
                "hits": self._hits,
                "misses": self._misses,
                "hit_rate_percent": round(hit_rate, 2),
                "evictions": self._evictions,
                "utilization_percent": round(len(self._cache) / self.max_size * 100, 2),
            }

    def log_stats(self):
        """Log cache statistics"""
        stats = self.get_stats()
        self.logger.info(
            f"Cache stats: {stats['size']}/{stats['max_size']} entries, "
            f"{stats['hit_rate_percent']}% hit rate, {stats['evictions']} evictions"
        )


class PersonCache:
    """Cache for idiCORE person lookup results (CSV + Snowflake)

    Uses LRU eviction when ETL_CACHE_LRU_ENABLED=true (default) to prevent
    unbounded memory growth in long-running processes.
    """

    def __init__(self, cache_file: str = "person_cache.csv"):
        self.cache_file = cache_file
        self.logger = etl_logger.logger.getChild("PersonCache")
        self.snowflake_cache = None

        # Use LRU cache if enabled (default: True)
        if settings.etl.cache_lru_enabled:
            self._lru_cache = LRUCache(max_size=settings.etl.cache_lru_max_size, name="PersonCache")
            self.cache_data = None  # Not used when LRU is enabled
            self.logger.info(
                f"PersonCache using LRU eviction (max_size={settings.etl.cache_lru_max_size})"
            )
        else:
            self._lru_cache = None
            self.cache_data = {}
            self.logger.info("PersonCache using unbounded dict (LRU disabled)")

        self._load_cache()

    def _get_cache_value(self, key: str) -> Optional[Dict]:
        """Get value from cache (abstracts LRU vs dict)"""
        if self._lru_cache is not None:
            return self._lru_cache.get(key)
        return self.cache_data.get(key)

    def _set_cache_value(self, key: str, value: Dict):
        """Set value in cache (abstracts LRU vs dict)"""
        if self._lru_cache is not None:
            self._lru_cache.set(key, value)
        else:
            self.cache_data[key] = value

    def _get_all_cache_items(self):
        """Get all items from cache for serialization"""
        if self._lru_cache is not None:
            return self._lru_cache.items()
        return self.cache_data.items()

    def _get_cache_size(self) -> int:
        """Get current cache size"""
        if self._lru_cache is not None:
            return len(self._lru_cache)
        return len(self.cache_data)

    def _generate_person_key(
        self,
        first_name: str,
        last_name: str,
        address: str = "",
        city: str = "",
        state: str = "",
        zip_code: str = "",
    ) -> str:
        """Generate a unique cache key for a person"""
        key_parts = [
            first_name.lower().strip(),
            last_name.lower().strip(),
            address.lower().strip(),
            city.lower().strip(),
            state.lower().strip(),
            zip_code.strip(),
        ]
        key_string = "|".join(key_parts)
        return hashlib.md5(key_string.encode()).hexdigest()

    def _load_cache(self):
        """Load cache from CSV file"""
        try:
            if os.path.exists(self.cache_file):
                df = pd.read_csv(self.cache_file)
                loaded_count = 0
                for _, row in df.iterrows():
                    person_key = str(row["person_key"])
                    cache_entry = {
                        "first_name": row["first_name"],
                        "last_name": row["last_name"],
                        "address": row["address"],
                        "city": row["city"],
                        "state": row["state"],
                        "zip_code": row["zip_code"],
                        "phones": json.loads(row["phones"]) if row["phones"] else [],
                        "emails": json.loads(row["emails"]) if row["emails"] else [],
                        "checked_at": row["checked_at"],
                        "status": row["status"],
                    }
                    self._set_cache_value(person_key, cache_entry)
                    loaded_count += 1
                self.logger.info(f"Loaded {loaded_count} cached person lookups from CSV")
            else:
                self.logger.info("No person cache file found, starting fresh")
        except Exception as e:
            self.logger.error(f"Error loading person cache: {e}")
            # Reset cache on error
            if self._lru_cache is not None:
                self._lru_cache.clear()
            else:
                self.cache_data = {}

    def _save_cache(self):
        """Save cache to CSV file"""
        try:
            cache_items = list(self._get_all_cache_items())
            if cache_items:
                data = []
                for person_key, result in cache_items:
                    data.append(
                        {
                            "person_key": person_key,
                            "first_name": result["first_name"],
                            "last_name": result["last_name"],
                            "address": result["address"],
                            "city": result["city"],
                            "state": result["state"],
                            "zip_code": result["zip_code"],
                            "phones": json.dumps(result["phones"]),
                            "emails": json.dumps(result["emails"]),
                            "checked_at": result["checked_at"],
                            "status": result["status"],
                        }
                    )

                df = pd.DataFrame(data)
                df.to_csv(self.cache_file, index=False)
                self.logger.info(f"Saved {len(cache_items)} person lookups to CSV cache")

                # Log LRU stats if enabled
                if self._lru_cache is not None:
                    self._lru_cache.log_stats()
        except Exception as e:
            self.logger.error(f"Error saving person cache: {e}")

    def get_cached_result(
        self,
        first_name: str,
        last_name: str,
        address: str = "",
        city: str = "",
        state: str = "",
        zip_code: str = "",
    ) -> Optional[Dict]:
        """Get cached result - check L1 (memory) first, then L2 (Snowflake)"""
        person_key = self._generate_person_key(
            first_name, last_name, address, city, state, zip_code
        )

        # Check L1 cache first (in-memory LRU or dict)
        cached_result = self._get_cache_value(person_key)
        if cached_result:
            self.logger.debug(f"Cache hit (L1) for {first_name} {last_name}")
            return cached_result

        # Check L2 cache (Snowflake)
        try:
            if self.snowflake_cache is None:
                self.snowflake_cache = SnowflakeCacheService()

            snowflake_result = self.snowflake_cache.check_person_in_cache(
                first_name, last_name, address, city, state, zip_code
            )

            if snowflake_result:
                # Promote to L1 cache for faster future lookups
                self._set_cache_value(person_key, snowflake_result)
                self.logger.debug(f"Cache hit (L2 Snowflake) for {first_name} {last_name}")
                return snowflake_result
        except Exception as e:
            self.logger.warning(f"Error checking Snowflake cache: {e}")

        self.logger.debug(f"Cache miss for {first_name} {last_name}")
        return None

    def get_cached_results_batch(self, people_data: List[Dict]) -> Dict[str, Dict]:
        """
        Batch get cached results for multiple people - check L1 first, then L2 (Snowflake) in batch.

        Args:
            people_data: List of dicts with keys: first_name, last_name, address, city, state, zip_code

        Returns:
            Dict mapping person_key -> cached result (only includes hits, not misses)
        """
        if not people_data:
            return {}

        results = {}
        uncached_for_snowflake = []

        # Step 1: Check L1 cache (in-memory) for all people
        for person in people_data:
            person_key = self._generate_person_key(
                person.get("first_name", ""),
                person.get("last_name", ""),
                person.get("address", ""),
                person.get("city", ""),
                person.get("state", ""),
                person.get("zip_code", ""),
            )
            cached_result = self._get_cache_value(person_key)
            if cached_result:
                results[person_key] = cached_result
            else:
                uncached_for_snowflake.append(person)

        l1_hits = len(results)

        # Step 2: Batch check L2 (Snowflake) for uncached people
        if uncached_for_snowflake:
            try:
                if self.snowflake_cache is None:
                    self.snowflake_cache = SnowflakeCacheService()

                snowflake_results = self.snowflake_cache.check_people_in_cache_batch(
                    uncached_for_snowflake
                )

                # Promote L2 hits to L1 cache
                for person_key, cached_result in snowflake_results.items():
                    results[person_key] = cached_result
                    self._set_cache_value(person_key, cached_result)

            except Exception as e:
                self.logger.warning(f"Error batch checking Snowflake cache: {e}")

        l2_hits = len(results) - l1_hits
        self.logger.info(
            f"Batch cache lookup: {len(people_data)} people, {l1_hits} L1 hits, {l2_hits} L2 hits"
        )

        return results

    def cache_result(
        self,
        first_name: str,
        last_name: str,
        address: str,
        city: str,
        state: str,
        zip_code: str,
        result: Dict,
    ):
        """Cache a person lookup result in both L1 (memory) and L2 (Snowflake)"""
        person_key = self._generate_person_key(
            first_name, last_name, address, city, state, zip_code
        )

        # Cache in L1 (in-memory LRU or dict)
        cache_entry = {
            "first_name": first_name,
            "last_name": last_name,
            "address": address,
            "city": city,
            "state": state,
            "zip_code": zip_code,
            "phones": result.get("phones", []),
            "emails": result.get("emails", []),
            "checked_at": datetime.now().isoformat(),
            "status": result.get("status", "success"),
        }
        self._set_cache_value(person_key, cache_entry)

        # Cache in L2 (Snowflake)
        try:
            if self.snowflake_cache is None:
                self.snowflake_cache = SnowflakeCacheService()

            self.snowflake_cache.add_person_to_cache(
                first_name, last_name, address, city, state, zip_code, result
            )
        except Exception as e:
            self.logger.warning(f"Error caching to Snowflake: {e}")

    def save_cache(self):
        """Save cache to disk"""
        self._save_cache()

    def bulk_add_people_to_cache(self, people_data: List[Dict]):
        """Bulk add people to cache"""
        try:
            if self.snowflake_cache is None:
                self.snowflake_cache = SnowflakeCacheService()

            self.snowflake_cache.bulk_add_people_to_cache(people_data)

            # Also update CSV cache
            for person_data in people_data:
                self.cache_result(
                    person_data["first_name"],
                    person_data["last_name"],
                    person_data["address"],
                    person_data["city"],
                    person_data["state"],
                    person_data["zip_code"],
                    person_data["result"],
                )
        except Exception as e:
            self.logger.error(f"Error in bulk cache add: {e}")


class PhoneCache:
    """Cache for phone number litigator check results (CSV + Snowflake)

    Uses LRU eviction when ETL_CACHE_LRU_ENABLED=true (default) to prevent
    unbounded memory growth in long-running processes.
    """

    def __init__(self, cache_file: str = "phone_cache.csv"):
        self.cache_file = cache_file
        self.logger = etl_logger.logger.getChild("PhoneCache")
        self.snowflake_cache = None

        # Use LRU cache if enabled (default: True)
        if settings.etl.cache_lru_enabled:
            self._lru_cache = LRUCache(max_size=settings.etl.cache_lru_max_size, name="PhoneCache")
            self.cache_data = None  # Not used when LRU is enabled
            self.logger.info(
                f"PhoneCache using LRU eviction (max_size={settings.etl.cache_lru_max_size})"
            )
        else:
            self._lru_cache = None
            self.cache_data = {}
            self.logger.info("PhoneCache using unbounded dict (LRU disabled)")

        self._load_cache()

    def _get_cache_value(self, key: str) -> Optional[Dict]:
        """Get value from cache (abstracts LRU vs dict)"""
        if self._lru_cache is not None:
            return self._lru_cache.get(key)
        return self.cache_data.get(key)

    def _set_cache_value(self, key: str, value: Dict):
        """Set value in cache (abstracts LRU vs dict)"""
        if self._lru_cache is not None:
            self._lru_cache.set(key, value)
        else:
            self.cache_data[key] = value

    def _get_all_cache_items(self):
        """Get all items from cache for serialization"""
        if self._lru_cache is not None:
            return self._lru_cache.items()
        return self.cache_data.items()

    def _get_cache_size(self) -> int:
        """Get current cache size"""
        if self._lru_cache is not None:
            return len(self._lru_cache)
        return len(self.cache_data)

    def _key_in_cache(self, key: str) -> bool:
        """Check if key exists in cache"""
        if self._lru_cache is not None:
            return key in self._lru_cache
        return key in self.cache_data

    def _normalize_phone_key(self, phone: Any) -> str:
        """
        GUARANTEED string conversion for dictionary keys.
        Handles strings, lists, tuples, and other types.

        For lists/tuples with 2 elements like [formatted, cleaned] or (formatted, cleaned),
        extracts the SECOND element (cleaned phone) for consistency between API and cache data.

        Args:
            phone: Phone value that could be string, list, tuple, or other type

        Returns:
            Normalized phone string (never None, returns empty string if conversion fails)
        """
        if phone is None:
            return ""

        # If it's already a string, return it
        if isinstance(phone, str):
            return phone.strip() if phone.strip() else ""

        # List: For [formatted, cleaned] format (from JSON cache), extract SECOND element
        # This ensures consistency with tuple handling for API data
        if isinstance(phone, list):
            if len(phone) >= 2:
                # Format: ["formatted", "cleaned"] - take cleaned (second element)
                result = self._normalize_phone_key(phone[1])
                if result:
                    return result
                # Fallback to first element if second fails
                return self._normalize_phone_key(phone[0])
            elif len(phone) == 1:
                return self._normalize_phone_key(phone[0])
            return ""

        # Tuple: extract second element (cleaned phone) or first
        if isinstance(phone, tuple):
            if len(phone) >= 2:
                # Format: (formatted, cleaned) - take cleaned (second element)
                result = self._normalize_phone_key(phone[1])
                if result:
                    return result
                # Fallback to first element if second fails
                return self._normalize_phone_key(phone[0])
            elif len(phone) == 1:
                return self._normalize_phone_key(phone[0])
            return ""

        # Any other type: force string conversion
        try:
            phone_str = str(phone).strip()
            # CRITICAL: verify we got a string
            if not isinstance(phone_str, str):
                self.logger.error(f"CRITICAL: str() returned non-string: {type(phone_str)}")
                return ""
            return phone_str if phone_str else ""
        except Exception as e:
            self.logger.warning(f"Failed to convert phone value to string: {phone}, error: {e}")
            return ""

    def _load_cache(self):
        """Load cache from CSV file"""
        try:
            if os.path.exists(self.cache_file):
                df = pd.read_csv(self.cache_file)
                loaded_count = 0
                for _, row in df.iterrows():
                    phone = str(row["phone"])
                    cache_entry = {
                        "in_litigator_list": row["in_litigator_list"],
                        "confidence": row["confidence"],
                        "checked_at": row["checked_at"],
                        "status": row["status"],
                    }
                    self._set_cache_value(phone, cache_entry)
                    loaded_count += 1
                self.logger.info(f"Loaded {loaded_count} cached phone numbers from CSV")
            else:
                self.logger.info("No phone cache file found, starting fresh")
        except Exception as e:
            self.logger.error(f"Error loading phone cache: {e}")
            # Reset cache on error
            if self._lru_cache is not None:
                self._lru_cache.clear()
            else:
                self.cache_data = {}

    def _save_cache(self):
        """Save cache to CSV file"""
        try:
            cache_items = list(self._get_all_cache_items())
            if cache_items:
                data = []
                for phone, result in cache_items:
                    data.append(
                        {
                            "phone": phone,
                            "in_litigator_list": result["in_litigator_list"],
                            "confidence": result["confidence"],
                            "checked_at": result["checked_at"],
                            "status": result["status"],
                        }
                    )

                df = pd.DataFrame(data)
                df.to_csv(self.cache_file, index=False)
                self.logger.info(f"Saved {len(cache_items)} phone numbers to CSV cache")

                # Log LRU stats if enabled
                if self._lru_cache is not None:
                    self._lru_cache.log_stats()
        except Exception as e:
            self.logger.error(f"Error saving phone cache: {e}")

    def get_cached_result(self, phone: Any) -> Optional[Dict]:
        """Get cached result - check L1 (memory) first, then L2 (Snowflake)"""
        # Normalize phone to string before using as dictionary key
        phone_key = self._normalize_phone_key(phone)
        if not phone_key:
            self.logger.warning(f"Invalid phone value for cache lookup: {phone}")
            return None

        # Check L1 cache first (in-memory LRU or dict)
        cached_result = self._get_cache_value(phone_key)
        if cached_result:
            self.logger.debug(f"Cache hit (L1) for phone {phone_key}")
            return cached_result

        # Check L2 cache (Snowflake)
        try:
            if self.snowflake_cache is None:
                self.snowflake_cache = SnowflakeCacheService()

            snowflake_result = self.snowflake_cache.check_phone_in_cache(phone_key)

            if snowflake_result:
                # Promote to L1 cache
                self._set_cache_value(phone_key, snowflake_result)
                self.logger.debug(f"Cache hit (L2 Snowflake) for phone {phone_key}")
                return snowflake_result
        except Exception as e:
            self.logger.warning(f"Error checking Snowflake cache: {e}")

        self.logger.debug(f"Cache miss for phone {phone_key}")
        return None

    def cache_result(self, phone: Any, result: Dict):
        """Cache a phone number check result in both L1 (memory) and L2 (Snowflake)"""
        # Normalize phone to string before using as dictionary key
        phone_key = self._normalize_phone_key(phone)
        if not phone_key:
            self.logger.warning(f"Invalid phone value for cache storage: {phone}")
            return

        # Cache in L1 (in-memory LRU or dict)
        cache_entry = {
            "in_litigator_list": result.get("in_litigator_list", False),
            "confidence": result.get("confidence", 0.0),
            "checked_at": datetime.now().isoformat(),
            "status": result.get("status", "unknown"),
        }
        self._set_cache_value(phone_key, cache_entry)

        # Cache in L2 (Snowflake)
        try:
            if self.snowflake_cache is None:
                self.snowflake_cache = SnowflakeCacheService()

            self.snowflake_cache.add_phone_to_cache(phone_key, result)
        except Exception as e:
            self.logger.warning(f"Error caching to Snowflake: {e}")

    def save_cache(self):
        """Save cache to disk"""
        self._save_cache()

    def get_uncached_phones(self, phones: List[Any]) -> List[str]:
        """Get list of phones that are not in cache"""
        uncached = []
        for phone in phones:
            phone_key = self._normalize_phone_key(phone)
            if phone_key and not self._key_in_cache(phone_key):
                uncached.append(phone_key)
        return uncached

    def get_cached_results(self, phones: List[Any]) -> List[Dict]:
        """Get cached results for multiple phones"""
        results = []
        for phone in phones:
            # Normalize phone for consistent lookup
            phone_key = self._normalize_phone_key(phone)
            if not phone_key:
                results.append(None)
                continue

            cached = self.get_cached_result(phone_key)
            if cached:
                results.append(
                    {
                        "phone": phone_key,
                        "cleaned_phone": phone_key,
                        "in_litigator_list": cached["in_litigator_list"],
                        "confidence": cached["confidence"],
                        "status": "success",
                        "cached": True,
                    }
                )
            else:
                results.append(None)
        return results


class SnowflakeCacheService:
    """Service for checking and updating Snowflake cache tables"""

    def __init__(self):
        self.snowflake_conn = SnowflakeConnection()
        self.logger = etl_logger.logger.getChild("SnowflakeCache")
        self.database_name = "PROCESSED_DATA_DB"
        self.schema_name = "PUBLIC"

        # Ensure connection is established
        if not self.snowflake_conn.connect():
            self.logger.error("Failed to connect to Snowflake")
            raise Exception("Cannot connect to Snowflake")

    def check_person_in_cache(
        self,
        first_name: str,
        last_name: str,
        address: str = "",
        city: str = "",
        state: str = "",
        zip_code: str = "",
    ) -> Optional[Dict]:
        """Check if person exists in Snowflake person cache"""
        try:
            import hashlib

            # Generate person key
            key_parts = [
                first_name.lower().strip(),
                last_name.lower().strip(),
                address.lower().strip(),
                city.lower().strip(),
                state.lower().strip(),
                zip_code.strip(),
            ]
            key_string = "|".join(key_parts)
            person_key = hashlib.md5(key_string.encode()).hexdigest()

            query = f"""
            SELECT "person_key", "first_name", "last_name", "address", "city", "state", "zip_code",
                   "phones", "emails", "checked_at", "status"
            FROM {self.database_name}.{self.schema_name}.PERSON_CACHE
            WHERE "person_key" = '{person_key}'
            LIMIT 1
            """

            result_df = self.snowflake_conn.execute_query(query)

            if result_df is not None and not result_df.empty:
                row = result_df.iloc[0]
                # Parse phones and emails from JSON strings
                phones = []
                emails = []

                try:
                    if pd.notna(row["phones"]) and row["phones"]:
                        phones = json.loads(row["phones"])
                except (json.JSONDecodeError, TypeError):
                    phones = []

                try:
                    if pd.notna(row["emails"]) and row["emails"]:
                        emails = json.loads(row["emails"])
                except (json.JSONDecodeError, TypeError):
                    emails = []

                return {
                    "person_key": row["person_key"],
                    "first_name": row["first_name"],
                    "last_name": row["last_name"],
                    "address": row["address"],
                    "city": row["city"],
                    "state": row["state"],
                    "zip_code": row["zip_code"],
                    "phones": phones,
                    "emails": emails,
                    "checked_at": row["checked_at"],
                    "status": row["status"],
                }

            return None

        except Exception as e:
            self.logger.error(f"Error checking person in Snowflake cache: {e}")
            return None

    def check_people_in_cache_batch(self, people_data: List[Dict]) -> Dict[str, Dict]:
        """
        Batch check multiple people in Snowflake cache with a single query.

        Args:
            people_data: List of dicts with keys: first_name, last_name, address, city, state, zip_code

        Returns:
            Dict mapping person_key -> cached result dict
        """
        if not people_data:
            return {}

        try:
            import hashlib

            # Generate all person keys upfront
            person_keys = []
            key_to_person = {}

            for person in people_data:
                key_parts = [
                    str(person.get("first_name", "")).lower().strip(),
                    str(person.get("last_name", "")).lower().strip(),
                    str(person.get("address", "")).lower().strip(),
                    str(person.get("city", "")).lower().strip(),
                    str(person.get("state", "")).lower().strip(),
                    str(person.get("zip_code", "")).strip(),
                ]
                key_string = "|".join(key_parts)
                person_key = hashlib.md5(key_string.encode()).hexdigest()
                person_keys.append(person_key)
                key_to_person[person_key] = person

            if not person_keys:
                return {}

            # Batch query with IN clause (chunk if too many keys to avoid query size limits)
            results = {}
            chunk_size = 500  # Snowflake handles large IN clauses well

            for i in range(0, len(person_keys), chunk_size):
                chunk_keys = person_keys[i : i + chunk_size]
                keys_str = ", ".join([f"'{k}'" for k in chunk_keys])

                query = f"""
                SELECT "person_key", "first_name", "last_name", "address", "city", "state", "zip_code",
                       "phones", "emails", "checked_at", "status"
                FROM {self.database_name}.{self.schema_name}.PERSON_CACHE
                WHERE "person_key" IN ({keys_str})
                """

                result_df = self.snowflake_conn.execute_query(query)

                if result_df is not None and not result_df.empty:
                    for _, row in result_df.iterrows():
                        # Parse phones and emails from JSON strings
                        phones = []
                        emails = []

                        try:
                            if pd.notna(row["phones"]) and row["phones"]:
                                phones = json.loads(row["phones"])
                        except (json.JSONDecodeError, TypeError):
                            phones = []

                        try:
                            if pd.notna(row["emails"]) and row["emails"]:
                                emails = json.loads(row["emails"])
                        except (json.JSONDecodeError, TypeError):
                            emails = []

                        results[row["person_key"]] = {
                            "person_key": row["person_key"],
                            "first_name": row["first_name"],
                            "last_name": row["last_name"],
                            "address": row["address"],
                            "city": row["city"],
                            "state": row["state"],
                            "zip_code": row["zip_code"],
                            "phones": phones,
                            "emails": emails,
                            "checked_at": row["checked_at"],
                            "status": row["status"],
                        }

            self.logger.info(
                f"Batch cache lookup: {len(person_keys)} keys queried, {len(results)} hits"
            )
            return results

        except Exception as e:
            self.logger.error(f"Error in batch person cache lookup: {e}")
            return {}

    def add_person_to_cache(
        self,
        first_name: str,
        last_name: str,
        address: str,
        city: str,
        state: str,
        zip_code: str,
        result: Dict,
    ):
        """Add person lookup result to Snowflake cache"""
        try:
            import hashlib

            # Generate person key
            key_parts = [
                first_name.lower().strip(),
                last_name.lower().strip(),
                address.lower().strip(),
                city.lower().strip(),
                state.lower().strip(),
                zip_code.strip(),
            ]
            key_string = "|".join(key_parts)
            person_key = hashlib.md5(key_string.encode()).hexdigest()

            # Prepare data for insertion
            phones_json = json.dumps(result.get("phones", []))
            emails_json = json.dumps(result.get("emails", []))
            checked_at = datetime.now().isoformat()
            status_val = result.get("status", "success")

            # Escape single quotes
            first_name_escaped = first_name.replace("'", "''")
            last_name_escaped = last_name.replace("'", "''")
            address_escaped = address.replace("'", "''")
            city_escaped = city.replace("'", "''")
            state_escaped = state.replace("'", "''")
            phones_json_escaped = phones_json.replace("'", "''")
            emails_json_escaped = emails_json.replace("'", "''")

            # Use MERGE statement for upsert
            merge_sql = f"""
            MERGE INTO {self.database_name}.{self.schema_name}.PERSON_CACHE AS target
            USING (SELECT
                '{person_key}' as "person_key",
                '{first_name_escaped}' as "first_name",
                '{last_name_escaped}' as "last_name",
                '{address_escaped}' as "address",
                '{city_escaped}' as "city",
                '{state_escaped}' as "state",
                '{zip_code}' as "zip_code",
                '{phones_json_escaped}' as "phones",
                '{emails_json_escaped}' as "emails",
                '{checked_at}' as "checked_at",
                '{status_val}' as "status"
            ) AS source
            ON target."person_key" = source."person_key"
            WHEN MATCHED THEN
                UPDATE SET
                    "phones" = source."phones",
                    "emails" = source."emails",
                    "checked_at" = source."checked_at",
                    "status" = source."status"
            WHEN NOT MATCHED THEN
                INSERT ("person_key", "first_name", "last_name", "address", "city", "state", "zip_code",
                       "phones", "emails", "checked_at", "status")
                VALUES (source."person_key", source."first_name", source."last_name", source."address",
                       source."city", source."state", source."zip_code", source."phones", source."emails",
                       source."checked_at", source."status")
            """

            self.snowflake_conn.execute_query(merge_sql)

        except Exception as e:
            self.logger.error(f"Error adding person to Snowflake cache: {e}")

    def bulk_add_people_to_cache(self, people_data: List[Dict]):
        """Bulk add people to Snowflake cache"""
        try:
            import hashlib

            values_parts = []
            for person_data in people_data:
                first_name = person_data["first_name"]
                last_name = person_data["last_name"]
                address = person_data.get("address", "")
                city = person_data.get("city", "")
                state = person_data.get("state", "")
                zip_code = person_data.get("zip_code", "")
                result = person_data["result"]

                # Generate person key
                key_parts = [
                    first_name.lower().strip(),
                    last_name.lower().strip(),
                    address.lower().strip(),
                    city.lower().strip(),
                    state.lower().strip(),
                    zip_code.strip(),
                ]
                key_string = "|".join(key_parts)
                person_key = hashlib.md5(key_string.encode()).hexdigest()

                phones_json = json.dumps(result.get("phones", []))
                emails_json = json.dumps(result.get("emails", []))
                checked_at = datetime.now().isoformat()
                status_val = result.get("status", "success")

                # Escape single quotes
                first_name_escaped = first_name.replace("'", "''")
                last_name_escaped = last_name.replace("'", "''")
                address_escaped = address.replace("'", "''")
                city_escaped = city.replace("'", "''")
                state_escaped = state.replace("'", "''")
                phones_json_escaped = phones_json.replace("'", "''")
                emails_json_escaped = emails_json.replace("'", "''")

                values_parts.append(
                    f"('{person_key}', '{first_name_escaped}', '{last_name_escaped}', "
                    f"'{address_escaped}', '{city_escaped}', '{state_escaped}', '{zip_code}', "
                    f"'{phones_json_escaped}', '{emails_json_escaped}', '{checked_at}', '{status_val}')"
                )

            if values_parts:
                # Batch insert (use MERGE for upsert)
                batch_size = 100
                for i in range(0, len(values_parts), batch_size):
                    batch = values_parts[i : i + batch_size]
                    values_clause = ",\n                ".join(batch)

                    merge_sql = f"""
                    MERGE INTO {self.database_name}.{self.schema_name}.PERSON_CACHE AS target
                    USING (SELECT * FROM VALUES {values_clause} AS t("person_key", "first_name", "last_name",
                          "address", "city", "state", "zip_code", "phones", "emails", "checked_at", "status")) AS source
                    ON target."person_key" = source."person_key"
                    WHEN MATCHED THEN
                        UPDATE SET
                            "phones" = source."phones",
                            "emails" = source."emails",
                            "checked_at" = source."checked_at",
                            "status" = source."status"
                    WHEN NOT MATCHED THEN
                        INSERT ("person_key", "first_name", "last_name", "address", "city", "state", "zip_code",
                               "phones", "emails", "checked_at", "status")
                        VALUES (source."person_key", source."first_name", source."last_name", source."address",
                               source."city", source."state", source."zip_code", source."phones", source."emails",
                               source."checked_at", source."status")
                    """

                    self.snowflake_conn.execute_query(merge_sql)

            self.logger.info(f"Bulk added {len(people_data)} people to Snowflake cache")

        except Exception as e:
            self.logger.error(f"Error in bulk add to Snowflake cache: {e}")

    def check_phone_in_cache(self, phone: str) -> Optional[Dict]:
        """Check if phone exists in Snowflake phone cache"""
        try:
            query = f"""
            SELECT "phone", "in_litigator_list", "confidence", "checked_at", "status"
            FROM {self.database_name}.{self.schema_name}.PHONE_CACHE
            WHERE "phone" = '{phone}'
            LIMIT 1
            """

            result_df = self.snowflake_conn.execute_query(query)

            if result_df is not None and not result_df.empty:
                row = result_df.iloc[0]
                return {
                    "phone": row["phone"],
                    "in_litigator_list": row["in_litigator_list"],
                    "confidence": row["confidence"],
                    "checked_at": row["checked_at"],
                    "status": row["status"],
                }

            return None

        except Exception as e:
            self.logger.error(f"Error checking phone in Snowflake cache: {e}")
            return None

    def add_phone_to_cache(self, phone: str, result: Dict):
        """Add phone check result to Snowflake cache"""
        try:
            checked_at = datetime.now().isoformat()
            in_litigator = result.get("in_litigator_list", False)
            confidence = result.get("confidence", 0.0)
            status_val = result.get("status", "success")

            merge_sql = f"""
            MERGE INTO {self.database_name}.{self.schema_name}.PHONE_CACHE AS target
            USING (SELECT
                '{phone}' as "phone",
                {in_litigator} as "in_litigator_list",
                {confidence} as "confidence",
                '{checked_at}' as "checked_at",
                '{status_val}' as "status"
            ) AS source
            ON target."phone" = source."phone"
            WHEN MATCHED THEN
                UPDATE SET
                    "in_litigator_list" = source."in_litigator_list",
                    "confidence" = source."confidence",
                    "checked_at" = source."checked_at",
                    "status" = source."status"
            WHEN NOT MATCHED THEN
                INSERT ("phone", "in_litigator_list", "confidence", "checked_at", "status")
                VALUES (source."phone", source."in_litigator_list", source."confidence",
                       source."checked_at", source."status")
            """

            self.snowflake_conn.execute_query(merge_sql)

        except Exception as e:
            self.logger.error(f"Error adding phone to Snowflake cache: {e}")

    def bulk_add_phones_to_cache(self, phone_results: List[Dict]):
        """Bulk add phones to Snowflake cache"""
        try:
            values_parts = []
            for result in phone_results:
                phone = result["phone"]
                in_litigator = result.get("in_litigator_list", False)
                confidence = result.get("confidence", 0.0)
                checked_at = datetime.now().isoformat()
                status_val = result.get("status", "success")

                values_parts.append(
                    f"('{phone}', {in_litigator}, {confidence}, '{checked_at}', '{status_val}')"
                )

            if values_parts:
                batch_size = 100
                for i in range(0, len(values_parts), batch_size):
                    batch = values_parts[i : i + batch_size]
                    values_clause = ",\n                ".join(batch)

                    merge_sql = f"""
                    MERGE INTO {self.database_name}.{self.schema_name}.PHONE_CACHE AS target
                    USING (SELECT * FROM VALUES {values_clause} AS t("phone", "in_litigator_list",
                          "confidence", "checked_at", "status")) AS source
                    ON target."phone" = source."phone"
                    WHEN MATCHED THEN
                        UPDATE SET
                            "in_litigator_list" = source."in_litigator_list",
                            "confidence" = source."confidence",
                            "checked_at" = source."checked_at",
                            "status" = source."status"
                    WHEN NOT MATCHED THEN
                        INSERT ("phone", "in_litigator_list", "confidence", "checked_at", "status")
                        VALUES (source."phone", source."in_litigator_list", source."confidence",
                               source."checked_at", source."status")
                    """

                    self.snowflake_conn.execute_query(merge_sql)

            self.logger.info(f"Bulk added {len(phone_results)} phones to Snowflake cache")

        except Exception as e:
            self.logger.error(f"Error in bulk add phones to Snowflake cache: {e}")

    def get_cache_stats(self) -> Dict:
        """Get cache statistics"""
        try:
            person_query = f"""
            SELECT COUNT(*) as count
            FROM {self.database_name}.{self.schema_name}.PERSON_CACHE
            """
            person_result = self.snowflake_conn.execute_query(person_query)
            person_count = (
                int(person_result.iloc[0]["count"])
                if person_result is not None and not person_result.empty
                else 0
            )

            phone_query = f"""
            SELECT COUNT(*) as count
            FROM {self.database_name}.{self.schema_name}.PHONE_CACHE
            """
            phone_result = self.snowflake_conn.execute_query(phone_query)
            phone_count = (
                int(phone_result.iloc[0]["count"])
                if phone_result is not None and not phone_result.empty
                else 0
            )

            return {"person_cache_count": person_count, "phone_cache_count": phone_count}
        except Exception as e:
            self.logger.error(f"Error getting cache stats: {e}")
            return {"person_cache_count": 0, "phone_cache_count": 0}
