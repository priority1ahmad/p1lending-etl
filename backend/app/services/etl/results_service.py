"""
ETL Results Service

Manages storage and retrieval of processed ETL results in Snowflake MASTER_PROCESSED_DB.
Replaces Google Sheets as the primary output destination.
"""

import uuid
import json
from typing import Optional, List, Dict, Any
from datetime import datetime
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
            "processed_at" TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),

            -- Person Data
            "first_name" VARCHAR,
            "last_name" VARCHAR,
            "address" VARCHAR,
            "city" VARCHAR,
            "state" VARCHAR,
            "zip_code" VARCHAR,

            -- Phone Data
            "phone_1" VARCHAR,
            "phone_2" VARCHAR,
            "phone_3" VARCHAR,

            -- Email Data
            "email_1" VARCHAR,
            "email_2" VARCHAR,
            "email_3" VARCHAR,

            -- Compliance Flags
            "in_litigator_list" VARCHAR DEFAULT 'No',
            "phone_1_in_dnc" VARCHAR DEFAULT 'No',
            "phone_2_in_dnc" VARCHAR DEFAULT 'No',
            "phone_3_in_dnc" VARCHAR DEFAULT 'No',

            -- Additional Data (JSON for flexibility)
            "additional_data" VARIANT,

            PRIMARY KEY ("record_id")
        )
        """
        try:
            self.snowflake_conn.execute_query(create_sql)
            self.logger.info(f"Ensured table {self.table} exists")
        except Exception as e:
            self.logger.error(f"Error creating table: {e}")

    def _escape_string(self, value: Any) -> str:
        """Escape string value for SQL insertion"""
        if value is None or (isinstance(value, float) and pd.isna(value)):
            return "NULL"
        str_val = str(value).replace("'", "''").replace("\\", "\\\\")
        return f"'{str_val}'"

    def store_batch_results(
        self,
        job_id: str,
        job_name: str,
        records: pd.DataFrame,
        batch_size: int = 500
    ) -> int:
        """
        Store batch of processed records to Snowflake.

        Args:
            job_id: ETL job identifier
            job_name: Script/job name for filtering
            records: DataFrame with processed records
            batch_size: Number of records per insert statement

        Returns:
            Number of records stored
        """
        if not self._ensure_connection():
            self.logger.error("Cannot store results - not connected")
            return 0

        if records.empty:
            return 0

        total_stored = 0

        # Process in batches
        for i in range(0, len(records), batch_size):
            batch_df = records.iloc[i:i + batch_size]

            values_parts = []
            for _, row in batch_df.iterrows():
                record_id = str(uuid.uuid4())

                # Extract core fields
                first_name = self._escape_string(row.get('First Name', row.get('first_name', '')))
                last_name = self._escape_string(row.get('Last Name', row.get('last_name', '')))
                address = self._escape_string(row.get('Address', row.get('address', '')))
                city = self._escape_string(row.get('City', row.get('city', '')))
                state = self._escape_string(row.get('State', row.get('state', '')))
                zip_code = self._escape_string(row.get('Zip', row.get('zip_code', row.get('Zip Code', ''))))

                # Extract phone fields
                phone_1 = self._escape_string(row.get('Phone 1', ''))
                phone_2 = self._escape_string(row.get('Phone 2', ''))
                phone_3 = self._escape_string(row.get('Phone 3', ''))

                # Extract email fields
                email_1 = self._escape_string(row.get('Email 1', ''))
                email_2 = self._escape_string(row.get('Email 2', ''))
                email_3 = self._escape_string(row.get('Email 3', ''))

                # Extract compliance flags
                in_litigator = self._escape_string(row.get('In Litigator List', 'No'))
                phone_1_dnc = self._escape_string(row.get('Phone 1 In DNC List', 'No'))
                phone_2_dnc = self._escape_string(row.get('Phone 2 In DNC List', 'No'))
                phone_3_dnc = self._escape_string(row.get('Phone 3 In DNC List', 'No'))

                # Store additional columns as JSON
                core_columns = {
                    'First Name', 'Last Name', 'Address', 'City', 'State', 'Zip', 'Zip Code',
                    'first_name', 'last_name', 'address', 'city', 'state', 'zip_code',
                    'Phone 1', 'Phone 2', 'Phone 3', 'Email 1', 'Email 2', 'Email 3',
                    'In Litigator List', 'Phone 1 In DNC List', 'Phone 2 In DNC List', 'Phone 3 In DNC List'
                }
                additional_data = {}
                for col in row.index:
                    if col not in core_columns:
                        val = row[col]
                        if pd.notna(val):
                            additional_data[col] = str(val) if not isinstance(val, (int, float, bool)) else val

                additional_json = json.dumps(additional_data).replace("'", "''")

                values_parts.append(
                    f"('{record_id}', '{job_id}', {self._escape_string(job_name)}, CURRENT_TIMESTAMP(), "
                    f"{first_name}, {last_name}, {address}, {city}, {state}, {zip_code}, "
                    f"{phone_1}, {phone_2}, {phone_3}, "
                    f"{email_1}, {email_2}, {email_3}, "
                    f"{in_litigator}, {phone_1_dnc}, {phone_2_dnc}, {phone_3_dnc}, "
                    f"PARSE_JSON('{additional_json}'))"
                )

            # Build and execute INSERT statement
            values_clause = ",\n".join(values_parts)
            insert_sql = f"""
            INSERT INTO {self.database}.{self.schema}.{self.table}
            ("record_id", "job_id", "job_name", "processed_at",
             "first_name", "last_name", "address", "city", "state", "zip_code",
             "phone_1", "phone_2", "phone_3",
             "email_1", "email_2", "email_3",
             "in_litigator_list", "phone_1_in_dnc", "phone_2_in_dnc", "phone_3_in_dnc",
             "additional_data")
            VALUES {values_clause}
            """

            try:
                self.snowflake_conn.execute_query(insert_sql)
                total_stored += len(batch_df)
                self.logger.info(f"Stored batch of {len(batch_df)} records to MASTER_PROCESSED_DB")
            except Exception as e:
                self.logger.error(f"Error storing batch: {e}")

        return total_stored

    def get_job_results(
        self,
        job_id: str = None,
        job_name: str = None,
        offset: int = 0,
        limit: int = 100,
        exclude_litigators: bool = False
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
            return {'records': [], 'total': 0, 'offset': offset, 'limit': limit}

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
        total = int(count_result.iloc[0]['TOTAL']) if count_result is not None and not count_result.empty else 0

        # Get paginated records
        query_sql = f"""
        SELECT *
        FROM {self.database}.{self.schema}.{self.table}
        {where_clause}
        ORDER BY "processed_at" DESC
        OFFSET {offset}
        LIMIT {limit}
        """

        result_df = self.snowflake_conn.execute_query(query_sql)

        records = []
        if result_df is not None and not result_df.empty:
            records = result_df.to_dict('records')

        return {
            'records': records,
            'total': total,
            'offset': offset,
            'limit': limit,
            'litigator_count': self._get_litigator_count(job_id, job_name) if job_id or job_name else 0
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
        return int(result.iloc[0]['TOTAL']) if result is not None and not result.empty else 0

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
            MAX("processed_at") as last_processed
        FROM {self.database}.{self.schema}.{self.table}
        GROUP BY "job_id", "job_name"
        ORDER BY last_processed DESC
        LIMIT {limit}
        """

        result_df = self.snowflake_conn.execute_query(query_sql)

        if result_df is not None and not result_df.empty:
            return result_df.to_dict('records')
        return []

    def export_to_csv(
        self,
        job_id: str = None,
        job_name: str = None,
        exclude_litigators: bool = False
    ) -> Optional[pd.DataFrame]:
        """
        Export job results to DataFrame for CSV download.

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

        query_sql = f"""
        SELECT
            "first_name" as "First Name",
            "last_name" as "Last Name",
            "address" as "Address",
            "city" as "City",
            "state" as "State",
            "zip_code" as "Zip",
            "phone_1" as "Phone 1",
            "phone_2" as "Phone 2",
            "phone_3" as "Phone 3",
            "email_1" as "Email 1",
            "email_2" as "Email 2",
            "email_3" as "Email 3",
            "in_litigator_list" as "In Litigator List",
            "phone_1_in_dnc" as "Phone 1 In DNC List",
            "phone_2_in_dnc" as "Phone 2 In DNC List",
            "phone_3_in_dnc" as "Phone 3 In DNC List",
            "job_name" as "Job Name",
            "processed_at" as "Processed At"
        FROM {self.database}.{self.schema}.{self.table}
        {where_clause}
        ORDER BY "processed_at" DESC
        """

        return self.snowflake_conn.execute_query(query_sql)

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
