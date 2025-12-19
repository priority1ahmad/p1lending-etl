"""
Main ETL engine that orchestrates the entire ETL process (ported from old_app)
"""

import os
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any, Callable, Set
import pandas as pd

from app.core.config import settings
from app.core.logger import etl_logger, JobLogger
from app.services.etl.snowflake_service import SnowflakeConnection
from app.services.etl.idicore_service import IdiCOREAPIService
from app.services.etl.ccc_service import CCCAPIService
from app.services.etl.dnc_service import DNCCheckerDB
from app.services.etl.results_service import get_results_service
from app.services.blacklist_service import get_blacklist_service_sync


class ETLEngine:
    """Main ETL engine for orchestrating SQL data processing and storage to Snowflake"""

    def __init__(
        self,
        job_id: Optional[str] = None,
        log_callback: Optional[Callable] = None,
        table_id: Optional[str] = None,
        table_title: Optional[str] = None
    ):
        self.snowflake_conn = SnowflakeConnection()
        self.ccc_api = CCCAPIService()
        self.dnc_checker = DNCCheckerDB()
        self.idicore_service = IdiCOREAPIService()
        self.results_service = get_results_service()
        self.blacklist_service = get_blacklist_service_sync()
        self.logger = JobLogger("ETLEngine", etl_logger, job_id=job_id, log_callback=log_callback)
        self.consolidated_data = []
        self.table_id = table_id
        self.table_title = table_title
        self._blacklisted_phones: Set[str] = set()  # Cache for blacklisted phones
        self._blacklist_loaded = False

    def _sanitize_sql_for_subquery(self, sql: str) -> str:
        """
        Sanitize SQL for use in subqueries or CTEs.

        Removes trailing semicolons which cause syntax errors when SQL
        is wrapped in parentheses (e.g., SELECT * FROM (user_sql) AS t).
        Also handles Windows line endings (CRLF) and multiple semicolons.

        Args:
            sql: User's original SQL script

        Returns:
            Sanitized SQL safe for subquery wrapping
        """
        if not sql:
            return sql

        # Normalize line endings to Unix style (handles CRLF from Windows)
        clean = sql.replace('\r\n', '\n').replace('\r', '\n')

        # Remove leading/trailing whitespace
        clean = clean.strip()

        # Remove all trailing semicolons (handles multiple ';' patterns)
        while clean.endswith(';'):
            clean = clean[:-1].strip()

        return clean

    def _load_blacklisted_phones(self) -> None:
        """
        Load blacklisted phones from PostgreSQL database.
        This is called once before processing to avoid repeated DB queries.
        """
        if self._blacklist_loaded:
            return

        try:
            from app.db.session import sync_session_factory
            with sync_session_factory() as db_session:
                self._blacklisted_phones = self.blacklist_service.load_all_blacklisted_phones_sync(
                    db_session=db_session
                )
                self._blacklist_loaded = True
                self.logger.log_step(
                    "Blacklist Load",
                    f"Loaded {len(self._blacklisted_phones)} blacklisted phones"
                )
        except Exception as e:
            self.logger.logger.warning(f"Failed to load blacklist: {e}. Continuing without blacklist filtering.")
            self._blacklisted_phones = set()
            self._blacklist_loaded = True

    def _filter_blacklisted_phones(self, phones: List[str]) -> List[str]:
        """
        Filter out phones that are in the blacklist.
        Returns list of phones that are NOT blacklisted.
        """
        if not self._blacklisted_phones:
            return phones

        clean_phones = []
        for phone in phones:
            normalized = self._normalize_phone_to_string(phone)
            if normalized:
                # Normalize to 10-digit format for comparison
                import re
                digits = re.sub(r'\D', '', normalized)
                if len(digits) == 11 and digits.startswith('1'):
                    digits = digits[1:]
                if len(digits) == 10 and digits not in self._blacklisted_phones:
                    clean_phones.append(phone)
                elif len(digits) != 10:
                    # Keep phones that don't normalize properly
                    clean_phones.append(phone)

        filtered_count = len(phones) - len(clean_phones)
        if filtered_count > 0:
            self.logger.log_step(
                "Blacklist Filter",
                f"Filtered {filtered_count} blacklisted phones from {len(phones)} total"
            )

        return clean_phones

    def _normalize_phone_to_string(self, phone_value: Any) -> Optional[str]:
        """
        Safely convert any phone value to a string.
        Handles strings, lists, tuples, and other types.
        Returns None if conversion is not possible.
        CRITICAL: Delegates to _ensure_string_key for consistent handling.
        """
        return self._ensure_string_key(phone_value)
    
    def _ensure_string_key(self, value: Any) -> Optional[str]:
        """
        GUARANTEED string conversion for dictionary keys.
        Returns None if conversion is impossible.
        CRITICAL: This must NEVER return a list, tuple, or any unhashable type.
        
        For lists/tuples with 2 elements like [formatted, cleaned] or (formatted, cleaned),
        extracts the SECOND element (cleaned phone) for consistency between API and cache data.
        """
        if value is None:
            return None
        
        # Already a string - most common case
        if isinstance(value, str):
            stripped = value.strip()
            return stripped if stripped else None
        
        # List: For [formatted, cleaned] format (from JSON cache), extract SECOND element
        # This ensures consistency with tuple handling for API data
        if isinstance(value, list):
            if len(value) >= 2:
                # Format: ["formatted", "cleaned"] - take cleaned (second element)
                result = self._ensure_string_key(value[1])
                if result:
                    return result
                # Fallback to first element if second fails
                return self._ensure_string_key(value[0])
            elif len(value) == 1:
                return self._ensure_string_key(value[0])
            return None
        
        # Tuple: extract second element (cleaned phone) or first
        if isinstance(value, tuple):
            if len(value) >= 2:
                # Format: (formatted, cleaned) - take cleaned (second element)
                result = self._ensure_string_key(value[1])
                if result:
                    return result
                # Fallback to first element if second fails
                return self._ensure_string_key(value[0])
            elif len(value) == 1:
                return self._ensure_string_key(value[0])
            return None
        
        # Any other type: force string conversion
        try:
            result = str(value).strip()
            # CRITICAL RUNTIME CHECK - must be a string
            if not isinstance(result, str):
                self.logger.logger.error(f"CRITICAL: str() returned non-string: {type(result)}")
                return None
            return result if result else None
        except Exception as e:
            self.logger.logger.warning(f"Failed to convert to string: {value}, error: {e}")
            return None

    def _detect_address_column(self, user_sql: str) -> str:
        """
        Execute LIMIT 1 query to detect address column name.

        Args:
            user_sql: User's original SQL script

        Returns:
            Exact column name (e.g., "Address", "address", "PROPERTY_ADDRESS")

        Raises:
            Exception: If no address column found
        """
        try:
            # Sanitize SQL - remove trailing semicolons that break subqueries
            clean_sql = self._sanitize_sql_for_subquery(user_sql)

            # Execute with LIMIT 1 to get column metadata
            test_query = f"SELECT * FROM ({clean_sql}) AS sample_query LIMIT 1"
            result = self.snowflake_conn.execute_query(test_query)

            if result is None or result.empty:
                raise Exception("Query returned no results - cannot detect columns")

            # Search for address column (case-insensitive)
            for col in result.columns:
                if 'address' in col.lower():
                    self.logger.log_step("Column Detection", f"Found address column: '{col}'")
                    return col

            # No address column found
            available = ', '.join(result.columns)
            raise Exception(f"No Address column found. Available: {available}")

        except Exception as e:
            self.logger.log_error(e, "detecting address column")
            raise

    def _detect_column(self, sql: str, possible_names: List[str]) -> Optional[str]:
        """
        Detect which column name variant is used in the SQL query.

        Args:
            sql: SQL query string
            possible_names: List of possible column name variations

        Returns:
            The detected column name, or first option as fallback
        """
        sql_upper = sql.upper()
        for name in possible_names:
            # Check for column in SELECT, with quotes or without
            if f'"{name.upper()}"' in sql_upper or f' {name.upper()}' in sql_upper or f',{name.upper()}' in sql_upper:
                return name

        # Fallback to first option (most common naming)
        return possible_names[0] if possible_names else None

    def _build_filtered_query(self, user_sql: str, limit_rows: Optional[int] = None) -> str:
        """
        Build optimized query with database-side filtering against PERSON_CACHE.

        Filters for:
        1. Records NOT in PERSON_CACHE (unprocessed)
        2. Records with valid first_name AND last_name (processable)

        The row_limit applies to records that pass BOTH filters, ensuring
        the user gets the requested number of actually processable records.

        Args:
            user_sql: Original SQL script from user
            limit_rows: Number of NEW, VALID records to return (applied after all filtering)

        Returns:
            Optimized SQL query string with NOT EXISTS filtering and name validation
        """
        # Sanitize SQL - remove trailing semicolons that break CTEs
        clean_sql = self._sanitize_sql_for_subquery(user_sql)

        # Detect address column name (pass sanitized SQL to avoid redundant cleaning)
        address_column = self._detect_address_column(clean_sql)

        # Detect name columns (typically "First Name", "Last Name" or variations)
        first_name_col = self._detect_column(user_sql, ['First Name', 'FIRST_NAME', 'FirstName', 'first_name'])
        last_name_col = self._detect_column(user_sql, ['Last Name', 'LAST_NAME', 'LastName', 'last_name'])

        # Build filtered query with NOT EXISTS and name validation
        filtered_query = f"""
    WITH UserQuery AS (
        {clean_sql}
    ),
    FilteredResults AS (
        SELECT uq.*
        FROM UserQuery uq
        WHERE NOT EXISTS (
            SELECT 1
            FROM PROCESSED_DATA_DB.PUBLIC.PERSON_CACHE pc
            WHERE UPPER(TRIM(pc."address")) = UPPER(TRIM(uq."{address_column}"))
              AND pc."address" IS NOT NULL
              AND pc."address" != ''
        )
        -- Filter for valid names (records without names are not processable)
        AND TRIM(COALESCE(uq."{first_name_col}", '')) != ''
        AND TRIM(COALESCE(uq."{last_name_col}", '')) != ''
    )
    SELECT * FROM FilteredResults
    """

        # Apply limit if specified
        if limit_rows:
            filtered_query += f"\nLIMIT {limit_rows}"

        self.logger.log_step("Query Optimization",
            f"Built filtered query using address='{address_column}', "
            f"first_name='{first_name_col}', last_name='{last_name_col}' with database-side filtering")

        return filtered_query

    def _filter_unprocessed_records(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        DEPRECATED: Filter out processed records using Python-side filtering.

        This method is no longer used in the main ETL flow.
        Filtering is now done at database level via _build_filtered_query().

        Kept for backward compatibility and testing purposes only.
        """
        self.logger.logger.warning(
            "DEPRECATED: _filter_unprocessed_records() called. "
            "Database-side filtering is now preferred via _build_filtered_query()."
        )
        try:
            if df.empty:
                return df
            
            # Find the Address column (flexible matching)
            address_column = None
            for col in df.columns:
                if 'address' in col.lower():
                    address_column = col
                    break
            
            if not address_column:
                self.logger.log_step("Data Validation", f"No Address column found. Available columns: {list(df.columns)}")
                return df
            
            self.logger.log_step("Data Validation", f"Using Address column: '{address_column}'")
            
            original_count = len(df)
            self.logger.log_step("Data Filtering", f"Checking {original_count} records against PERSON_CACHE")
            
            # Check against Snowflake PERSON_CACHE table
            try:
                # Query Snowflake for cached addresses
                # Use quoted column names to preserve case
                cache_query = """
                SELECT DISTINCT UPPER(TRIM("address")) as cached_address
                FROM PROCESSED_DATA_DB.PUBLIC.PERSON_CACHE
                WHERE "address" IS NOT NULL AND "address" != ''
                """
                cache_result = self.snowflake_conn.execute_query(cache_query)
                
                cached_addresses = set()
                if cache_result is not None and not cache_result.empty:
                    # Handle case-insensitive column name matching (Snowflake may return different case)
                    cached_address_col = None
                    for col in cache_result.columns:
                        if col.lower() == 'cached_address':
                            cached_address_col = col
                            break
                    
                    if cached_address_col:
                        cached_addresses = set(cache_result[cached_address_col].str.upper().str.strip().tolist())
                    else:
                        self.logger.log_step("Data Filtering", f"Warning: 'cached_address' column not found in cache result. Available columns: {list(cache_result.columns)}")
                        # Fallback: try to use first column if cached_address not found
                        if len(cache_result.columns) > 0:
                            cached_addresses = set(cache_result.iloc[:, 0].astype(str).str.upper().str.strip().tolist())
                
                self.logger.log_step("Data Filtering", f"Found {len(cached_addresses)} cached addresses in PERSON_CACHE")
                
                # Filter out records that already exist in cache
                unprocessed_records = []
                processed_count = 0
                
                for _, row in df.iterrows():
                    address = str(row[address_column]).upper().strip() if pd.notna(row[address_column]) else ''
                    
                    if address and address in cached_addresses:
                        processed_count += 1
                    else:
                        unprocessed_records.append(row)
                
                if processed_count > 0:
                    self.logger.log_step("Data Filtering", 
                        f"Filtered {processed_count} already processed records, {len(unprocessed_records)} new records to process")
                
                if not unprocessed_records:
                    self.logger.log_step("Data Filtering", "All addresses already exist in PERSON_CACHE")
                    return pd.DataFrame()
                
                filtered_df = pd.DataFrame(unprocessed_records).reset_index(drop=True)
                return filtered_df
                
            except Exception as e:
                self.logger.log_step("Data Filtering", f"Error checking PERSON_CACHE: {e}. Processing all records.")
                return df
            
        except Exception as e:
            self.logger.log_error(e, "filtering unprocessed records")
            return df
    
    def _process_batch_results(self, df, idicore_results, dataframe_indices, stop_flag: Optional[Callable] = None,
                               progress_callback: Optional[Callable] = None, row_event_callback: Optional[Callable] = None,
                               batch_start_row: int = 0, total_rows: int = 0, current_batch: int = 0, total_batches: int = 0):
        """Process idiCORE results for a batch of records"""
        phone_columns = ['Phone 1', 'Phone 2', 'Phone 3']
        email_columns = ['Email 1', 'Email 2', 'Email 3']
        dnc_columns = ['Phone 1 In DNC List', 'Phone 2 In DNC List', 'Phone 3 In DNC List']
        
        # Collect all phones for batch litigator checking
        batch_phones = []
        phone_to_record_map = {}
        
        for i, person_result in enumerate(idicore_results):
            record_idx = dataframe_indices[i]
            current_row_num = batch_start_row + i
            
            # NOTE: Row emission moved to after enrichment completes (after line 420)
            # This ensures enriched data (phones, emails, DNC flags) is included in the event
            
            # Add phone numbers to DataFrame
            phones = person_result.get('phones', [])
            for j, phone_data in enumerate(phones[:3]):
                if j < len(phone_columns):
                    # Normalize phone to string using helper function
                    normalized_phone = self._normalize_phone_to_string(phone_data)
                    if normalized_phone:
                        df.at[record_idx, phone_columns[j]] = normalized_phone
                    elif phone_data:
                        # Fallback: try to convert directly
                        try:
                            if isinstance(phone_data, tuple):
                                df.at[record_idx, phone_columns[j]] = str(phone_data[1] if len(phone_data) > 1 else phone_data[0])
                            else:
                                df.at[record_idx, phone_columns[j]] = str(phone_data)
                        except Exception as e:
                            self.logger.logger.warning(f"Error normalizing phone for column {phone_columns[j]}: {e}")
            
            # Add email addresses to DataFrame
            emails = person_result.get('emails', [])
            for j, email in enumerate(emails[:3]):
                if j < len(email_columns):
                    df.at[record_idx, email_columns[j]] = email
            
            # Collect first phone for batch litigator checking
            if phones and len(phones) > 0:
                first_phone = phones[0]
                # Use guaranteed string conversion
                cleaned = self._ensure_string_key(first_phone)
                if cleaned:
                    batch_phones.append(cleaned)
                    phone_to_record_map[cleaned] = record_idx  # SAFE: cleaned is guaranteed to be str or None

        # Filter out blacklisted phones BEFORE litigator/DNC checks
        original_phone_count = len(batch_phones)
        if batch_phones and self._blacklisted_phones:
            batch_phones = self._filter_blacklisted_phones(batch_phones)
            # Mark blacklisted phones as litigators directly (skip API call)
            for phone in list(phone_to_record_map.keys()):
                if phone not in batch_phones:
                    record_idx = phone_to_record_map[phone]
                    df.at[record_idx, 'In Litigator List'] = 'Yes'
                    del phone_to_record_map[phone]

        # Batch litigator checking for remaining phones
        if batch_phones:
            self.logger.log_step("Litigator Check", f"Checking {len(batch_phones)} phones against litigator list (skipped {original_phone_count - len(batch_phones)} blacklisted)")
            # Now uses dynamic worker calculation based on workload size
            litigator_results = self.ccc_api.check_multiple_phones_threaded(batch_phones)
            
            # Apply litigator results
            for phone_result in litigator_results:
                if phone_result:
                    try:
                        phone = phone_result.get('phone')
                        # Use guaranteed string conversion
                        phone = self._ensure_string_key(phone)
                        
                        if not phone:  # None or empty string
                            continue
                        
                        # SAFE: phone is guaranteed to be a non-empty string here
                        if phone in phone_to_record_map:
                            record_idx = phone_to_record_map[phone]
                            if phone_result.get('in_litigator_list', False):
                                df.at[record_idx, 'In Litigator List'] = 'Yes'
                    except Exception as e:
                        self.logger.logger.warning(f"Error processing litigator result for phone {phone_result.get('phone', 'unknown')}: {e}")
                        continue
        
        # DNC checking for all phones in this batch
        all_phones_for_dnc = []
        dnc_phone_map = {}
        
        for i, person_result in enumerate(idicore_results):
            record_idx = dataframe_indices[i]
            phones = person_result.get('phones', [])
            
            for j, phone_data in enumerate(phones[:3]):
                if stop_flag and stop_flag():
                    raise Exception("ETL job stopped by user")
                
                if j < len(dnc_columns):
                    # Use guaranteed string conversion
                    cleaned = self._ensure_string_key(phone_data)
                    
                    if cleaned:
                        all_phones_for_dnc.append(cleaned)
                        dnc_phone_map[cleaned] = (record_idx, dnc_columns[j])  # SAFE: cleaned is guaranteed to be str
        
        # Batch DNC checking
        if all_phones_for_dnc:
            self.logger.log_step("DNC Check", f"Checking {len(all_phones_for_dnc)} phones against DNC list")
            
            # Verify DNC database exists before checking
            import os
            dnc_db_path = self.dnc_checker.db_path
            if not os.path.exists(dnc_db_path):
                self.logger.logger.warning(f"DNC database not found at {dnc_db_path}. DNC checking will be skipped.")
            else:
                try:
                    dnc_results = self.dnc_checker.check_multiple_phones(all_phones_for_dnc)
                    
                    # Apply DNC results
                    dnc_found_count = 0
                    for dnc_result in dnc_results:
                        if dnc_result:
                            try:
                                phone = dnc_result.get('phone')
                                # Use guaranteed string conversion
                                phone = self._ensure_string_key(phone)
                                
                                if not phone:  # None or empty string
                                    continue
                                
                                # SAFE: phone is guaranteed to be a non-empty string here
                                if phone in dnc_phone_map:
                                    record_idx, column_name = dnc_phone_map[phone]
                                    if dnc_result.get('in_dnc_list', False):
                                        df.at[record_idx, column_name] = 'Yes'
                                        dnc_found_count += 1
                                    else:
                                        df.at[record_idx, column_name] = 'No'
                            except Exception as e:
                                self.logger.logger.warning(f"Error processing DNC result for phone {dnc_result.get('phone', 'unknown')}: {e}")
                                continue
                    
                    self.logger.log_step("DNC Check", f"DNC check completed: {dnc_found_count} phones found in DNC list")
                except Exception as e:
                    self.logger.logger.error(f"Error during DNC checking: {e}")
                    # Continue processing even if DNC check fails

        # Emit enriched row data events now that all processing is complete
        if row_event_callback:
            for i, person_result in enumerate(idicore_results):
                # Emit for EVERY row (removed throttle)
                record_idx = dataframe_indices[i]
                current_row_num = batch_start_row + i

                # Helper function to safely get DataFrame value
                def get_df_value(col_name: str, default: str = '') -> str:
                    try:
                        if col_name in df.columns:
                            val = df.at[record_idx, col_name]
                            # Check for pandas NA values
                            import pandas as pd
                            return str(val) if pd.notna(val) and val != '' else default
                        return default
                    except Exception:
                        return default

                # Build enriched row data with all fields
                row_data = {
                    'row_number': current_row_num,
                    # Basic person info
                    'first_name': get_df_value('First Name'),
                    'last_name': get_df_value('Last Name'),
                    'address': get_df_value('Address'),
                    'city': get_df_value('City'),
                    'state': get_df_value('State'),
                    'zip_code': get_df_value('Zip Code'),
                    # Enriched phone numbers from idiCORE
                    'phone_1': get_df_value('Phone 1'),
                    'phone_2': get_df_value('Phone 2'),
                    'phone_3': get_df_value('Phone 3'),
                    # Enriched emails from idiCORE
                    'email_1': get_df_value('Email 1'),
                    'email_2': get_df_value('Email 2'),
                    'email_3': get_df_value('Email 3'),
                    # Compliance status flags
                    'in_litigator_list': get_df_value('In Litigator List', 'No'),
                    'phone_1_in_dnc': get_df_value('Phone 1 In DNC List', 'No'),
                    'phone_2_in_dnc': get_df_value('Phone 2 In DNC List', 'No'),
                    'phone_3_in_dnc': get_df_value('Phone 3 In DNC List', 'No'),
                    'status': 'Completed',
                    'batch': current_batch
                }

                row_event_callback(row_data)

    def _execute_single_script(self, script_content: str, script_name: str, limit_rows: Optional[int] = None, 
                              stop_flag: Optional[Callable] = None, progress_callback: Optional[Callable] = None) -> Dict[str, Any]:
        """Execute a single SQL script and upload results with batch processing"""
        result = {
            'script_name': script_name,
            'success': False,
            'started_at': datetime.now(),
            'rows_processed': 0,
            'error_message': None
        }
        
        try:
            self.logger.log_step("SQL Optimization", f"Building filtered query for {script_name}")

            try:
                import time
                start_time = time.time()

                # Build optimized query with NOT EXISTS filtering
                optimized_query = self._build_filtered_query(script_content, limit_rows=limit_rows)

                self.logger.log_step("SQL Execution", "Executing optimized query (filtering at database level)")

                # Execute - returns only unprocessed records
                df = self.snowflake_conn.execute_query(optimized_query)

                query_time = time.time() - start_time

                if df is None or df.empty:
                    result['error_message'] = "No unprocessed records (all already in PERSON_CACHE)"
                    self.logger.log_step("Data Filtering", "All records already processed")
                    return result

                # Log results
                total_rows_to_process = len(df)
                self.logger.log_step("Data Filtering",
                    f"Retrieved {total_rows_to_process} unprocessed records in {query_time:.2f}s")

            except Exception as e:
                self.logger.log_error(e, "building/executing optimized query")
                result['error_message'] = f"Query optimization failed: {str(e)}"
                return result

            # Emit initial progress
            if progress_callback:
                progress_callback(0, total_rows_to_process, 0, 0, 0, f"Starting to process {total_rows_to_process} rows")
            
            # Comprehensive NaN handling
            df = df.fillna('')
            df = df.replace([pd.NA, pd.NaT, None, 'nan', 'None', 'NaN', 'NAN'], '')
            
            # Clean numeric formatting
            def clean_numeric_value(value):
                if value is None or pd.isna(value) or value == '' or value == 'nan' or value == 'None':
                    return ''
                elif isinstance(value, (int, float)):
                    if isinstance(value, float) and value.is_integer():
                        return int(value)
                    else:
                        return value
                elif isinstance(value, str):
                    try:
                        float_val = float(value)
                        if float_val.is_integer():
                            return int(float_val)
                        else:
                            return float_val
                    except (ValueError, TypeError):
                        return value
                else:
                    return value
            
            for col in df.columns:
                df[col] = df[col].apply(clean_numeric_value)
            
            # Get real phone numbers and emails from idiCORE API
            self.logger.log_step("Data Processing", "Getting real phone numbers and emails from idiCORE API")
            
            # Prepare person data for idiCORE lookup
            people_data = []
            dataframe_indices = []
            
            for i, (_, row) in enumerate(df.iterrows()):
                first_name = str(row.get('First Name', '')).strip()
                last_name = str(row.get('Last Name', '')).strip()
                address = str(row.get('Address', '')).strip()
                city = str(row.get('City', '')).strip()
                state = str(row.get('State', '')).strip()
                zip_code = str(row.get('Zip', '')).strip()
                
                # Clean up literal strings from SQL
                if state.lower() in ['state', 'st']:
                    state = ''
                if zip_code.lower() in ['zip', 'zipcode']:
                    zip_code = ''
                
                has_valid_name = (first_name and last_name and 
                                len(first_name) >= 1 and len(last_name) >= 1)
                
                if has_valid_name:
                    person_data = {
                        'first_name': first_name,
                        'last_name': last_name,
                        'address': address,
                        'city': city,
                        'state': state,
                        'zip_code': zip_code
                    }
                    people_data.append(person_data)
                    dataframe_indices.append(i)

            # Log if any records were filtered due to missing names
            # (This should be rare now that SQL-side validation is in place)
            if len(df) > len(people_data):
                filtered_count = len(df) - len(people_data)
                self.logger.log_step("Data Validation",
                    f"Filtered {filtered_count} records with missing names "
                    f"({len(people_data)} valid of {len(df)} returned)")

            if not people_data:
                self.logger.log_step("Data Processing", "No valid person data found for idiCORE lookup")
                result['error_message'] = "No valid person data found"
                return result
            
            # Process data in batches of 200 records
            batch_size = settings.etl.batch_size
            total_records = len(people_data)
            total_batches = (total_records + batch_size - 1) // batch_size
            
            self.logger.log_step("Batch Processing", f"Processing {total_records} records in {total_batches} batches of {batch_size}")
            
            # Initialize columns
            phone_columns = ['Phone 1', 'Phone 2', 'Phone 3']
            email_columns = ['Email 1', 'Email 2', 'Email 3']
            dnc_columns = ['Phone 1 In DNC List', 'Phone 2 In DNC List', 'Phone 3 In DNC List']
            
            for col in phone_columns + email_columns + dnc_columns:
                df[col] = ''
            df['In Litigator List'] = 'No'
            
            # Process each batch
            for batch_num in range(total_batches):
                if stop_flag and stop_flag():
                    raise Exception("ETL job stopped by user")
                
                start_idx = batch_num * batch_size
                end_idx = min((batch_num + 1) * batch_size, total_records)
                batch_people = people_data[start_idx:end_idx]
                batch_dataframe_indices = dataframe_indices[start_idx:end_idx]
                
                # Calculate progress
                current_row = end_idx
                rows_remaining = total_rows_to_process - current_row
                percentage = int((current_row / total_rows_to_process * 100)) if total_rows_to_process > 0 else 0
                
                # Emit batch progress
                if progress_callback:
                    progress_callback(
                        current_row,
                        total_rows_to_process,
                        batch_num + 1,
                        total_batches,
                        percentage,
                        f"Processing batch {batch_num + 1}/{total_batches} - Records {start_idx + 1} to {end_idx}"
                    )
                
                self.logger.log_step("Batch Processing", f"Processing batch {batch_num + 1}/{total_batches} - Records {start_idx + 1} to {end_idx}")

                # Get phones and emails from idiCORE for this batch
                # Now uses dynamic worker calculation based on workload size
                idiCORE_results = self.idicore_service.lookup_multiple_people_phones_and_emails_batch(batch_people)
                
                # Create row event callback
                def row_event_callback(row_data):
                    if progress_callback:
                        # Try to call progress callback with row_data to emit row_processed event
                        try:
                            progress_callback(
                                row_data.get('row_number', start_idx + len(batch_dataframe_indices)),
                                total_rows_to_process,
                                batch_num + 1,
                                total_batches,
                                int((row_data.get('row_number', 0) / total_rows_to_process * 100)) if total_rows_to_process > 0 else 0,
                                f"Processing row {row_data.get('row_number', 0)}/{total_rows_to_process}",
                                row_data
                            )
                        except TypeError:
                            # Fallback if callback doesn't accept row_data parameter
                            progress_callback(
                                row_data.get('row_number', start_idx + len(batch_dataframe_indices)),
                                total_rows_to_process,
                                batch_num + 1,
                                total_batches,
                                int((row_data.get('row_number', 0) / total_rows_to_process * 100)) if total_rows_to_process > 0 else 0,
                                f"Processing row {row_data.get('row_number', 0)}/{total_rows_to_process}"
                            )
                
                # Process this batch's results and emit row-by-row progress
                self._process_batch_results(df, idiCORE_results, batch_dataframe_indices, stop_flag, progress_callback, row_event_callback, start_idx + 1, total_rows_to_process, batch_num + 1, total_batches)
                
                # Save caches after each batch
                if hasattr(self.idicore_service, 'person_cache'):
                    self.idicore_service.person_cache.save_cache()
                if hasattr(self.ccc_api, 'phone_cache'):
                    self.ccc_api.phone_cache.save_cache()

                # Note: Batch results are NOT uploaded here - accumulated for final upload
            
            # Use len(people_data) to reflect actual records processed (not just returned from SQL)
            result['rows_processed'] = len(people_data)
            result['rows_returned'] = len(df)  # Original count from SQL for debugging
            result['rows_filtered'] = len(df) - len(people_data)  # How many dropped in validation

            # Calculate statistics
            litigator_count = len(df[df['In Litigator List'] == 'Yes']) if 'In Litigator List' in df.columns else 0

            dnc_condition = False
            for dnc_col in dnc_columns:
                if dnc_col in df.columns:
                    if dnc_condition is False:
                        dnc_condition = (df[dnc_col] == 'Yes')
                    else:
                        dnc_condition = dnc_condition | (df[dnc_col] == 'Yes')

            dnc_count = len(df[dnc_condition]) if dnc_condition is not False else 0
            both_condition = (df['In Litigator List'] == 'Yes') & dnc_condition if 'In Litigator List' in df.columns and dnc_condition is not False else False
            both_count = len(df[both_condition]) if both_condition is not False else 0
            filtered_condition = (df['In Litigator List'] == 'Yes') | dnc_condition if 'In Litigator List' in df.columns and dnc_condition is not False else (df['In Litigator List'] == 'Yes' if 'In Litigator List' in df.columns else False)
            filtered_records = len(df[filtered_condition]) if filtered_condition is not False else 0
            clean_count = len(df) - filtered_records

            result['litigator_count'] = litigator_count
            result['dnc_count'] = dnc_count
            result['both_count'] = both_count
            result['clean_count'] = clean_count

            result['success'] = True
            self.logger.log_step("Statistics", f"Total: {len(df)}, Litigator: {litigator_count}, DNC: {dnc_count}, Both: {both_count}, Clean: {clean_count}")

            # ========== FINAL UPLOAD: Store all results to Snowflake at END of job ==========
            if progress_callback:
                progress_callback(
                    len(people_data), len(people_data), total_batches, total_batches, 95,
                    "Uploading all results to Snowflake...", None
                )

            self.logger.log_step("Final Upload", f"Uploading ALL {len(df)} processed records to MASTER_PROCESSED_DB")
            records_stored = self.results_service.store_batch_results(
                job_id=self.logger.job_id or "unknown",
                job_name=script_name,
                records=df,
                table_id=self.table_id,
                table_title=self.table_title
            )

            if records_stored:
                self.logger.log_step("Upload Complete", f"Successfully stored {records_stored} records in Snowflake")
                if progress_callback:
                    progress_callback(
                        len(people_data), len(people_data), total_batches, total_batches, 100,
                        f"Upload complete: {records_stored} records stored", None
                    )
            else:
                self.logger.log_step("Upload Warning", "Upload may have failed - check Snowflake logs")
            
        except Exception as e:
            result['error_message'] = str(e)
            self.logger.log_error(e, f"executing script {script_name}")
        
        finally:
            result['completed_at'] = datetime.now()
            if result.get('started_at'):
                result['execution_time_seconds'] = (result['completed_at'] - result['started_at']).total_seconds()
        
        return result
    
    def _upload_consolidated_data_to_snowflake(self, df: pd.DataFrame) -> bool:
        """Upload consolidated dataframe to Snowflake UNIQUE_CONSOLIDATED_DATA table"""
        try:
            if df.empty:
                self.logger.log_step("Snowflake Upload", "No data to upload to Snowflake")
                return True
            
            self.logger.log_step("Snowflake Upload", f"Uploading {len(df)} rows to UNIQUE_CONSOLIDATED_DATA table")
            
            # Ensure connection is established
            if not self.snowflake_conn.connect():
                self.logger.log_error("Failed to connect to Snowflake", "snowflake_upload")
                return False
            
            # Prepare DataFrame for Snowflake:
            # 1. Rename columns that don't match Snowflake table schema
            # 2. Drop columns that don't exist in Snowflake table
            df_snowflake = df.copy()
            
            # Column renames: DataFrame column -> Snowflake table column
            column_renames = {
                "Lead Campaign": "LeadCampaignId",
            }
            
            # Columns to drop (exist in DataFrame but not in Snowflake table)
            columns_to_drop = ["Co Borrower Full Name"]
            
            # Apply renames
            for old_name, new_name in column_renames.items():
                if old_name in df_snowflake.columns:
                    df_snowflake = df_snowflake.rename(columns={old_name: new_name})
                    self.logger.logger.debug(f"Renamed column: {old_name} -> {new_name}")
            
            # Drop columns that don't exist in Snowflake
            for col in columns_to_drop:
                if col in df_snowflake.columns:
                    df_snowflake = df_snowflake.drop(columns=[col])
                    self.logger.logger.debug(f"Dropped column: {col}")
            
            self.logger.logger.debug(f"Final columns for Snowflake: {list(df_snowflake.columns)}")
            
            # Prepare data for bulk insert
            batch_size = 5000
            total_uploaded = 0
            
            for i in range(0, len(df_snowflake), batch_size):
                batch_df = df_snowflake.iloc[i:i + batch_size]
                batch_num = (i // batch_size) + 1
                total_batches = (len(df_snowflake) + batch_size - 1) // batch_size
                
                self.logger.log_step("Snowflake Upload", f"Processing batch {batch_num}/{total_batches} ({len(batch_df)} records)")
                
                # Build VALUES clause for bulk insert
                values_parts = []
                for _, row in batch_df.iterrows():
                    row_values = []
                    for value in row.values:
                        if pd.isna(value) or value is None or value == '':
                            row_values.append('NULL')
                        elif isinstance(value, str):
                            escaped_value = str(value).replace("'", "''")
                            row_values.append(f"'{escaped_value}'")
                        else:
                            row_values.append(str(value))
                    values_parts.append(f"({', '.join(row_values)})")
                
                values_clause = ",\n                ".join(values_parts)
                # Use quoted column names to preserve spaces and case
                columns_clause = ', '.join([f'"{col}"' for col in df_snowflake.columns])
                
                insert_sql = f"""
                INSERT INTO PROCESSED_DATA_DB.PUBLIC.UNIQUE_CONSOLIDATED_DATA ({columns_clause})
                VALUES {values_clause}
                """
                
                try:
                    self.snowflake_conn.execute_query(insert_sql)
                    total_uploaded += len(batch_df)
                except Exception as batch_error:
                    self.logger.log_error(f"Batch {batch_num} upload failed: {batch_error}", "snowflake_upload")
                    continue
            
            self.logger.log_step("Snowflake Upload Complete", f"Successfully uploaded {total_uploaded} records to UNIQUE_CONSOLIDATED_DATA")
            return True
            
        except Exception as e:
            self.logger.log_error(e, "snowflake_upload")
            return False
    
    def execute_single_script(self, script_content: str, script_name: str, limit_rows: Optional[int] = None, 
                             stop_flag: Optional[Callable] = None, progress_callback: Optional[Callable] = None) -> Dict[str, Any]:
        """Execute a single SQL script
        
        Args:
            script_content: SQL script content
            script_name: Name of the script
            limit_rows: Optional row limit
            stop_flag: Optional function to check if job should stop
            progress_callback: Optional callback function for progress updates
                Callback signature: (current_row, total_rows, current_batch, total_batches, percentage, message)
        """
        self.logger.start_job()
        
        # Clear consolidated data for new job
        self.consolidated_data = []
        
        try:
            # Connect to databases
            self.logger.log_step("Database Connections", "Establishing connections")
            if not self.snowflake_conn.connect():
                raise Exception("Failed to connect to Snowflake")

            # Load blacklisted phones before processing
            self._load_blacklisted_phones()

            # Execute script with progress callback
            script_result = self._execute_single_script(script_content, script_name, limit_rows, stop_flag, progress_callback)

            # Removed: Using only MASTER_PROCESSED_DB
            # if self.consolidated_data:
            #     consolidated_df = pd.concat(self.consolidated_data, ignore_index=True)
            #     self._upload_consolidated_data_to_snowflake(consolidated_df)

            self.logger.end_job(script_result.get('success', False))
            
            return script_result
            
        except Exception as e:
            self.logger.log_error(e, "ETL execution")
            self.logger.end_job(False)
            return {
                'success': False,
                'error_message': str(e)
            }
        
        finally:
            # Disconnect
            self.snowflake_conn.disconnect()

    def _convert_to_etl_schema(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Convert standard schema column names to ETL engine's expected format.

        Maps:
        - first_name → 'First Name'
        - last_name → 'Last Name'
        - address → 'Address'
        - city → 'City'
        - state → 'State'
        - zip_code → 'Zip'
        - etc.

        Args:
            df: DataFrame with standard schema columns

        Returns:
            DataFrame with ETL schema column names
        """
        column_mapping = {
            'first_name': 'First Name',
            'last_name': 'Last Name',
            'address': 'Address',
            'city': 'City',
            'state': 'State',
            'zip_code': 'Zip',
            'county': 'County',
            'phone_1': 'Phone 1',
            'phone_2': 'Phone 2',
            'phone_3': 'Phone 3',
            'email': 'Email 1',
            'email_1': 'Email 1',
            'email_2': 'Email 2',
            'email_3': 'Email 3',
            'property_type': 'Property Type',
            'property_value': 'Property Value',
            'mortgage_balance': 'Mortgage Balance',
            'estimated_equity': 'Estimated Equity',
            'loan_type': 'Loan Type',
            'interest_rate': 'Interest Rate',
            'credit_score': 'Credit Score',
            'annual_income': 'Annual Income',
            'debt_to_income': 'Debt to Income',
            'cash_out_amount': 'Cash Out Amount',
            'loan_purpose': 'Loan Purpose',
            'property_use': 'Property Use',
            'years_in_home': 'Years in Home',
            'employment_status': 'Employment Status',
            'bankruptcies': 'Bankruptcies',
            'foreclosures': 'Foreclosures',
            'tax_liens': 'Tax Liens',
            'lead_source': 'Lead Source',
            'lead_date': 'Lead Date',
            'lead_id': 'Lead ID',
            'campaign_id': 'Campaign ID',
            'offer_code': 'Offer Code',
            'utm_source': 'UTM Source',
            'utm_medium': 'UTM Medium',
            'utm_campaign': 'UTM Campaign',
            'notes': 'Notes',
            'custom_field_1': 'Custom Field 1',
            'custom_field_2': 'Custom Field 2',
            'custom_field_3': 'Custom Field 3',
        }

        # Create new DataFrame with mapped columns
        result_df = pd.DataFrame()

        for std_col, etl_col in column_mapping.items():
            if std_col in df.columns:
                result_df[etl_col] = df[std_col]

        # Ensure required columns exist (even if empty)
        required_columns = ['First Name', 'Last Name', 'Address', 'City', 'State', 'Zip']
        for col in required_columns:
            if col not in result_df.columns:
                result_df[col] = ''

        return result_df

    def execute_with_file_source(
        self,
        file_path: str,
        file_source_id: str,
        file_name: str,
        limit_rows: Optional[int] = None,
        stop_flag: Optional[Callable] = None,
        progress_callback: Optional[Callable] = None
    ) -> Dict[str, Any]:
        """
        Execute ETL job using an uploaded file instead of Snowflake query.

        Args:
            file_path: Path to uploaded CSV/Excel file
            file_source_id: UUID of FileSource (contains column mapping)
            file_name: Original filename for logging
            limit_rows: Optional row limit
            stop_flag: Optional function to check if job should stop
            progress_callback: Optional callback for progress updates

        Returns:
            Dict with execution results (same format as execute_single_script)
        """
        self.logger.start_job()

        # Clear consolidated data for new job
        self.consolidated_data = []

        result = {
            'script_name': file_name,
            'success': False,
            'started_at': datetime.now(),
            'rows_processed': 0,
            'error_message': None
        }

        try:
            from app.db.session import sync_session_factory
            from app.db.models.file_source import FileSource
            from app.services.file_processor import FileProcessor

            # Load blacklisted phones before processing
            self._load_blacklisted_phones()

            # Fetch FileSource to get column mapping
            self.logger.log_step("File Source", f"Loading file source configuration")
            with sync_session_factory() as db_session:
                file_source = db_session.query(FileSource).filter(FileSource.id == file_source_id).first()
                if not file_source:
                    raise Exception(f"FileSource {file_source_id} not found")
                if not file_source.column_mapping:
                    raise Exception(f"FileSource {file_source_id} has no column mapping configured")

                column_mapping = file_source.column_mapping

            # Read and process file
            self.logger.log_step("File Processing", f"Reading file: {file_name}")
            file_processor = FileProcessor()

            # Read file (CSV or Excel)
            raw_df = file_processor.read_file(file_path, max_rows=limit_rows)
            if raw_df is None or raw_df.empty:
                raise Exception("File is empty or could not be read")

            self.logger.log_step("File Processing", f"Read {len(raw_df)} rows from file")

            # Apply column mapping (source columns → standard schema)
            self.logger.log_step("Column Mapping", "Applying saved column mapping")
            mapped_df = file_processor.apply_mapping(raw_df, column_mapping)

            # Normalize data (names, phones, emails)
            self.logger.log_step("Data Normalization", "Normalizing names, phones, and emails")
            normalized_df, validation_errors = file_processor.normalize_data(mapped_df)

            if normalized_df.empty:
                raise Exception("No valid records after normalization and validation")

            if validation_errors:
                self.logger.logger.warning(f"Found {len(validation_errors)} validation errors (continuing with valid records)")

            # Convert standard schema to ETL schema (first_name → 'First Name', etc.)
            self.logger.log_step("Schema Conversion", "Converting to ETL schema format")
            df = self._convert_to_etl_schema(normalized_df)

            total_rows_to_process = len(df)
            self.logger.log_step("Data Ready", f"Processing {total_rows_to_process} valid records")

            # === FROM HERE, USE THE SAME PIPELINE AS SNOWFLAKE-BASED JOBS ===

            # Emit initial progress
            if progress_callback:
                progress_callback(0, total_rows_to_process, 0, 0, 0, f"Starting to process {total_rows_to_process} rows")

            # Comprehensive NaN handling (same as Snowflake path)
            df = df.fillna('')
            df = df.replace([pd.NA, pd.NaT, None, 'nan', 'None', 'NaN', 'NAN'], '')

            # Clean numeric formatting (same helper function)
            def clean_numeric_value(value):
                if value is None or pd.isna(value) or value == '' or value == 'nan' or value == 'None':
                    return ''
                elif isinstance(value, (int, float)):
                    if isinstance(value, float) and value.is_integer():
                        return int(value)
                    else:
                        return value
                elif isinstance(value, str):
                    try:
                        float_val = float(value)
                        if float_val.is_integer():
                            return int(float_val)
                        else:
                            return float_val
                    except (ValueError, TypeError):
                        return value
                else:
                    return value

            for col in df.columns:
                df[col] = df[col].apply(clean_numeric_value)

            # Get real phone numbers and emails from idiCORE API
            self.logger.log_step("Data Processing", "Getting real phone numbers and emails from idiCORE API")

            # Prepare person data for idiCORE lookup
            people_data = []
            dataframe_indices = []

            for i, (_, row) in enumerate(df.iterrows()):
                first_name = str(row.get('First Name', '')).strip()
                last_name = str(row.get('Last Name', '')).strip()
                address = str(row.get('Address', '')).strip()
                city = str(row.get('City', '')).strip()
                state = str(row.get('State', '')).strip()
                zip_code = str(row.get('Zip', '')).strip()

                # Clean up literal strings
                if state.lower() in ['state', 'st']:
                    state = ''
                if zip_code.lower() in ['zip', 'zipcode']:
                    zip_code = ''

                has_valid_name = (first_name and last_name and
                                len(first_name) >= 1 and len(last_name) >= 1)

                if has_valid_name:
                    person_data = {
                        'first_name': first_name,
                        'last_name': last_name,
                        'address': address,
                        'city': city,
                        'state': state,
                        'zip_code': zip_code
                    }
                    people_data.append(person_data)
                    dataframe_indices.append(i)

            # Log if any records were filtered
            if len(df) > len(people_data):
                filtered_count = len(df) - len(people_data)
                self.logger.log_step("Data Validation",
                    f"Filtered {filtered_count} records with missing names "
                    f"({len(people_data)} valid of {len(df)} total)")

            if not people_data:
                self.logger.log_step("Data Processing", "No valid person data found for idiCORE lookup")
                result['error_message'] = "No valid person data found"
                return result

            # Process data in batches (SAME BATCH PROCESSING LOGIC)
            batch_size = settings.etl.batch_size
            total_records = len(people_data)
            total_batches = (total_records + batch_size - 1) // batch_size

            self.logger.log_step("Batch Processing", f"Processing {total_records} records in {total_batches} batches of {batch_size}")

            # Initialize columns
            phone_columns = ['Phone 1', 'Phone 2', 'Phone 3']
            email_columns = ['Email 1', 'Email 2', 'Email 3']
            dnc_columns = ['Phone 1 In DNC List', 'Phone 2 In DNC List', 'Phone 3 In DNC List']

            for col in phone_columns + email_columns + dnc_columns:
                df[col] = ''
            df['In Litigator List'] = 'No'

            # Process each batch (SAME LOOP AS SNOWFLAKE PATH)
            for batch_num in range(total_batches):
                if stop_flag and stop_flag():
                    raise Exception("ETL job stopped by user")

                start_idx = batch_num * batch_size
                end_idx = min((batch_num + 1) * batch_size, total_records)
                batch_people = people_data[start_idx:end_idx]
                batch_dataframe_indices = dataframe_indices[start_idx:end_idx]

                # Calculate progress
                current_row = end_idx
                rows_remaining = total_rows_to_process - current_row
                percentage = int((current_row / total_rows_to_process * 100)) if total_rows_to_process > 0 else 0

                # Emit batch progress
                if progress_callback:
                    progress_callback(
                        current_row,
                        total_rows_to_process,
                        batch_num + 1,
                        total_batches,
                        percentage,
                        f"Processing batch {batch_num + 1}/{total_batches} - Records {start_idx + 1} to {end_idx}"
                    )

                self.logger.log_step("Batch Processing", f"Processing batch {batch_num + 1}/{total_batches} - Records {start_idx + 1} to {end_idx}")

                # Get phones and emails from idiCORE for this batch
                idiCORE_results = self.idicore_service.lookup_multiple_people_phones_and_emails_batch(batch_people)

                # Create row event callback
                def row_event_callback(row_data):
                    if progress_callback:
                        try:
                            progress_callback(
                                row_data.get('row_number', start_idx + len(batch_dataframe_indices)),
                                total_rows_to_process,
                                batch_num + 1,
                                total_batches,
                                int((row_data.get('row_number', 0) / total_rows_to_process * 100)) if total_rows_to_process > 0 else 0,
                                f"Processing row {row_data.get('row_number', 0)}/{total_rows_to_process}",
                                row_data
                            )
                        except TypeError:
                            progress_callback(
                                row_data.get('row_number', start_idx + len(batch_dataframe_indices)),
                                total_rows_to_process,
                                batch_num + 1,
                                total_batches,
                                int((row_data.get('row_number', 0) / total_rows_to_process * 100)) if total_rows_to_process > 0 else 0,
                                f"Processing row {row_data.get('row_number', 0)}/{total_rows_to_process}"
                            )

                # Process this batch's results (REUSE EXISTING METHOD)
                self._process_batch_results(df, idiCORE_results, batch_dataframe_indices, stop_flag, progress_callback, row_event_callback, start_idx + 1, total_rows_to_process, batch_num + 1, total_batches)

                # Save caches after each batch
                if hasattr(self.idicore_service, 'person_cache'):
                    self.idicore_service.person_cache.save_cache()
                if hasattr(self.ccc_api, 'phone_cache'):
                    self.ccc_api.phone_cache.save_cache()

                # Upload this batch to Snowflake MASTER_PROCESSED_DB immediately
                batch_df = df.iloc[batch_dataframe_indices].copy()
                self.logger.log_step("Batch Upload", f"Uploading batch {batch_num + 1}/{total_batches} to MASTER_PROCESSED_DB ({len(batch_df)} records)")
                records_stored = self.results_service.store_batch_results(
                    job_id=self.logger.job_id or "unknown",
                    job_name=file_name,
                    records=batch_df,
                    table_id=self.table_id,
                    table_title=self.table_title
                )
                if records_stored:
                    self.logger.log_step("Batch Upload Complete", f"Batch {batch_num + 1} stored in Snowflake: {records_stored} records")

            # Calculate final statistics (SAME AS SNOWFLAKE PATH)
            result['rows_processed'] = len(people_data)
            result['rows_returned'] = len(df)
            result['rows_filtered'] = len(df) - len(people_data)

            litigator_count = len(df[df['In Litigator List'] == 'Yes']) if 'In Litigator List' in df.columns else 0

            dnc_condition = False
            for dnc_col in dnc_columns:
                if dnc_col in df.columns:
                    if dnc_condition is False:
                        dnc_condition = (df[dnc_col] == 'Yes')
                    else:
                        dnc_condition = dnc_condition | (df[dnc_col] == 'Yes')

            dnc_count = len(df[dnc_condition]) if dnc_condition is not False else 0
            both_condition = (df['In Litigator List'] == 'Yes') & dnc_condition if 'In Litigator List' in df.columns and dnc_condition is not False else False
            both_count = len(df[both_condition]) if both_condition is not False else 0
            filtered_condition = (df['In Litigator List'] == 'Yes') | dnc_condition if 'In Litigator List' in df.columns and dnc_condition is not False else (df['In Litigator List'] == 'Yes' if 'In Litigator List' in df.columns else False)
            filtered_records = len(df[filtered_condition]) if filtered_condition is not False else 0
            clean_count = len(df) - filtered_records

            result['litigator_count'] = litigator_count
            result['dnc_count'] = dnc_count
            result['both_count'] = both_count
            result['clean_count'] = clean_count

            result['success'] = True
            result['completed_at'] = datetime.now()

            self.logger.end_job(True)
            return result

        except Exception as e:
            self.logger.log_error(e, "File-based ETL execution")
            self.logger.end_job(False)
            return {
                'success': False,
                'error_message': str(e)
            }

