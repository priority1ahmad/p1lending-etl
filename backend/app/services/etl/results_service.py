"""
ETL Results Service

Manages storage and retrieval of processed ETL results in Snowflake MASTER_PROCESSED_DB.

Performance Optimizations:
- Bulk upload via PUT/COPY INTO (10x faster than INSERT...UNION ALL)
- Feature flag: SNOWFLAKE_USE_BULK_UPLOAD (default: True)
"""

import os
import uuid
import tempfile
from typing import Optional, List, Dict, Any
import pandas as pd

from app.core.config import settings
from app.core.logger import etl_logger
from app.services.etl.snowflake_service import SnowflakeConnection


class ETLResultsService:
    """
    Service for managing ETL job results in Snowflake.

    Table: PROCESSED_DATA_DB.PUBLIC.MASTER_PROCESSED_DB
    """

    def __init__(self):
        self.snowflake_conn = SnowflakeConnection()
        self.database = "PROCESSED_DATA_DB"
        self.schema = "PUBLIC"
        self.table = "MASTER_PROCESSED_DB"
        self.logger = etl_logger.logger.getChild("ResultsService")
        self._connected = False

    def _normalize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Normalize Snowflake column names to lowercase.
        Snowflake returns UPPERCASE by default, but frontend expects lowercase.
        """
        if df is not None and not df.empty:
            df.columns = df.columns.str.lower()
        return df

    def _ensure_connection(self) -> bool:
        """Ensure Snowflake connection is established"""
        if not self._connected:
            if self.snowflake_conn.connect():
                self._connected = True
                self._ensure_table_exists()
            else:
                self.logger.error("Failed to connect to Snowflake")
                return False
        return True

    def _ensure_table_exists(self):
        """Create MASTER_PROCESSED_DB table if it doesn't exist"""
        create_sql = f"""
        CREATE TABLE IF NOT EXISTS {self.database}.{self.schema}.{self.table} (
            "record_id" VARCHAR NOT NULL,
            "job_id" VARCHAR NOT NULL,
            "job_name" VARCHAR NOT NULL,
            "table_id" VARCHAR,
            "table_title" VARCHAR,
            "processed_at" TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),

            -- Lead Information
            "lead_number" VARCHAR,
            "campaign_date" VARCHAR,
            "lead_campaign" VARCHAR,
            "lead_source" VARCHAR,
            "ref_id" VARCHAR,

            -- Person Data
            "first_name" VARCHAR,
            "last_name" VARCHAR,
            "co_borrower_full_name" VARCHAR,
            "address" VARCHAR,
            "city" VARCHAR,
            "state" VARCHAR,
            "zip" VARCHAR,

            -- Property Data
            "total_units" VARCHAR,
            "owner_occupied" VARCHAR,
            "annual_tax_amount" VARCHAR,
            "assessed_value" VARCHAR,
            "estimated_value" VARCHAR,

            -- Loan Data - First Mortgage
            "ltv" VARCHAR,
            "loan_type" VARCHAR,
            "first_mortgage_type" VARCHAR,
            "first_mortgage_amount" VARCHAR,
            "first_mortgage_balance" VARCHAR,
            "term" VARCHAR,
            "estimated_new_payment" VARCHAR,

            -- Loan Data - Second Mortgage
            "second_mortgage_type" VARCHAR,
            "second_mortgage_term" VARCHAR,
            "second_mortgage_balance" VARCHAR,
            "has_second_mortgage" VARCHAR,

            -- Current Loan Details
            "current_interest_rate" VARCHAR,
            "current_lender" VARCHAR,
            "arm_index_type" VARCHAR,
            "origination_date" VARCHAR,
            "rate_adjustment_date" VARCHAR,

            -- Phone Data (enriched via idiCORE)
            "phone_1" VARCHAR,
            "phone_2" VARCHAR,
            "phone_3" VARCHAR,

            -- Email Data (enriched via idiCORE)
            "email_1" VARCHAR,
            "email_2" VARCHAR,
            "email_3" VARCHAR,

            -- Compliance Flags
            "in_litigator_list" VARCHAR DEFAULT 'No',
            "phone_1_in_dnc" VARCHAR DEFAULT 'No',
            "phone_2_in_dnc" VARCHAR DEFAULT 'No',
            "phone_3_in_dnc" VARCHAR DEFAULT 'No',

            PRIMARY KEY ("record_id")
        )
        """
        try:
            self.snowflake_conn.execute_query(create_sql)
            # Add table_id column if it doesn't exist (for existing tables)
            self._add_table_id_column_if_missing()
            # Ensure all columns exist (handles old table schemas)
            self._ensure_all_columns_exist()
            self.logger.info(f"Ensured table {self.table} exists with all columns")
        except Exception as e:
            self.logger.error(f"Error creating table: {e}")

    def _add_table_id_column_if_missing(self):
        """Add table_id and table_title columns to existing table if missing"""
        try:
            alter_sql = f"""
            ALTER TABLE {self.database}.{self.schema}.{self.table}
            ADD COLUMN IF NOT EXISTS "table_id" VARCHAR
            """
            self.snowflake_conn.execute_query(alter_sql)

            alter_sql2 = f"""
            ALTER TABLE {self.database}.{self.schema}.{self.table}
            ADD COLUMN IF NOT EXISTS "table_title" VARCHAR
            """
            self.snowflake_conn.execute_query(alter_sql2)
        except Exception as e:
            self.logger.debug(f"table_id columns may already exist: {e}")

    def _ensure_all_columns_exist(self):
        """
        Ensure all expected columns exist in the Snowflake table.

        This handles tables created with older schemas that may be missing
        columns like lead_number, campaign_date, ltv, etc.
        """
        # All columns that should exist (excluding record_id, job_id, job_name, processed_at which are always present)
        columns_to_add = [
            ("table_id", "VARCHAR"),
            ("table_title", "VARCHAR"),
            # Lead Information
            ("lead_number", "VARCHAR"),
            ("campaign_date", "VARCHAR"),
            ("lead_campaign", "VARCHAR"),
            ("lead_source", "VARCHAR"),
            ("ref_id", "VARCHAR"),
            # Person Data
            ("first_name", "VARCHAR"),
            ("last_name", "VARCHAR"),
            ("co_borrower_full_name", "VARCHAR"),
            ("address", "VARCHAR"),
            ("city", "VARCHAR"),
            ("state", "VARCHAR"),
            ("zip", "VARCHAR"),
            # Property Data
            ("total_units", "VARCHAR"),
            ("owner_occupied", "VARCHAR"),
            ("annual_tax_amount", "VARCHAR"),
            ("assessed_value", "VARCHAR"),
            ("estimated_value", "VARCHAR"),
            # Loan Data - First Mortgage
            ("ltv", "VARCHAR"),
            ("loan_type", "VARCHAR"),
            ("first_mortgage_type", "VARCHAR"),
            ("first_mortgage_amount", "VARCHAR"),
            ("first_mortgage_balance", "VARCHAR"),
            ("term", "VARCHAR"),
            ("estimated_new_payment", "VARCHAR"),
            # Loan Data - Second Mortgage
            ("second_mortgage_type", "VARCHAR"),
            ("second_mortgage_term", "VARCHAR"),
            ("second_mortgage_balance", "VARCHAR"),
            ("has_second_mortgage", "VARCHAR"),
            # Current Loan Details
            ("current_interest_rate", "VARCHAR"),
            ("current_lender", "VARCHAR"),
            ("arm_index_type", "VARCHAR"),
            ("origination_date", "VARCHAR"),
            ("rate_adjustment_date", "VARCHAR"),
            # Phone Data
            ("phone_1", "VARCHAR"),
            ("phone_2", "VARCHAR"),
            ("phone_3", "VARCHAR"),
            # Email Data
            ("email_1", "VARCHAR"),
            ("email_2", "VARCHAR"),
            ("email_3", "VARCHAR"),
            # Compliance Flags
            ("in_litigator_list", "VARCHAR"),
            ("phone_1_in_dnc", "VARCHAR"),
            ("phone_2_in_dnc", "VARCHAR"),
            ("phone_3_in_dnc", "VARCHAR"),
        ]

        for col_name, col_type in columns_to_add:
            try:
                alter_sql = f"""
                ALTER TABLE {self.database}.{self.schema}.{self.table}
                ADD COLUMN IF NOT EXISTS "{col_name}" {col_type}
                """
                self.snowflake_conn.execute_query(alter_sql)
            except Exception as e:
                # Column likely already exists, ignore
                self.logger.debug(f"Column {col_name} may already exist: {e}")

    def _escape_string(self, value: Any) -> str:
        """Escape string value for SQL insertion"""
        from app.core.sql_utils import escape_sql_string

        return escape_sql_string(value, return_null=True)

    def _prepare_dataframe_for_upload(
        self,
        job_id: str,
        job_name: str,
        records: pd.DataFrame,
        table_id: Optional[str] = None,
        table_title: Optional[str] = None,
    ) -> pd.DataFrame:
        """
        Prepare DataFrame with all required columns for bulk upload.

        This method transforms the input DataFrame to match the MASTER_PROCESSED_DB schema,
        adding record_id, job metadata, and normalizing column names.
        """
        # Create a copy to avoid modifying the original
        df = records.copy()

        # Add metadata columns
        df["record_id"] = [str(uuid.uuid4()) for _ in range(len(df))]
        df["job_id"] = job_id
        df["job_name"] = job_name
        df["table_id"] = table_id if table_id else ""
        df["table_title"] = table_title if table_title else ""

        # Map source columns to target schema
        column_mapping = {
            # Lead Information
            "Lead Number": "lead_number",
            "Campaign Date": "campaign_date",
            "Lead Campaign": "lead_campaign",
            "Lead Source": "lead_source",
            "Ref ID": "ref_id",
            # Person Data
            "First Name": "first_name",
            "Last Name": "last_name",
            "Co Borrower Full Name": "co_borrower_full_name",
            "Address": "address",
            "City": "city",
            "State": "state",
            "Zip": "zip",
            "Zip Code": "zip",
            # Property Data
            "Total Units": "total_units",
            "Owner Occupied": "owner_occupied",
            "Annual Tax Amount": "annual_tax_amount",
            "Assessed Value": "assessed_value",
            "Estimated Value": "estimated_value",
            # Loan Data - First Mortgage
            "LTV": "ltv",
            "Loan Type": "loan_type",
            "First Mortgage Type": "first_mortgage_type",
            "First Mortgage Amount": "first_mortgage_amount",
            "First Mortgage Balance": "first_mortgage_balance",
            "Term": "term",
            "Estimated New Payment": "estimated_new_payment",
            # Loan Data - Second Mortgage
            "Second Mortgage Type": "second_mortgage_type",
            "Second Mortgage Term": "second_mortgage_term",
            "Second Mortgage Balance": "second_mortgage_balance",
            "Has Second Mortgage": "has_second_mortgage",
            # Current Loan Details
            "Current Interest Rate": "current_interest_rate",
            "Current Lender": "current_lender",
            "ARM Index Type": "arm_index_type",
            "Origination Date": "origination_date",
            "Rate Adjustment Date": "rate_adjustment_date",
            # Phone Data
            "Phone 1": "phone_1",
            "Phone 2": "phone_2",
            "Phone 3": "phone_3",
            # Email Data
            "Email 1": "email_1",
            "Email 2": "email_2",
            "Email 3": "email_3",
            # Compliance Flags
            "In Litigator List": "in_litigator_list",
            "Phone 1 In DNC List": "phone_1_in_dnc",
            "Phone 2 In DNC List": "phone_2_in_dnc",
            "Phone 3 In DNC List": "phone_3_in_dnc",
        }

        # Rename columns that exist in the DataFrame
        for source_col, target_col in column_mapping.items():
            if source_col in df.columns and target_col not in df.columns:
                df[target_col] = df[source_col]

        # Also handle lowercase source columns
        lowercase_mapping = {
            "first_name": "first_name",
            "last_name": "last_name",
            "address": "address",
            "city": "city",
            "state": "state",
            "zip_code": "zip",
        }
        for source_col, target_col in lowercase_mapping.items():
            if source_col in df.columns and target_col not in df.columns:
                df[target_col] = df[source_col]

        # Define final column order matching the table schema
        final_columns = [
            "record_id",
            "job_id",
            "job_name",
            "table_id",
            "table_title",
            "lead_number",
            "campaign_date",
            "lead_campaign",
            "lead_source",
            "ref_id",
            "first_name",
            "last_name",
            "co_borrower_full_name",
            "address",
            "city",
            "state",
            "zip",
            "total_units",
            "owner_occupied",
            "annual_tax_amount",
            "assessed_value",
            "estimated_value",
            "ltv",
            "loan_type",
            "first_mortgage_type",
            "first_mortgage_amount",
            "first_mortgage_balance",
            "term",
            "estimated_new_payment",
            "second_mortgage_type",
            "second_mortgage_term",
            "second_mortgage_balance",
            "has_second_mortgage",
            "current_interest_rate",
            "current_lender",
            "arm_index_type",
            "origination_date",
            "rate_adjustment_date",
            "phone_1",
            "phone_2",
            "phone_3",
            "email_1",
            "email_2",
            "email_3",
            "in_litigator_list",
            "phone_1_in_dnc",
            "phone_2_in_dnc",
            "phone_3_in_dnc",
        ]

        # Ensure all columns exist, fill missing with empty string
        for col in final_columns:
            if col not in df.columns:
                df[col] = ""

        # Select and order columns
        result_df = df[final_columns].copy()

        # Replace NaN with empty string and ensure all values are strings
        result_df = result_df.fillna("")
        for col in result_df.columns:
            result_df[col] = result_df[col].astype(str)

        return result_df

    def _store_batch_results_bulk(
        self,
        job_id: str,
        job_name: str,
        records: pd.DataFrame,
        table_id: Optional[str] = None,
        table_title: Optional[str] = None,
    ) -> int:
        """
        Store batch results using Snowflake PUT/COPY INTO (10x faster than INSERT).

        This method:
        1. Prepares DataFrame with correct schema
        2. Writes to temporary CSV file
        3. Uses PUT to stage the file in Snowflake
        4. Uses COPY INTO to bulk load data
        5. Cleans up temporary files

        Returns:
            Number of records stored
        """
        if records.empty:
            return 0

        temp_file = None
        try:
            # Prepare DataFrame with correct column structure
            upload_df = self._prepare_dataframe_for_upload(
                job_id, job_name, records, table_id, table_title
            )

            # Create temporary CSV file
            temp_file = tempfile.NamedTemporaryFile(
                mode="w",
                suffix=".csv",
                prefix=f"etl_results_{job_id}_",
                delete=False,
            )
            temp_path = temp_file.name

            # Write DataFrame to CSV (Snowflake COPY INTO works best with CSV)
            upload_df.to_csv(temp_path, index=False, header=True)
            temp_file.close()

            self.logger.info(
                f"Created temp file for bulk upload: {temp_path} ({len(upload_df)} rows)"
            )

            # Stage the file using PUT command
            # Use a job-specific stage path to avoid conflicts
            stage_name = f"@~/etl_staging/{job_id}"
            file_name = os.path.basename(temp_path)

            put_sql = f"PUT 'file://{temp_path}' {stage_name} AUTO_COMPRESS=TRUE OVERWRITE=TRUE"
            self.snowflake_conn.execute_query(put_sql)
            self.logger.info(f"Staged file to {stage_name}/{file_name}")

            # COPY INTO the table from staged file
            copy_sql = f"""
            COPY INTO {self.database}.{self.schema}.{self.table}
            ("record_id", "job_id", "job_name", "table_id", "table_title",
             "lead_number", "campaign_date", "lead_campaign", "lead_source", "ref_id",
             "first_name", "last_name", "co_borrower_full_name", "address", "city", "state", "zip",
             "total_units", "owner_occupied", "annual_tax_amount", "assessed_value", "estimated_value",
             "ltv", "loan_type", "first_mortgage_type", "first_mortgage_amount", "first_mortgage_balance", "term", "estimated_new_payment",
             "second_mortgage_type", "second_mortgage_term", "second_mortgage_balance", "has_second_mortgage",
             "current_interest_rate", "current_lender", "arm_index_type", "origination_date", "rate_adjustment_date",
             "phone_1", "phone_2", "phone_3",
             "email_1", "email_2", "email_3",
             "in_litigator_list", "phone_1_in_dnc", "phone_2_in_dnc", "phone_3_in_dnc")
            FROM {stage_name}
            FILE_FORMAT = (
                TYPE = CSV
                SKIP_HEADER = 1
                FIELD_OPTIONALLY_ENCLOSED_BY = '"'
                NULL_IF = ('')
                EMPTY_FIELD_AS_NULL = FALSE
            )
            PURGE = TRUE
            ON_ERROR = 'CONTINUE'
            """

            result = self.snowflake_conn.execute_query(copy_sql)

            # Log COPY results
            if result is not None and not result.empty:
                rows_loaded = result.iloc[0].get("rows_loaded", len(upload_df))
                errors = result.iloc[0].get("errors_seen", 0)
                self.logger.info(
                    f"Bulk upload complete: {rows_loaded} rows loaded, {errors} errors"
                )
                return int(rows_loaded) if rows_loaded else len(upload_df)

            self.logger.info(f"Bulk uploaded {len(upload_df)} records to MASTER_PROCESSED_DB")
            return len(upload_df)

        except Exception as e:
            self.logger.error(f"Bulk upload failed: {e}")
            self.logger.info("Falling back to standard INSERT method")
            # Fall back to standard method
            return self._store_batch_results_standard(
                job_id, job_name, records, 500, table_id, table_title
            )

        finally:
            # Clean up temp file
            if temp_file and os.path.exists(temp_file.name):
                try:
                    os.remove(temp_file.name)
                except Exception:
                    pass

    def _store_batch_results_standard(
        self,
        job_id: str,
        job_name: str,
        records: pd.DataFrame,
        batch_size: int = 500,
        table_id: Optional[str] = None,
        table_title: Optional[str] = None,
    ) -> int:
        """
        Standard INSERT...UNION ALL method (fallback when bulk upload fails).
        This is the original implementation.
        """
        if records.empty:
            return 0

        total_stored = 0

        # Process in batches
        for i in range(0, len(records), batch_size):
            batch_df = records.iloc[i : i + batch_size]

            # Build SELECT statements for each row
            select_parts = []
            for _, row in batch_df.iterrows():
                record_id = str(uuid.uuid4())

                # Extract core fields
                lead_number = self._escape_string(row.get("Lead Number", ""))
                campaign_date = self._escape_string(row.get("Campaign Date", ""))
                lead_campaign = self._escape_string(row.get("Lead Campaign", ""))
                lead_source = self._escape_string(row.get("Lead Source", ""))
                ref_id = self._escape_string(row.get("Ref ID", ""))

                first_name = self._escape_string(row.get("First Name", row.get("first_name", "")))
                last_name = self._escape_string(row.get("Last Name", row.get("last_name", "")))
                co_borrower = self._escape_string(row.get("Co Borrower Full Name", ""))
                address = self._escape_string(row.get("Address", row.get("address", "")))
                city = self._escape_string(row.get("City", row.get("city", "")))
                state = self._escape_string(row.get("State", row.get("state", "")))
                zip_code = self._escape_string(
                    row.get("Zip", row.get("zip_code", row.get("Zip Code", "")))
                )

                total_units = self._escape_string(row.get("Total Units", ""))
                owner_occupied = self._escape_string(row.get("Owner Occupied", ""))
                annual_tax = self._escape_string(row.get("Annual Tax Amount", ""))
                assessed_value = self._escape_string(row.get("Assessed Value", ""))
                estimated_value = self._escape_string(row.get("Estimated Value", ""))

                ltv = self._escape_string(row.get("LTV", ""))
                loan_type = self._escape_string(row.get("Loan Type", ""))
                first_mortgage_type = self._escape_string(row.get("First Mortgage Type", ""))
                first_mortgage_amt = self._escape_string(row.get("First Mortgage Amount", ""))
                first_mortgage_bal = self._escape_string(row.get("First Mortgage Balance", ""))
                term = self._escape_string(row.get("Term", ""))
                estimated_payment = self._escape_string(row.get("Estimated New Payment", ""))

                second_mortgage_type = self._escape_string(row.get("Second Mortgage Type", ""))
                second_mortgage_term = self._escape_string(row.get("Second Mortgage Term", ""))
                second_mortgage_bal = self._escape_string(row.get("Second Mortgage Balance", ""))
                has_second = self._escape_string(row.get("Has Second Mortgage", ""))

                current_rate = self._escape_string(row.get("Current Interest Rate", ""))
                current_lender = self._escape_string(row.get("Current Lender", ""))
                arm_index = self._escape_string(row.get("ARM Index Type", ""))
                origination_date = self._escape_string(row.get("Origination Date", ""))
                rate_adj_date = self._escape_string(row.get("Rate Adjustment Date", ""))

                phone_1 = self._escape_string(row.get("Phone 1", ""))
                phone_2 = self._escape_string(row.get("Phone 2", ""))
                phone_3 = self._escape_string(row.get("Phone 3", ""))

                email_1 = self._escape_string(row.get("Email 1", ""))
                email_2 = self._escape_string(row.get("Email 2", ""))
                email_3 = self._escape_string(row.get("Email 3", ""))

                in_litigator = self._escape_string(row.get("In Litigator List", "No"))
                phone_1_dnc = self._escape_string(row.get("Phone 1 In DNC List", "No"))
                phone_2_dnc = self._escape_string(row.get("Phone 2 In DNC List", "No"))
                phone_3_dnc = self._escape_string(row.get("Phone 3 In DNC List", "No"))

                escaped_table_id = self._escape_string(table_id) if table_id else "NULL"
                escaped_table_title = self._escape_string(table_title) if table_title else "NULL"

                select_parts.append(
                    f"SELECT '{record_id}', '{job_id}', {self._escape_string(job_name)}, "
                    f"{escaped_table_id}, {escaped_table_title}, CURRENT_TIMESTAMP(), "
                    f"{lead_number}, {campaign_date}, {lead_campaign}, {lead_source}, {ref_id}, "
                    f"{first_name}, {last_name}, {co_borrower}, {address}, {city}, {state}, {zip_code}, "
                    f"{total_units}, {owner_occupied}, {annual_tax}, {assessed_value}, {estimated_value}, "
                    f"{ltv}, {loan_type}, {first_mortgage_type}, {first_mortgage_amt}, {first_mortgage_bal}, {term}, {estimated_payment}, "
                    f"{second_mortgage_type}, {second_mortgage_term}, {second_mortgage_bal}, {has_second}, "
                    f"{current_rate}, {current_lender}, {arm_index}, {origination_date}, {rate_adj_date}, "
                    f"{phone_1}, {phone_2}, {phone_3}, "
                    f"{email_1}, {email_2}, {email_3}, "
                    f"{in_litigator}, {phone_1_dnc}, {phone_2_dnc}, {phone_3_dnc}"
                )

            union_sql = " UNION ALL\n".join(select_parts)
            insert_sql = f"""
            INSERT INTO {self.database}.{self.schema}.{self.table}
            ("record_id", "job_id", "job_name", "table_id", "table_title", "processed_at",
             "lead_number", "campaign_date", "lead_campaign", "lead_source", "ref_id",
             "first_name", "last_name", "co_borrower_full_name", "address", "city", "state", "zip",
             "total_units", "owner_occupied", "annual_tax_amount", "assessed_value", "estimated_value",
             "ltv", "loan_type", "first_mortgage_type", "first_mortgage_amount", "first_mortgage_balance", "term", "estimated_new_payment",
             "second_mortgage_type", "second_mortgage_term", "second_mortgage_balance", "has_second_mortgage",
             "current_interest_rate", "current_lender", "arm_index_type", "origination_date", "rate_adjustment_date",
             "phone_1", "phone_2", "phone_3",
             "email_1", "email_2", "email_3",
             "in_litigator_list", "phone_1_in_dnc", "phone_2_in_dnc", "phone_3_in_dnc")
            {union_sql}
            """

            try:
                result = self.snowflake_conn.execute_query(insert_sql)
                if result is None:
                    self.logger.error("Failed to store batch - SQL execution returned None")
                    continue
                total_stored += len(batch_df)
                self.logger.info(f"Stored batch of {len(batch_df)} records (standard method)")
            except Exception as e:
                self.logger.error(f"Error storing batch: {e}")

        return total_stored

    def store_batch_results(
        self,
        job_id: str,
        job_name: str,
        records: pd.DataFrame,
        batch_size: int = 500,
        table_id: Optional[str] = None,
        table_title: Optional[str] = None,
    ) -> int:
        """
        Store batch of processed records to Snowflake.

        Uses bulk upload (PUT/COPY INTO) by default for 10x faster uploads.
        Falls back to standard INSERT method if bulk upload is disabled or fails.

        Args:
            job_id: ETL job identifier
            job_name: Script/job name for filtering
            records: DataFrame with processed records
            batch_size: Number of records per insert statement (used for standard method)
            table_id: Human-readable table ID (format: ScriptName_RowCount_DDMMYYYY)
            table_title: Custom display title for the results

        Returns:
            Number of records stored
        """
        if not self._ensure_connection():
            self.logger.error("Cannot store results - not connected")
            return 0

        if records.empty:
            return 0

        # Use bulk upload if enabled (default: True)
        if settings.snowflake.use_bulk_upload:
            self.logger.info(f"Using bulk upload (COPY INTO) for {len(records)} records")
            return self._store_batch_results_bulk(job_id, job_name, records, table_id, table_title)
        else:
            self.logger.info(f"Using standard INSERT method for {len(records)} records")
            return self._store_batch_results_standard(
                job_id, job_name, records, batch_size, table_id, table_title
            )

    def get_job_results(
        self,
        job_id: str = None,
        job_name: str = None,
        offset: int = 0,
        limit: int = 100,
        exclude_litigators: bool = False,
    ) -> Dict[str, Any]:
        """
        Get paginated job results from MASTER_PROCESSED_DB.

        Args:
            job_id: Filter by specific job ID
            job_name: Filter by job name
            offset: Pagination offset
            limit: Maximum records to return
            exclude_litigators: If True, exclude records in litigator list

        Returns:
            Dict with 'records', 'total', 'offset', 'limit'
        """
        if not self._ensure_connection():
            return {"records": [], "total": 0, "offset": offset, "limit": limit}

        # Build WHERE clause
        conditions = []
        if job_id:
            conditions.append(f"\"job_id\" = '{job_id}'")
        if job_name:
            conditions.append(f"\"job_name\" = '{job_name.replace(chr(39), chr(39)+chr(39))}'")
        if exclude_litigators:
            conditions.append("\"in_litigator_list\" != 'Yes'")

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        # Get total count
        count_sql = f"""
        SELECT COUNT(*) as total
        FROM {self.database}.{self.schema}.{self.table}
        {where_clause}
        """
        count_result = self.snowflake_conn.execute_query(count_sql)
        total = (
            int(count_result.iloc[0]["TOTAL"])
            if count_result is not None and not count_result.empty
            else 0
        )

        # Get paginated records
        # Snowflake requires LIMIT before OFFSET
        query_sql = f"""
        SELECT *
        FROM {self.database}.{self.schema}.{self.table}
        {where_clause}
        ORDER BY "processed_at" DESC
        LIMIT {limit}
        OFFSET {offset}
        """

        result_df = self.snowflake_conn.execute_query(query_sql)

        records = []
        if result_df is not None and not result_df.empty:
            result_df = self._normalize_columns(result_df)

            # Rename 'zip' to 'zip_code' for frontend compatibility
            if "zip" in result_df.columns:
                result_df = result_df.rename(columns={"zip": "zip_code"})

            raw_records = result_df.to_dict("records")

            # Expand additional_data JSON into separate columns
            for record in raw_records:
                additional_data = record.get("additional_data", {})

                # Parse additional_data if it's a string (JSON)
                if isinstance(additional_data, str):
                    try:
                        import json

                        additional_data = json.loads(additional_data)
                    except Exception as e:
                        self.logger.warning(f"Failed to parse additional_data JSON: {e}")
                        additional_data = {}

                # Merge additional_data fields into main record
                if isinstance(additional_data, dict):
                    for key, value in additional_data.items():
                        # Only add if not already present
                        if key not in record:
                            record[key] = value

                records.append(record)

        return {
            "records": records,
            "total": total,
            "offset": offset,
            "limit": limit,
            "litigator_count": (
                self._get_litigator_count(job_id, job_name) if job_id or job_name else 0
            ),
        }

    def _get_litigator_count(self, job_id: str = None, job_name: str = None) -> int:
        """Get count of litigator records for a job"""
        conditions = ["\"in_litigator_list\" = 'Yes'"]
        if job_id:
            conditions.append(f"\"job_id\" = '{job_id}'")
        if job_name:
            conditions.append(f"\"job_name\" = '{job_name.replace(chr(39), chr(39)+chr(39))}'")

        where_clause = f"WHERE {' AND '.join(conditions)}"

        count_sql = f"""
        SELECT COUNT(*) as total
        FROM {self.database}.{self.schema}.{self.table}
        {where_clause}
        """
        result = self.snowflake_conn.execute_query(count_sql)
        return int(result.iloc[0]["TOTAL"]) if result is not None and not result.empty else 0

    def get_jobs_list(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get list of unique jobs with their record counts.

        Returns:
            List of dicts with job_id, job_name, record_count, last_processed
        """
        if not self._ensure_connection():
            return []

        query_sql = f"""
        SELECT
            "job_id",
            "job_name",
            COUNT(*) as record_count,
            SUM(CASE WHEN "in_litigator_list" = 'Yes' THEN 1 ELSE 0 END) as litigator_count,
            SUM(CASE WHEN "phone_1_in_dnc" = 'Yes' OR "phone_2_in_dnc" = 'Yes' OR "phone_3_in_dnc" = 'Yes' THEN 1 ELSE 0 END) as dnc_count,
            SUM(CASE WHEN "in_litigator_list" = 'Yes' AND ("phone_1_in_dnc" = 'Yes' OR "phone_2_in_dnc" = 'Yes' OR "phone_3_in_dnc" = 'Yes') THEN 1 ELSE 0 END) as both_count,
            MAX("processed_at") as last_processed
        FROM {self.database}.{self.schema}.{self.table}
        GROUP BY "job_id", "job_name"
        ORDER BY last_processed DESC
        LIMIT {limit}
        """

        result_df = self.snowflake_conn.execute_query(query_sql)

        if result_df is not None and not result_df.empty:
            result_df = self._normalize_columns(result_df)
            return result_df.to_dict("records")
        return []

    def export_to_csv(
        self, job_id: str = None, job_name: str = None, exclude_litigators: bool = False
    ) -> Optional[pd.DataFrame]:
        """
        Export job results to DataFrame for CSV download.
        Matches Google Sheets column format exactly.

        Args:
            job_id: Filter by job ID
            job_name: Filter by job name
            exclude_litigators: If True, exclude litigator records

        Returns:
            DataFrame suitable for CSV export
        """
        if not self._ensure_connection():
            return None

        # Build WHERE clause
        conditions = []
        if job_id:
            conditions.append(f"\"job_id\" = '{job_id}'")
        if job_name:
            conditions.append(f"\"job_name\" = '{job_name.replace(chr(39), chr(39)+chr(39))}'")
        if exclude_litigators:
            conditions.append("\"in_litigator_list\" != 'Yes'")

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        # Get all data including additional_data
        query_sql = f"""
        SELECT *
        FROM {self.database}.{self.schema}.{self.table}
        {where_clause}
        ORDER BY "processed_at" DESC
        """

        result_df = self.snowflake_conn.execute_query(query_sql)

        if result_df is None or result_df.empty:
            return None

        # Normalize column names to lowercase
        result_df = self._normalize_columns(result_df)

        # Expand additional_data JSON into separate columns
        expanded_records = []
        for _, row in result_df.iterrows():
            record = row.to_dict()
            additional_data = record.get("additional_data", {})

            # Parse additional_data if it's a string
            if isinstance(additional_data, str):
                try:
                    import json

                    additional_data = json.loads(additional_data)
                except Exception:
                    additional_data = {}

            # Merge additional_data into record
            if isinstance(additional_data, dict):
                record.update(additional_data)

            expanded_records.append(record)

        # Create DataFrame from expanded records
        expanded_df = pd.DataFrame(expanded_records)

        # Define Google Sheets column order (exact match)
        google_sheets_columns = [
            "Lead Number",
            "Campaign Date",
            "Lead Campaign",
            "Lead Source",
            "Ref ID",
            "First Name",
            "Last Name",
            "Co Borrower Full Name",
            "Address",
            "City",
            "State",
            "Zip",
            "Total Units",
            "Owner Occupied",
            "Annual Tax Amount",
            "LTV",
            "Loan Type",
            "Assessed Value",
            "Estimated Value",
            "First Mortgage Amount",
            "First Mortgage Balance",
            "Term",
            "Second Mortgage Amount",
            "Has Second Mortgage",
            "Estimated New Payment",
            "Second Mortgage Type",
            "Second Mortgage Term",
            "Current Interest Rate",
            "Current Lender",
            "ARM Index Type",
            "Origination Date",
            "First Mortgage Type",
            "Rate Adjustment Date",
            "Phone 1",
            "Phone 2",
            "Phone 3",
            "Email 1",
            "Email 2",
            "Email 3",
            "Phone 1 In DNC List",
            "Phone 2 In DNC List",
            "Phone 3 In DNC List",
            "In Litigator List",
        ]

        # Map database columns to Google Sheets format
        column_mapping = {
            "first_name": "First Name",
            "last_name": "Last Name",
            "address": "Address",
            "city": "City",
            "state": "State",
            "zip_code": "Zip",
            "phone_1": "Phone 1",
            "phone_2": "Phone 2",
            "phone_3": "Phone 3",
            "email_1": "Email 1",
            "email_2": "Email 2",
            "email_3": "Email 3",
            "in_litigator_list": "In Litigator List",
            "phone_1_in_dnc": "Phone 1 In DNC List",
            "phone_2_in_dnc": "Phone 2 In DNC List",
            "phone_3_in_dnc": "Phone 3 In DNC List",
        }

        # Rename columns
        expanded_df = expanded_df.rename(columns=column_mapping)

        # Select only Google Sheets columns that exist in the data
        available_columns = [col for col in google_sheets_columns if col in expanded_df.columns]
        export_df = expanded_df[available_columns]

        return export_df

    def delete_job_results(self, job_id: str) -> bool:
        """Delete all results for a specific job"""
        if not self._ensure_connection():
            return False

        delete_sql = f"""
        DELETE FROM {self.database}.{self.schema}.{self.table}
        WHERE "job_id" = '{job_id}'
        """

        try:
            self.snowflake_conn.execute_query(delete_sql)
            self.logger.info(f"Deleted results for job {job_id}")
            return True
        except Exception as e:
            self.logger.error(f"Error deleting job results: {e}")
            return False

    def disconnect(self):
        """Close Snowflake connection"""
        if self._connected:
            self.snowflake_conn.disconnect()
            self._connected = False


# Global instance
_results_service: Optional[ETLResultsService] = None


def get_results_service() -> ETLResultsService:
    """Get or create ETL Results Service instance"""
    global _results_service
    if _results_service is None:
        _results_service = ETLResultsService()
    return _results_service
