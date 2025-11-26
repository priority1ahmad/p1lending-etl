"""
Main ETL engine that orchestrates the entire ETL process (ported from old_app)
"""

import os
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any, Callable
import pandas as pd

from app.core.config import settings
from app.core.logger import etl_logger, JobLogger
from app.services.etl.snowflake_service import SnowflakeConnection
from app.services.etl.google_sheets_service import GoogleSheetsConnection
from app.services.etl.idicore_service import IdiCOREAPIService
from app.services.etl.ccc_service import CCCAPIService
from app.services.etl.dnc_service import DNCCheckerDB


class ETLEngine:
    """Main ETL engine for orchestrating SQL to Google Sheets operations"""
    
    def __init__(self, job_id: Optional[str] = None, log_callback: Optional[Callable] = None):
        self.snowflake_conn = SnowflakeConnection()
        self.google_sheets_conn = GoogleSheetsConnection()
        self.ccc_api = CCCAPIService()
        self.dnc_checker = DNCCheckerDB()
        self.idicore_service = IdiCOREAPIService()
        self.logger = JobLogger("ETLEngine", etl_logger, job_id=job_id, log_callback=log_callback)
        self.consolidated_data = []
    
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
    
    def _filter_unprocessed_records(self, df: pd.DataFrame) -> pd.DataFrame:
        """Filter out records that have already been processed based on address using PERSON_CACHE"""
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
                    cached_addresses = set(cache_result['cached_address'].str.upper().str.strip().tolist())
                
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
            
            # Emit row processed event every 10 rows
            if i % 10 == 0:
                # Get row data for display
                row_data = {
                    'row_number': current_row_num,
                    'first_name': str(df.at[record_idx, 'First Name']) if 'First Name' in df.columns else '',
                    'last_name': str(df.at[record_idx, 'Last Name']) if 'Last Name' in df.columns else '',
                    'address': str(df.at[record_idx, 'Address']) if 'Address' in df.columns else '',
                    'status': 'Processing',
                    'batch': current_batch
                }
                
                # Emit row event if callback provided
                if row_event_callback:
                    row_event_callback(row_data)
                
                # Calculate percentage and emit progress
                if progress_callback:
                    percentage = int((current_row_num / total_rows * 100)) if total_rows > 0 else 0
                    try:
                        # Try calling with row_data if callback supports it
                        progress_callback(current_row_num, total_rows, current_batch, total_batches, percentage, f"Processing row {current_row_num}/{total_rows}", row_data)
                    except TypeError:
                        # Fallback if callback doesn't accept row_data
                        progress_callback(current_row_num, total_rows, current_batch, total_batches, percentage, f"Processing row {current_row_num}/{total_rows}")
            
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
        
        # Batch litigator checking for all first phones (using 8 threads)
        if batch_phones:
            self.logger.log_step("Litigator Check", f"Checking {len(batch_phones)} phones against litigator list using 8 threads")
            litigator_results = self.ccc_api.check_multiple_phones_threaded(batch_phones, max_workers=8)
            
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
            # Execute SQL query WITHOUT LIMIT first
            sql_query = script_content
            
            self.logger.log_step("SQL Execution", f"Executing {script_name}")
            
            # Execute SQL query
            df = self.snowflake_conn.execute_query(sql_query)
            if df is None or df.empty:
                result['error_message'] = "No data returned from query"
                return result
            
            self.logger.log_step("Data Filtering", f"Retrieved {len(df)} total rows from query")
            
            # Filter out already processed records based on address FIRST
            df = self._filter_unprocessed_records(df)
            if df.empty:
                result['error_message'] = "All records have already been processed"
                self.logger.log_step("Data Processing", "All records already exist in PERSON_CACHE")
                return result
            
            # NOW apply the limit to the filtered (unprocessed) records
            total_rows_to_process = len(df)
            if limit_rows:
                original_count = len(df)
                df = df.head(limit_rows)
                total_rows_to_process = len(df)
                self.logger.log_step("Data Limiting", f"Applied LIMIT {limit_rows} to filtered data: {original_count} new records available, processing {len(df)} records")
            
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
                idiCORE_results = self.idicore_service.lookup_multiple_people_phones_and_emails_batch(batch_people, batch_size=150)
                
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
                
                # Upload this batch to Google Sheets immediately
                batch_df = df.iloc[batch_dataframe_indices].copy()
                self.logger.log_step("Batch Upload", f"Uploading batch {batch_num + 1}/{total_batches} to Google Sheets ({len(batch_df)} records)")
                cells_updated = self.google_sheets_conn.upload_dataframe(batch_df, "consolidated_data")
                if cells_updated:
                    self.logger.log_step("Batch Upload Complete", f"Batch {batch_num + 1} appended to sheet: {cells_updated} cells updated")
            
            result['rows_processed'] = len(df)
            
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
            
            # Store for Snowflake consolidation
            self.consolidated_data.append(df)
            
            result['success'] = True
            self.logger.log_step("Statistics", f"Total: {len(df)}, Litigator: {litigator_count}, DNC: {dnc_count}, Both: {both_count}, Clean: {clean_count}")
            
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
            
            if not self.google_sheets_conn.connect():
                raise Exception("Failed to connect to Google Sheets")
            
            # Execute script with progress callback
            script_result = self._execute_single_script(script_content, script_name, limit_rows, stop_flag, progress_callback)
            
            # Upload consolidated data to Snowflake
            if self.consolidated_data:
                consolidated_df = pd.concat(self.consolidated_data, ignore_index=True)
                self._upload_consolidated_data_to_snowflake(consolidated_df)
            
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

