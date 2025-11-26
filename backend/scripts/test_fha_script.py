"""
Test script to run FHA SQL script with row limit of 10
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.etl.engine import ETLEngine


def test_fha_script():
    """Test FHA SQL script with row limit of 10"""
    print("=" * 60)
    print("Testing FHA SQL Script with Row Limit of 10")
    print("=" * 60)
    
    # Read FHA.sql file
    sql_file = Path(__file__).parent.parent / "sql" / "FHA.sql"
    
    if not sql_file.exists():
        print(f"ERROR: FHA.sql file not found at {sql_file}")
        return False
    
    with open(sql_file, 'r', encoding='utf-8') as f:
        script_content = f.read()
    
    print(f"\n[OK] Loaded FHA.sql script ({len(script_content)} characters)")
    
    # Initialize ETL engine
    print("\n[INFO] Initializing ETL Engine...")
    engine = ETLEngine()
    
    # Execute script with row limit of 10
    print("\n[INFO] Executing FHA script with row_limit=10...")
    print("-" * 60)
    
    try:
        result = engine.execute_single_script(
            script_content=script_content,
            script_name="FHA",
            limit_rows=10
        )
        
        print("\n" + "=" * 60)
        print("TEST RESULTS")
        print("=" * 60)
        
        if result.get('success'):
            rows_processed = result.get('rows_processed', 0)
            print(f"\n[SUCCESS] Script executed successfully!")
            print(f"[INFO] Rows processed: {rows_processed}")
            
            if rows_processed == 10:
                print(f"\n[PASS] SUCCESS: Script returned exactly 10 rows as expected!")
                return True
            elif rows_processed > 0:
                print(f"\n[WARNING] Script returned {rows_processed} rows instead of 10.")
                print("   This might be because some records were already processed.")
                print("   The script filters out already-processed records before applying the limit.")
                return False
            else:
                print(f"\n[FAIL] ERROR: Script returned 0 rows!")
                if result.get('error_message'):
                    print(f"   Error: {result.get('error_message')}")
                return False
        else:
            error_msg = result.get('error_message', 'Unknown error')
            print(f"\n[FAIL] Script execution failed!")
            print(f"   Error: {error_msg}")
            return False
            
    except Exception as e:
        print(f"\n[ERROR] Exception occurred: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = test_fha_script()
    sys.exit(0 if success else 1)

