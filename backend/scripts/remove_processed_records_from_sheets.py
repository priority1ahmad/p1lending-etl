"""
Script to remove records from Google Sheets that already exist in PERSON_CACHE
These are records that were processed before and shouldn't be in the sheet anymore.
Also calculates recommended row_limit for next ETL job (50K - remaining records).
"""

import sys
from pathlib import Path
import pandas as pd

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from app.services.etl.google_sheets_service import GoogleSheetsConnection
    from app.services.etl.snowflake_service import SnowflakeConnection
    from app.core.config import settings
    from app.core.logger import etl_logger
except ImportError as e:
    print("=" * 60)
    print("ERROR: Missing required dependencies!")
    print("=" * 60)
    print(f"Error: {e}")
    print("")
    print("This script must be run inside the Docker container.")
    print("")
    sys.exit(1)


def read_sheet_data(sheets_conn: GoogleSheetsConnection, sheet_name: str) -> pd.DataFrame:
    """Read all data from a Google Sheet"""
    try:
        result = sheets_conn.service.spreadsheets().values().get(
            spreadsheetId=settings.google_sheets.sheet_id,
            range=f"{sheet_name}!A:ZZ"
        ).execute()
        
        values = result.get('values', [])
        
        if not values:
            return pd.DataFrame()
        
        # First row is headers
        headers = values[0]
        data_rows = values[1:] if len(values) > 1 else []
        
        # Create DataFrame
        df = pd.DataFrame(data_rows, columns=headers)
        
        return df
    except Exception as e:
        print(f"❌ Error reading sheet: {e}")
        return pd.DataFrame()


def clear_sheet(sheets_conn: GoogleSheetsConnection, sheet_name: str) -> bool:
    """Clear all data from a sheet (keeps the sheet structure)"""
    try:
        sheets_conn.service.spreadsheets().values().clear(
            spreadsheetId=settings.google_sheets.sheet_id,
            range=f"{sheet_name}!A:ZZ"
        ).execute()
        
        print(f"✅ Cleared sheet '{sheet_name}'")
        return True
    except Exception as e:
        print(f"❌ Failed to clear sheet: {e}")
        return False


def remove_processed_records_from_sheet(sheet_name: str, address_column: str = "Address", target_total: int = 50000):
    """
    Remove records from Google Sheet that already exist in PERSON_CACHE
    These are records that were processed before and shouldn't be counted.
    
    Args:
        sheet_name: Name of the sheet to clean
        address_column: Column name containing addresses (default: "Address")
        target_total: Target total records after processing (default: 50000)
    """
    try:
        sheets_conn = GoogleSheetsConnection()
        snowflake_conn = SnowflakeConnection()
        
        if not sheets_conn.connect():
            print("❌ Failed to connect to Google Sheets")
            return
        
        if not snowflake_conn.connect():
            print("❌ Failed to connect to Snowflake")
            return
        
        print(f"📊 Reading data from sheet '{sheet_name}'...")
        
        # Read all data from sheet
        df = read_sheet_data(sheets_conn, sheet_name)
        
        if df is None or df.empty:
            print(f"⚠️  Sheet '{sheet_name}' is empty or could not be read")
            print(f"\n💡 Recommended row_limit for next job: {target_total}")
            return
        
        original_count = len(df)
        print(f"📋 Found {original_count:,} rows in sheet")
        
        # Find address column (case-insensitive)
        address_col = None
        for col in df.columns:
            if address_column.lower() in col.lower():
                address_col = col
                break
        
        if not address_col:
            print(f"⚠️  Could not find address column '{address_column}'. Available columns: {list(df.columns)}")
            print(f"\n💡 Recommended row_limit for next job: {target_total}")
            return
        
        print(f"📍 Using address column: '{address_col}'")
        
        # Query PERSON_CACHE for already-processed addresses
        print("🔍 Checking PERSON_CACHE for already-processed records...")
        cache_query = """
        SELECT DISTINCT UPPER(TRIM("address")) as cached_address
        FROM PROCESSED_DATA_DB.PUBLIC.PERSON_CACHE
        WHERE "address" IS NOT NULL AND "address" != ''
        """
        cache_result = snowflake_conn.execute_query(cache_query)
        
        cached_addresses = set()
        if cache_result is not None and not cache_result.empty:
            # Handle case-insensitive column name matching (Snowflake may return different case)
            cache_col = None
            for col in cache_result.columns:
                if col.lower() == 'cached_address':
                    cache_col = col
                    break
            
            if cache_col:
                cached_addresses = set(cache_result[cache_col].str.upper().str.strip().tolist())
                print(f"📊 Found {len(cached_addresses):,} unique addresses in PERSON_CACHE")
            else:
                # Fallback: use first column
                if len(cache_result.columns) > 0:
                    cached_addresses = set(cache_result.iloc[:, 0].astype(str).str.upper().str.strip().tolist())
                    print(f"📊 Found {len(cached_addresses):,} unique addresses in PERSON_CACHE (using fallback column)")
                else:
                    print("⚠️  Could not find cached_address column in PERSON_CACHE result")
        else:
            print("📊 PERSON_CACHE is empty or query returned no results")
        
        # Normalize addresses in sheet for comparison
        df['_normalized_address'] = df[address_col].astype(str).str.upper().str.strip()
        
        # Find records that are already in PERSON_CACHE
        already_processed_mask = df['_normalized_address'].isin(cached_addresses)
        already_processed_count = already_processed_mask.sum()
        
        if already_processed_count == 0:
            print("✅ No records in sheet are already in PERSON_CACHE")
            final_count = original_count
        else:
            print(f"⚠️  Found {already_processed_count:,} records in sheet that are already in PERSON_CACHE")
            
            # Show sample
            processed_rows = df[already_processed_mask]
            print("\n📝 Sample already-processed records (first 5):")
            for idx, row in processed_rows.head(5).iterrows():
                print(f"   Row {idx + 2}: {row.get('First Name', '')} {row.get('Last Name', '')} - {row[address_col]}")
            
            # Ask for confirmation
            response = input(f"\n❓ Remove {already_processed_count:,} already-processed records from sheet? (yes/no): ")
            if response.lower() not in ['yes', 'y']:
                print("❌ Cancelled. No rows removed.")
                final_count = original_count
            else:
                # Keep only records NOT in PERSON_CACHE
                df_cleaned = df[~already_processed_mask].copy()
                df_cleaned = df_cleaned.drop(columns=['_normalized_address'])
                
                print(f"🧹 Removing already-processed records...")
                
                # Clear sheet and write cleaned data
                clear_sheet(sheets_conn, sheet_name)
                sheets_conn.upload_dataframe(df_cleaned, sheet_name)
                
                final_count = len(df_cleaned)
                removed_count = original_count - final_count
                
                print(f"\n✅ Removal complete!")
                print(f"   Original rows: {original_count:,}")
                print(f"   Removed (already in PERSON_CACHE): {removed_count:,}")
                print(f"   Remaining rows (new/unprocessed): {final_count:,}")
        
        # Calculate recommended row_limit
        recommended_limit = max(0, target_total - final_count)
        
        print(f"\n" + "=" * 60)
        print(f"📊 NEXT JOB RECOMMENDATION")
        print(f"=" * 60)
        print(f"   Current NEW records in sheet: {final_count:,}")
        print(f"   Target total records: {target_total:,}")
        print(f"   Recommended row_limit: {recommended_limit:,}")
        print(f"\n💡 Use row_limit={recommended_limit:,} in your next ETL job")
        if recommended_limit > 0:
            print(f"   This will process {recommended_limit:,} NEW records")
            print(f"   Final total will be approximately {final_count + recommended_limit:,} records")
        else:
            print(f"   ⚠️  Sheet already has {final_count:,} records (>= {target_total:,})")
            print(f"   No new records needed, or increase target_total")
        print(f"=" * 60)
        
        # Close connections
        snowflake_conn.disconnect()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Remove records from Google Sheets that already exist in PERSON_CACHE')
    parser.add_argument('--sheet', type=str, required=True, help='Sheet name to clean')
    parser.add_argument('--address-column', type=str, default='Address', help='Address column name (default: Address)')
    parser.add_argument('--target-total', type=int, default=50000, help='Target total records after processing (default: 50000)')
    
    args = parser.parse_args()
    
    remove_processed_records_from_sheet(args.sheet, args.address_column, args.target_total)

