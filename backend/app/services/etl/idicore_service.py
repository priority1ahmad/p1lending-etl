"""
idiCORE API Service for real phone number lookups (ported from old_app)
"""

import base64
import requests
import time
import json
from typing import List, Dict, Any, Optional
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

from app.core.config import settings
from app.core.logger import etl_logger
from app.services.etl.cache_service import PersonCache, SnowflakeCacheService
from app.core.concurrency import calculate_optimal_workers, log_worker_decision
from app.core.retry import exponential_backoff_retry, CircuitBreaker, CircuitBreakerOpen


class IdiCOREAPIService:
    """idiCORE API service for real phone number lookups"""

    def __init__(self, client_id: str = None, client_secret: str = None):
        """Initialize idiCORE API service"""
        # Production API endpoints
        self.auth_url = settings.idicore.auth_url
        self.search_url = settings.idicore.search_url

        # Use provided credentials or fall back to settings
        self.clientid = client_id or settings.idicore.client_id
        self.clientsecret = client_secret or settings.idicore.client_secret
        self.logger = etl_logger.logger.getChild("IdiCORE")
        self.session = requests.Session()
        self.auth_token = None
        self.token_expiry = None
        self._token_lock = threading.RLock()  # Thread-safe token management

        # Initialize caches - Snowflake as primary, CSV as backup
        self.snowflake_cache = None  # Lazy initialization
        self.person_cache = PersonCache()  # Keep CSV cache as backup

        # Circuit breaker for rate limiting protection
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=10,  # Higher threshold for idiCORE
            recovery_timeout=60.0,
            success_threshold=3,
            logger=self.logger,
        )

    def _ensure_snowflake_cache(self):
        """Lazy initialization of Snowflake cache - only create when needed"""
        if self.snowflake_cache is None:
            try:
                self.snowflake_cache = SnowflakeCacheService()
            except Exception as e:
                self.logger.warning(
                    f"Could not initialize Snowflake cache: {e}. Cache operations will be skipped."
                )
                self.snowflake_cache = None

    def _clean_phone_number(self, phone: str) -> str:
        """Clean phone number to match CCC API format (10 digits, no hyphens)"""
        digits = "".join(filter(str.isdigit, phone))

        if len(digits) == 10:
            return digits
        elif len(digits) == 11 and digits.startswith("1"):
            return digits[1:]  # Remove country code
        else:
            return digits

    def _get_auth_token(self) -> Optional[str]:
        """Get authentication token from idiCORE API (thread-safe)"""
        # Fast path: check without lock first (double-check locking pattern)
        if self.auth_token and self.token_expiry and time.time() < self.token_expiry:
            return self.auth_token

        # Slow path: acquire lock and refresh token
        with self._token_lock:
            try:
                # Re-check after acquiring lock (another thread may have refreshed)
                if self.auth_token and self.token_expiry and time.time() < self.token_expiry:
                    return self.auth_token

                self.logger.info("Getting new authentication token from idiCORE API")

                # Validate credentials are present
                if not self.clientid or not self.clientsecret:
                    self.logger.error(
                        "❌ Missing IDI credentials: client_id or client_secret is empty"
                    )
                    return None

                # Debug log (without exposing full secret)
                self.logger.debug(
                    f"Using client_id: {self.clientid}, secret length: {len(self.clientsecret)}"
                )

                payload = '{"glba":"otheruse","dppa":"none"}'

                # Create Basic Auth header
                credentials = f"{self.clientid}:{self.clientsecret}"
                encoded_credentials = (
                    base64.b64encode(credentials.encode()).decode().replace("\n", "")
                )

                headers = {
                    "authorization": f"Basic {encoded_credentials}",
                    "content-type": "application/json",
                }

                self.logger.debug(f"Auth URL: {self.auth_url}")
                self.logger.debug(f"Payload: {payload}")

                response = self.session.post(
                    self.auth_url, data=payload, headers=headers, timeout=30
                )

                # Log response details for debugging
                self.logger.debug(f"Response status: {response.status_code}")
                if response.status_code != 200:
                    self.logger.error(
                        f"❌ Auth failed with status {response.status_code}: {response.text[:200]}"
                    )

                response.raise_for_status()

                self.auth_token = response.text
                # Token expires in 15 minutes, set expiry to 14 minutes to be safe
                self.token_expiry = time.time() + (14 * 60)

                self.logger.info("✅ Successfully obtained authentication token")
                return self.auth_token

            except requests.exceptions.HTTPError as e:
                error_msg = str(e)
                if hasattr(e.response, "text"):
                    error_msg += f" - Response: {e.response.text[:200]}"
                self.logger.error(
                    f"❌ Failed to get authentication token (HTTP {e.response.status_code if hasattr(e, 'response') else 'unknown'}): {error_msg}"
                )
                return None
            except Exception as e:
                self.logger.error(f"❌ Failed to get authentication token: {e}", exc_info=True)
                return None

    def _lookup_person_phones_and_emails_with_session(
        self,
        first_name: str,
        last_name: str,
        address: str,
        city: str,
        state: str,
        zip_code: str,
        session: requests.Session,
    ) -> Dict[str, Any]:
        """Look up top 3 phone numbers for a person using idiCORE API with custom session and retry logic"""
        try:
            # Convert all inputs to strings and handle None/NaN values
            first_name = str(first_name) if first_name is not None else ""
            last_name = str(last_name) if last_name is not None else ""
            address = str(address) if address is not None else ""
            city = str(city) if city is not None else ""
            state = str(state) if state is not None else ""
            zip_code = str(zip_code) if zip_code is not None else ""

            # Handle float values (e.g., "123.0" -> "123")
            if address.endswith(".0"):
                address = address[:-2]
            if city.endswith(".0"):
                city = city[:-2]
            if state.endswith(".0"):
                state = state[:-2]
            if zip_code.endswith(".0"):
                zip_code = zip_code[:-2]

            # Wrap API call with exponential backoff retry
            @exponential_backoff_retry(
                max_retries=settings.idicore.max_retries,
                base_delay=settings.idicore.retry_base_delay,
                max_delay=settings.idicore.retry_max_delay,
                retry_on=(requests.exceptions.HTTPError, requests.exceptions.Timeout),
                logger=self.logger,
            )
            def _make_api_call():
                # Get authentication token
                token = self._get_auth_token()
                if not token:
                    raise Exception("Failed to obtain authentication token")

                # Prepare search request
                search_data = {
                    "lastName": last_name.upper(),
                    "firstName": first_name.upper(),
                    "referenceId": f"ETL-{int(time.time())}-{threading.current_thread().ident}",
                    "fields": ["phone", "email"],  # Request both phones and emails
                }

                # Only include location fields if we have them
                if address and address.strip():
                    search_data["address"] = address.upper()
                if city and city.strip():
                    search_data["city"] = city.upper()
                if state and state.strip():
                    search_data["state"] = state.upper()
                if zip_code and zip_code.strip():
                    search_data["zip"] = zip_code

                headers = {
                    "authorization": token,
                    "content-type": "application/json",
                    "accept": "application/json",
                }

                # Make search request with circuit breaker protection
                json_body = json.dumps(search_data)
                response = self.circuit_breaker.call(
                    session.post,
                    self.search_url,
                    data=json_body,
                    headers=headers,
                    timeout=settings.idicore.timeout,
                )
                response.raise_for_status()
                return response.json()

            # Execute API call with retry logic
            result = _make_api_call()

            # Initialize results
            phone_pairs = []  # List of (formatted, cleaned) tuples
            emails = []  # List of email addresses
            display_phone = ""

            if "result" in result and len(result["result"]) > 0:
                person = result["result"][0]

                # Extract top 3 phone numbers
                if "phone" in person and len(person["phone"]) > 0:
                    sorted_phones = sorted(
                        person["phone"], key=lambda x: x.get("meta", {}).get("rank", 999)
                    )

                    for phone_data in sorted_phones[:3]:
                        formatted_phone = phone_data.get("number", "")
                        if formatted_phone:
                            cleaned_phone = self._clean_phone_number(formatted_phone)
                            phone_pairs.append((formatted_phone, cleaned_phone))

                            if not display_phone:
                                display_phone = cleaned_phone

                # Extract top 3 email addresses
                if "email" in person and len(person["email"]) > 0:
                    sorted_emails = sorted(
                        person["email"], key=lambda x: x.get("meta", {}).get("rank", 999)
                    )
                    for email_data in sorted_emails[:3]:
                        email = email_data.get("address", "")
                        if email:
                            emails.append(email)

            return {
                "phones": phone_pairs,
                "emails": emails,
                "display_phone": display_phone,
                "status": "success",
            }

        except CircuitBreakerOpen as e:
            self.logger.error(f"⚠️ Circuit breaker open for {first_name} {last_name}: {e}")
            return {
                "phones": [],
                "emails": [],
                "display_phone": "",
                "status": "circuit_breaker_open",
            }
        except Exception as e:
            self.logger.error(f"❌ Error looking up phones for {first_name} {last_name}: {e}")
            return {"phones": [], "emails": [], "display_phone": "", "status": "error"}

    def lookup_person_phones_and_emails(
        self, first_name: str, last_name: str, address: str, city: str, state: str, zip_code: str
    ) -> Dict[str, Any]:
        """Look up top 3 phone numbers and emails for a person using idiCORE API"""
        return self._lookup_person_phones_and_emails_with_session(
            first_name, last_name, address, city, state, zip_code, self.session
        )

    def _lookup_single_person_without_caching(self, person: Dict[str, str]) -> Dict[str, Any]:
        """Process a single person with individual API call without caching (for parallel processing)"""
        try:
            # Create a new session for this thread to avoid sharing issues
            thread_session = requests.Session()

            # Make individual API call for this person using thread-specific session
            person_data = self._lookup_person_phones_and_emails_with_session(
                person["first_name"],
                person["last_name"],
                person["address"],
                person["city"],
                person["state"],
                person["zip_code"],
                thread_session,
            )

            return person_data

        except Exception as e:
            self.logger.error(
                f"❌ Error processing individual person {person.get('first_name', '')} {person.get('last_name', '')}: {e}"
            )
            return {"phones": [], "emails": [], "display_phone": "", "status": "error"}

    def _lookup_uncached_people_threaded(
        self, people_data: List[Dict[str, str]], max_workers: int = 150
    ) -> List[Dict[str, Any]]:
        """Look up phone numbers for uncached people with parallel individual requests"""
        results = []
        total_people = len(people_data)

        self.logger.info(
            f"🚀 Starting parallel API calls for {total_people} uncached people using {max_workers} threads"
        )

        # Use ThreadPoolExecutor for parallel individual requests
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_index = {
                executor.submit(self._lookup_single_person_without_caching, person): i
                for i, person in enumerate(people_data)
            }

            results = [None] * total_people

            for future in as_completed(future_to_index):
                index = future_to_index[future]
                try:
                    person_data = future.result()
                    results[index] = person_data
                except Exception as e:
                    person = people_data[index]
                    self.logger.error(
                        f"❌ Error processing individual request for {person.get('first_name', '')} {person.get('last_name', '')}: {e}"
                    )
                    results[index] = {
                        "phones": [],
                        "emails": [],
                        "display_phone": "",
                        "status": "error",
                    }

        # Collect all person data for bulk Snowflake upload
        bulk_cache_data = []
        for i, person in enumerate(people_data):
            result = results[i]
            bulk_cache_data.append(
                {
                    "first_name": person["first_name"],
                    "last_name": person["last_name"],
                    "address": person["address"],
                    "city": person["city"],
                    "state": person["state"],
                    "zip_code": person["zip_code"],
                    "result": result,
                }
            )

            # Cache in CSV immediately
            self.person_cache.cache_result(
                person["first_name"],
                person["last_name"],
                person["address"],
                person["city"],
                person["state"],
                person["zip_code"],
                result,
            )

        # Bulk upload to Snowflake
        if bulk_cache_data:
            self._ensure_snowflake_cache()
            if self.snowflake_cache:
                self.logger.info(f"Bulk uploading {len(bulk_cache_data)} API results to Snowflake")
                self.snowflake_cache.bulk_add_people_to_cache(bulk_cache_data)

        found_phones = sum(len(r["phones"]) for r in results if r)
        self.logger.info(
            f"✅ Parallel API calls completed: {len(results)} people, {found_phones} phones found"
        )

        return results

    def lookup_multiple_people_phones_and_emails_batch(
        self, people_data: List[Dict[str, str]], batch_size: int = None
    ) -> List[Dict[str, Any]]:
        """
        Look up phone numbers for a batch of people with dynamic threading and caching.
        Uses batch cache lookups for performance optimization.

        Args:
            people_data: List of dictionaries with person information
            batch_size: Optional override for worker count (uses dynamic calculation if None)

        Returns:
            List of dictionaries with phones, emails, and display_phone for each person
        """
        if not people_data:
            return []

        # Calculate optimal worker count dynamically
        if batch_size is None:
            batch_size = calculate_optimal_workers(
                workload_size=len(people_data),
                batch_size=1,  # Individual API calls
                min_workers=settings.idicore.min_workers,
                max_workers=settings.idicore.max_workers,
                workers_per_batch=settings.idicore.workers_scaling_factor,
            )

            log_worker_decision(
                logger=self.logger,
                workload_size=len(people_data),
                batch_size=1,
                calculated_workers=batch_size,
                reason="idiCORE phone lookup - individual API calls",
            )

        self.logger.info(
            f"🔧 Processing batch of {len(people_data)} people for idiCORE lookup "
            f"using {batch_size} threads (dynamic calculation)"
        )

        # Batch cache lookup (single Snowflake query instead of N queries)
        cached_results = self.person_cache.get_cached_results_batch(people_data)

        # Separate cached vs uncached people
        results = []
        uncached_people = []
        uncached_indices = []

        for i, person in enumerate(people_data):
            # Generate person key to check cache
            import hashlib

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

            if person_key in cached_results:
                # Found in cache
                cached = cached_results[person_key]
                result = {
                    "phones": cached.get("phones", []),
                    "emails": cached.get("emails", []),
                    "status": "success",
                    "source": "cache",
                }
                results.append(result)
            else:
                # Not in cache, need API call
                uncached_people.append(person)
                uncached_indices.append(i)
                results.append(None)  # Placeholder for API result

        cache_hits = len(people_data) - len(uncached_people)
        self.logger.info(f"Cache lookup complete: {cache_hits} hits, {len(uncached_people)} misses")

        # Only do API calls for uncached people
        if uncached_people:
            self.logger.info(f"Making API calls for {len(uncached_people)} uncached people")
            api_results = self._lookup_uncached_people_threaded(
                uncached_people, max_workers=batch_size
            )

            # Replace None placeholders with API results
            for idx, api_result in zip(uncached_indices, api_results):
                results[idx] = api_result
        else:
            self.logger.info("All people found in cache, no API calls needed")

        return results
