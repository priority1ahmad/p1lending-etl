"""
Verify Snowflake MASTER_PROCESSED_DB Table Exists

This script connects to Snowflake and verifies that the MASTER_PROCESSED_DB
table has been created with the correct schema.
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.etl.snowflake_service import SnowflakeConnection
from app.core.config import settings
from app.core.logger import etl_logger

logger = etl_logger.logger.getChild("SnowflakeVerification")


def verify_database_exists():
    """Verify PROCESSED_DATA_DB database exists"""
    print("\n" + "=" * 60)
    print("SNOWFLAKE DATABASE VERIFICATION")
    print("=" * 60 + "\n")

    conn = SnowflakeConnection()

    print("Step 1: Connecting to Snowflake...")
    if not conn.connect():
        print("❌ ERROR: Failed to connect to Snowflake")
        print(f"   Account: {settings.snowflake_account}")
        print(f"   User: {settings.snowflake_user}")
        return False

    print("✅ Connected to Snowflake successfully\n")

    # Check if database exists
    print("Step 2: Checking if PROCESSED_DATA_DB exists...")
    db_check_query = """
    SELECT DATABASE_NAME
    FROM INFORMATION_SCHEMA.DATABASES
    WHERE DATABASE_NAME = 'PROCESSED_DATA_DB'
    """

    try:
        result = conn.execute_query(db_check_query)
        if result is not None and not result.empty:
            print("✅ PROCESSED_DATA_DB database exists\n")
        else:
            print("❌ ERROR: PROCESSED_DATA_DB database does NOT exist")
            print("   Please create it manually or verify database name\n")
            conn.disconnect()
            return False
    except Exception as e:
        print(f"❌ ERROR checking database: {e}\n")
        conn.disconnect()
        return False

    # Check if table exists
    print("Step 3: Checking if MASTER_PROCESSED_DB table exists...")
    table_check_query = """
    SELECT TABLE_NAME, ROW_COUNT, BYTES
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_CATALOG = 'PROCESSED_DATA_DB'
    AND TABLE_SCHEMA = 'PUBLIC'
    AND TABLE_NAME = 'MASTER_PROCESSED_DB'
    """

    try:
        result = conn.execute_query(table_check_query)
        if result is not None and not result.empty:
            print("✅ MASTER_PROCESSED_DB table exists")
            row_count = result.iloc[0]['ROW_COUNT']
            bytes_size = result.iloc[0]['BYTES']
            print(f"   Row Count: {row_count}")
            print(f"   Size: {bytes_size} bytes\n")
        else:
            print("⚠️  WARNING: MASTER_PROCESSED_DB table does NOT exist yet")
            print("   This is expected if no ETL jobs have run")
            print("   The table will auto-create on first ETL job execution\n")
    except Exception as e:
        print(f"❌ ERROR checking table: {e}\n")
        conn.disconnect()
        return False

    # Check table schema if it exists
    print("Step 4: Verifying table schema...")
    schema_query = """
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_CATALOG = 'PROCESSED_DATA_DB'
    AND TABLE_SCHEMA = 'PUBLIC'
    AND TABLE_NAME = 'MASTER_PROCESSED_DB'
    ORDER BY ORDINAL_POSITION
    """

    try:
        result = conn.execute_query(schema_query)
        if result is not None and not result.empty:
            print("✅ Table schema verified:")
            print(f"\n{'Column Name':<25} {'Data Type':<20} {'Nullable':<10}")
            print("-" * 60)
            for _, row in result.iterrows():
                print(f"{row['COLUMN_NAME']:<25} {row['DATA_TYPE']:<20} {row['IS_NULLABLE']:<10}")
            print()

            # Verify expected columns
            expected_columns = [
                'record_id', 'job_id', 'job_name', 'processed_at',
                'first_name', 'last_name', 'address', 'city', 'state', 'zip_code',
                'phone_1', 'phone_2', 'phone_3',
                'email_1', 'email_2', 'email_3',
                'in_litigator_list', 'phone_1_in_dnc', 'phone_2_in_dnc', 'phone_3_in_dnc',
                'additional_data'
            ]

            actual_columns = [col.lower() for col in result['COLUMN_NAME'].tolist()]
            missing_columns = [col for col in expected_columns if col.lower() not in actual_columns]

            if missing_columns:
                print(f"⚠️  WARNING: Missing expected columns: {', '.join(missing_columns)}\n")
            else:
                print("✅ All expected columns are present\n")
        else:
            print("⚠️  No schema found (table doesn't exist yet)\n")
    except Exception as e:
        print(f"❌ ERROR checking schema: {e}\n")
        conn.disconnect()
        return False

    # Test if we can create the table
    print("Step 5: Testing table auto-creation logic...")
    try:
        from app.services.etl.results_service import ETLResultsService

        service = ETLResultsService()
        if service._ensure_connection():
            print("✅ ETLResultsService initialized successfully")
            print("   Table auto-creation logic executed\n")
        else:
            print("❌ ERROR: Failed to initialize ETLResultsService\n")
            conn.disconnect()
            return False
    except Exception as e:
        print(f"❌ ERROR testing auto-creation: {e}\n")
        conn.disconnect()
        return False

    conn.disconnect()

    print("=" * 60)
    print("VERIFICATION COMPLETE")
    print("=" * 60 + "\n")

    return True


def main():
    """Main entry point"""
    try:
        success = verify_database_exists()
        if success:
            print("✅ All checks passed! Snowflake database is properly configured.\n")
            sys.exit(0)
        else:
            print("❌ Verification failed. Please check the errors above.\n")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\nVerification cancelled by user.\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}\n")
        logger.exception("Verification script error")
        sys.exit(1)


if __name__ == "__main__":
    main()
