"""
Migrate Additional Data to Proper Columns

This script migrates data from the `additional_data` JSON column
to the proper individual columns in MASTER_PROCESSED_DB.

This fixes the issue where older ETL runs stored data like "Lead Number",
"Campaign Date", "LTV" etc. in a JSON blob instead of proper columns.

Usage:
    cd backend
    source venv/bin/activate
    python scripts/migrate_additional_data.py

Options:
    --dry-run    Show what would be migrated without making changes
    --batch-size Number of records to process per batch (default: 1000)
"""

import sys
import json
import argparse
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.etl.snowflake_service import SnowflakeConnection
from app.core.logger import etl_logger

logger = etl_logger.logger.getChild("MigrateAdditionalData")


# Mapping from additional_data keys (Title Case) to column names (lowercase)
FIELD_MAPPING = {
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
    # Phone Data (these are usually already in proper columns, but include for completeness)
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


def escape_sql_value(value):
    """Escape a value for SQL insertion"""
    if value is None or value == "":
        return "NULL"
    # Escape single quotes
    escaped = str(value).replace("'", "''")
    return f"'{escaped}'"


def check_additional_data_column_exists(conn):
    """Check if additional_data column exists in the table"""
    query = """
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_CATALOG = 'PROCESSED_DATA_DB'
    AND TABLE_SCHEMA = 'PUBLIC'
    AND TABLE_NAME = 'MASTER_PROCESSED_DB'
    AND COLUMN_NAME = 'additional_data'
    """
    result = conn.execute_query(query)
    return result is not None and not result.empty


def get_records_with_additional_data(conn, offset=0, limit=1000):
    """Fetch records that have non-empty additional_data"""
    query = f"""
    SELECT "record_id", "additional_data"
    FROM PROCESSED_DATA_DB.PUBLIC.MASTER_PROCESSED_DB
    WHERE "additional_data" IS NOT NULL
      AND "additional_data" != ''
      AND "additional_data" != '{{}}'
    ORDER BY "record_id"
    LIMIT {limit}
    OFFSET {offset}
    """
    return conn.execute_query(query)


def count_records_with_additional_data(conn):
    """Count records that have non-empty additional_data"""
    query = """
    SELECT COUNT(*) as cnt
    FROM PROCESSED_DATA_DB.PUBLIC.MASTER_PROCESSED_DB
    WHERE "additional_data" IS NOT NULL
      AND "additional_data" != ''
      AND "additional_data" != '{}'
    """
    result = conn.execute_query(query)
    if result is not None and not result.empty:
        return int(result.iloc[0]["CNT"])
    return 0


def migrate_record(conn, record_id, additional_data_json, dry_run=False):
    """
    Migrate a single record's additional_data to proper columns.

    Returns the number of fields migrated.
    """
    try:
        # Parse the JSON
        if isinstance(additional_data_json, str):
            data = json.loads(additional_data_json)
        else:
            data = additional_data_json

        if not isinstance(data, dict) or not data:
            return 0

        # Build SET clause for UPDATE
        set_parts = []
        for source_key, target_column in FIELD_MAPPING.items():
            if source_key in data:
                value = data[source_key]
                if value is not None and value != "":
                    set_parts.append(f'"{target_column}" = {escape_sql_value(value)}')

        if not set_parts:
            return 0

        # Add clearing the additional_data column
        set_parts.append('"additional_data" = NULL')

        # Build and execute UPDATE
        update_sql = f"""
        UPDATE PROCESSED_DATA_DB.PUBLIC.MASTER_PROCESSED_DB
        SET {", ".join(set_parts)}
        WHERE "record_id" = '{record_id}'
        """

        if dry_run:
            logger.info(
                f"[DRY-RUN] Would update record {record_id} with {len(set_parts) - 1} fields"
            )
        else:
            conn.execute_query(update_sql)

        return len(set_parts) - 1  # Exclude the additional_data = NULL

    except json.JSONDecodeError as e:
        logger.warning(f"Failed to parse JSON for record {record_id}: {e}")
        return 0
    except Exception as e:
        logger.error(f"Error migrating record {record_id}: {e}")
        return 0


def ensure_columns_exist(conn):
    """Ensure all target columns exist in the table"""
    print("\nEnsuring all target columns exist...")

    columns_to_add = list(set(FIELD_MAPPING.values()))

    for col_name in columns_to_add:
        try:
            alter_sql = f"""
            ALTER TABLE PROCESSED_DATA_DB.PUBLIC.MASTER_PROCESSED_DB
            ADD COLUMN IF NOT EXISTS "{col_name}" VARCHAR
            """
            conn.execute_query(alter_sql)
        except Exception:
            # Column likely already exists
            pass

    print(f"  Verified {len(columns_to_add)} columns exist")


def main():
    parser = argparse.ArgumentParser(description="Migrate additional_data to proper columns")
    parser.add_argument(
        "--dry-run", action="store_true", help="Show what would be done without making changes"
    )
    parser.add_argument(
        "--batch-size", type=int, default=1000, help="Records per batch (default: 1000)"
    )
    args = parser.parse_args()

    print("\n" + "=" * 60)
    print("MIGRATE ADDITIONAL_DATA TO PROPER COLUMNS")
    print("=" * 60)

    if args.dry_run:
        print("\n[DRY-RUN MODE] No changes will be made\n")

    conn = SnowflakeConnection()

    print("\nStep 1: Connecting to Snowflake...")
    if not conn.connect():
        print("ERROR: Failed to connect to Snowflake")
        sys.exit(1)
    print("  Connected successfully")

    # Check if additional_data column exists
    print("\nStep 2: Checking if additional_data column exists...")
    if not check_additional_data_column_exists(conn):
        print("  additional_data column does not exist - nothing to migrate")
        conn.disconnect()
        sys.exit(0)
    print("  additional_data column found")

    # Count records to migrate
    print("\nStep 3: Counting records with additional_data...")
    total_records = count_records_with_additional_data(conn)
    print(f"  Found {total_records} records with additional_data to migrate")

    if total_records == 0:
        print("\n  No records to migrate!")
        conn.disconnect()
        sys.exit(0)

    # Ensure columns exist
    if not args.dry_run:
        ensure_columns_exist(conn)

    # Process in batches
    print(f"\nStep 4: Migrating records (batch size: {args.batch_size})...")
    offset = 0
    total_migrated = 0
    total_fields_updated = 0

    while True:
        records_df = get_records_with_additional_data(conn, offset, args.batch_size)

        if records_df is None or records_df.empty:
            break

        batch_migrated = 0
        batch_fields = 0

        for _, row in records_df.iterrows():
            record_id = row["record_id"] if "record_id" in row else row["RECORD_ID"]
            additional_data = (
                row["additional_data"] if "additional_data" in row else row["ADDITIONAL_DATA"]
            )

            fields_updated = migrate_record(conn, record_id, additional_data, args.dry_run)
            if fields_updated > 0:
                batch_migrated += 1
                batch_fields += fields_updated

        total_migrated += batch_migrated
        total_fields_updated += batch_fields
        offset += args.batch_size

        print(f"  Processed batch: {offset} records, migrated {batch_migrated} in this batch")

        if len(records_df) < args.batch_size:
            break

    print("\n" + "=" * 60)
    print("MIGRATION COMPLETE")
    print("=" * 60)
    print(f"\nTotal records migrated: {total_migrated}")
    print(f"Total fields updated: {total_fields_updated}")

    if args.dry_run:
        print("\n[DRY-RUN] No actual changes were made")
        print("Run without --dry-run to apply changes")

    conn.disconnect()
    print("\nDone!\n")


if __name__ == "__main__":
    main()
