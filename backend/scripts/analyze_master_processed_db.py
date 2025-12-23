#!/usr/bin/env python3
"""
Analyze MASTER_PROCESSED_DB Table Structure

This script:
1. Connects to Snowflake using credentials from old_app
2. Queries all columns in MASTER_PROCESSED_DB
3. Checks if there's an additional_data JSON column
4. Extracts unique keys from the JSON and creates new columns if needed
"""

import sys
import json

# Add old_app to path for credentials
old_app_path = "/home/aallouch/projects/LodasoftETL/old_app"
sys.path.insert(0, old_app_path)

import snowflake.connector  # noqa: E402
from cryptography.hazmat.primitives import serialization  # noqa: E402
from cryptography.hazmat.primitives.serialization import (  # noqa: E402
    Encoding,
    PrivateFormat,
    NoEncryption,
)


# Snowflake connection settings from old_app
SNOWFLAKE_CONFIG = {
    "account": "HTWNYRU-CL36377",
    "user": "SDABABNEH",
    "role": "ACCOUNTADMIN",
    "warehouse": "COMPUTE_WH",
    "database": "PROCESSED_DATA_DB",  # Where MASTER_PROCESSED_DB lives
    "schema": "PUBLIC",
    "private_key_path": "/home/aallouch/projects/LodasoftETL/new_app/rsa_key.p8",
    "private_key_password": "n9caykPwD97SgAP",  # Key is encrypted
}


def load_private_key(key_path: str, password: str = None) -> bytes:
    """Load and convert private key to DER format for Snowflake."""
    with open(key_path, "rb") as f:
        key_data = f.read()

    # Try with password first (encrypted key)
    try:
        private_key_obj = serialization.load_pem_private_key(
            key_data,
            password=password.encode() if password else None,
        )
    except (TypeError, ValueError):
        # Key is not encrypted, try without password
        private_key_obj = serialization.load_pem_private_key(
            key_data,
            password=None,
        )

    return private_key_obj.private_bytes(
        encoding=Encoding.DER,
        format=PrivateFormat.PKCS8,
        encryption_algorithm=NoEncryption(),
    )


def connect_snowflake():
    """Create Snowflake connection."""
    print("Connecting to Snowflake...")
    print(f"  Account: {SNOWFLAKE_CONFIG['account']}")
    print(f"  User: {SNOWFLAKE_CONFIG['user']}")
    print(f"  Database: {SNOWFLAKE_CONFIG['database']}")

    private_key_der = load_private_key(
        SNOWFLAKE_CONFIG["private_key_path"], SNOWFLAKE_CONFIG["private_key_password"]
    )

    conn = snowflake.connector.connect(
        account=SNOWFLAKE_CONFIG["account"],
        user=SNOWFLAKE_CONFIG["user"],
        authenticator="snowflake",
        private_key=private_key_der,
        role=SNOWFLAKE_CONFIG["role"],
        warehouse=SNOWFLAKE_CONFIG["warehouse"],
        database=SNOWFLAKE_CONFIG["database"],
        schema=SNOWFLAKE_CONFIG["schema"],
        autocommit=True,
        insecure_mode=True,  # Required for some environments
        ocsp_fail_open=True,
    )

    print("✅ Connected to Snowflake")
    return conn


def get_table_columns(conn) -> list[dict]:
    """Get all columns from MASTER_PROCESSED_DB."""
    print("\n📋 Fetching table columns...")

    cursor = conn.cursor()

    # Try DESCRIBE first
    try:
        cursor.execute("DESCRIBE TABLE MASTER_PROCESSED_DB")
        columns = []
        for row in cursor.fetchall():
            columns.append(
                {
                    "name": row[0],
                    "type": row[1],
                    "nullable": row[3],
                }
            )
        return columns
    except Exception as e:
        print(f"DESCRIBE failed: {e}")

    # Fallback to INFORMATION_SCHEMA
    cursor.execute(
        """
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'PUBLIC'
        AND TABLE_NAME = 'MASTER_PROCESSED_DB'
        ORDER BY ORDINAL_POSITION
    """
    )

    columns = []
    for row in cursor.fetchall():
        columns.append(
            {
                "name": row[0],
                "type": row[1],
                "nullable": row[2],
            }
        )

    return columns


def check_additional_data_column(conn) -> tuple[bool, list[str]]:
    """
    Check if additional_data column exists and extract unique JSON keys.

    Returns:
        (has_additional_data, list_of_unique_keys)
    """
    cursor = conn.cursor()

    # Check if column exists
    cursor.execute(
        """
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'PUBLIC'
        AND TABLE_NAME = 'MASTER_PROCESSED_DB'
        AND COLUMN_NAME = 'additional_data'
    """
    )

    result = cursor.fetchone()
    if result[0] == 0:
        return False, []

    print("\n🔍 Found 'additional_data' column, extracting JSON keys...")

    # Sample some rows to get unique keys
    cursor.execute(
        """
        SELECT "additional_data"
        FROM MASTER_PROCESSED_DB
        WHERE "additional_data" IS NOT NULL
        AND "additional_data" != ''
        AND "additional_data" != 'null'
        LIMIT 1000
    """
    )

    all_keys = set()
    for row in cursor.fetchall():
        json_str = row[0]
        if json_str:
            try:
                data = json.loads(json_str)
                if isinstance(data, dict):
                    all_keys.update(data.keys())
            except (json.JSONDecodeError, TypeError):
                pass

    return True, sorted(list(all_keys))


def get_sample_additional_data(conn, limit: int = 10) -> list[dict]:
    """Get sample additional_data values."""
    cursor = conn.cursor()

    cursor.execute(
        f"""
        SELECT "record_id", "additional_data"
        FROM MASTER_PROCESSED_DB
        WHERE "additional_data" IS NOT NULL
        AND "additional_data" != ''
        AND "additional_data" != 'null'
        LIMIT {limit}
    """
    )

    samples = []
    for row in cursor.fetchall():
        try:
            data = json.loads(row[1]) if row[1] else {}
            samples.append({"record_id": row[0], "additional_data": data})
        except (json.JSONDecodeError, TypeError):
            pass

    return samples


def split_json_to_columns(conn, keys: list[str], dry_run: bool = True):
    """
    Split additional_data JSON keys into separate columns.

    Args:
        conn: Snowflake connection
        keys: List of JSON keys to extract
        dry_run: If True, only show what would be done
    """
    cursor = conn.cursor()

    print(f"\n{'🔧 DRY RUN:' if dry_run else '🚀 EXECUTING:'} Splitting JSON into columns...")

    # First, add the columns if they don't exist
    for key in keys:
        # Convert key to safe column name (lowercase, underscores)
        col_name = key.lower().replace(" ", "_").replace("-", "_")

        add_col_sql = f"""
            ALTER TABLE MASTER_PROCESSED_DB
            ADD COLUMN IF NOT EXISTS "{col_name}" VARCHAR
        """

        if dry_run:
            print(f"  Would add column: {col_name}")
        else:
            try:
                cursor.execute(add_col_sql)
                print(f"  ✅ Added column: {col_name}")
            except Exception as e:
                print(f"  ⚠️  Column {col_name} may already exist: {e}")

    # Then, update the columns from JSON data
    print("\n📝 Updating columns from JSON data...")

    for key in keys:
        col_name = key.lower().replace(" ", "_").replace("-", "_")

        # Use Snowflake's JSON parsing
        update_sql = f"""
            UPDATE MASTER_PROCESSED_DB
            SET "{col_name}" = COALESCE(
                TRY_PARSE_JSON("additional_data"):"{key}"::VARCHAR,
                "{col_name}"
            )
            WHERE "additional_data" IS NOT NULL
            AND "additional_data" != ''
            AND TRY_PARSE_JSON("additional_data"):"{key}" IS NOT NULL
        """

        if dry_run:
            print(f"  Would update column: {col_name} from JSON key: {key}")
        else:
            try:
                cursor.execute(update_sql)
                rows_updated = cursor.rowcount
                print(f"  ✅ Updated column {col_name}: {rows_updated} rows")
            except Exception as e:
                print(f"  ❌ Error updating {col_name}: {e}")


def get_total_records(conn) -> int:
    """Get total record count."""
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM MASTER_PROCESSED_DB")
    return cursor.fetchone()[0]


def main():
    """Main analysis function."""
    print("=" * 60)
    print("MASTER_PROCESSED_DB Analysis Script")
    print("=" * 60)

    conn = connect_snowflake()

    try:
        # Get total records
        total = get_total_records(conn)
        print(f"\n📊 Total records in MASTER_PROCESSED_DB: {total:,}")

        # Get table columns
        columns = get_table_columns(conn)
        print(f"\n📋 Table has {len(columns)} columns:")
        print("-" * 50)
        for col in columns:
            print(f"  {col['name']:40} {col['type']}")

        # Check for additional_data column
        has_json, json_keys = check_additional_data_column(conn)

        if has_json:
            print("\n🗃️  additional_data column found!")

            if json_keys:
                print(f"\n📝 Unique JSON keys found ({len(json_keys)} keys):")
                for key in json_keys:
                    print(f"  - {key}")

                # Show sample data
                samples = get_sample_additional_data(conn, limit=5)
                if samples:
                    print("\n📋 Sample additional_data values:")
                    for i, sample in enumerate(samples, 1):
                        print(f"  [{i}] record_id: {sample['record_id'][:8]}...")
                        for k, v in sample["additional_data"].items():
                            print(f"      {k}: {v}")

                # Ask user if they want to proceed
                print("\n" + "=" * 60)
                print("Next Steps:")
                print("=" * 60)
                print("1. Run with --execute to add columns and migrate data")
                print("2. The following columns will be added:")
                for key in json_keys:
                    col_name = key.lower().replace(" ", "_").replace("-", "_")
                    print(f"   - {col_name}")

                # Check if --execute flag is passed
                if len(sys.argv) > 1 and sys.argv[1] == "--execute":
                    print("\n🚀 Executing migration...")
                    split_json_to_columns(conn, json_keys, dry_run=False)
                    print("\n✅ Migration complete!")
                else:
                    print("\n⚠️  Dry run only. Pass --execute to actually migrate data.")
                    split_json_to_columns(conn, json_keys, dry_run=True)
            else:
                print("  No JSON data found in additional_data column")
        else:
            print("\n✅ No additional_data column found - table schema is clean!")

    finally:
        conn.close()
        print("\n🔒 Connection closed")


if __name__ == "__main__":
    main()
