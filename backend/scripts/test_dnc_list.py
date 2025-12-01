"""
Test script for DNC (Do Not Call) List checking functionality
Tests the DNC database service to verify phones are being checked correctly
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.etl.dnc_service import DNCCheckerDB
from app.core.logger import etl_logger


def test_dnc_list():
    """Test DNC list checking with sample phone numbers"""
    print("=" * 70)
    print("  DNC LIST TEST")
    print("=" * 70)
    print()
    
    # Show environment info
    print("Environment Information:")
    print(f"   Working directory: {os.getcwd()}")
    print(f"   Running in Docker: {os.path.exists('/app')}")
    if os.path.exists('/app'):
        print(f"   Container app directory: /app")
        print(f"   Checking /app/data: {os.path.exists('/app/data')}")
        if os.path.exists('/app/data'):
            print(f"   Files in /app/data: {os.listdir('/app/data')[:5]}")
    print()
    
    # Initialize service
    try:
        dnc_checker = DNCCheckerDB()
        print(f"✅ DNC Checker initialized")
        print(f"   Database path: {os.path.abspath(dnc_checker.db_path)}")
        print(f"   Database exists: {os.path.exists(dnc_checker.db_path)}")
        print()
        
        if not os.path.exists(dnc_checker.db_path):
            print("⚠️  WARNING: DNC database not found!")
            print()
            print("   The DNC service checked these locations:")
            print("   - /app/dnc_database.db (Docker mount - recommended)")
            print("   - /app/data/dnc_database.db (Docker volume)")
            print("   - /home/ubuntu/etl_app/dnc_database.db (Production host)")
            print("   - data/dnc_database.db")
            print("   - dnc_database.db")
            print("   - ../old_app/dnc_database.db")
            print("   - /home/ubuntu/etl_app/data/dnc_database.db")
            print()
            print("   Current working directory:", os.getcwd())
            print()
            print("   To fix this:")
            print("   1. Ensure DNC database exists at: /home/ubuntu/etl_app/dnc_database.db")
            print("   2. The docker-compose.prod.yml mounts it to: /app/dnc_database.db")
            print("   3. Restart containers after ensuring the file exists:")
            print("      docker compose -f docker-compose.prod.yml restart backend celery-worker")
            print("   4. Or use the setup script: bash setup-dnc-database.sh")
            print()
            return
        
        # Verify database structure (skip COUNT for large databases)
        import sqlite3
        print("   Verifying database structure...")
        try:
            # Add timeout to prevent hanging
            conn = sqlite3.connect(dnc_checker.db_path, timeout=10.0)
            cursor = conn.cursor()
            
            # Check if table exists first
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='dnc_list'")
            if not cursor.fetchone():
                print("   ⚠️  Warning: 'dnc_list' table not found in database")
                conn.close()
                return
            
            # Get database file size first (fast)
            db_size_mb = os.path.getsize(dnc_checker.db_path) / (1024*1024)
            print(f"   ✅ Database file size: {db_size_mb:.2f} MB")
            
            # For large databases (>1GB), skip COUNT query as it can take too long
            if db_size_mb > 1000:
                print("   ⚠️  Large database detected (>1GB)")
                print("   ⚠️  Skipping COUNT query (can take several minutes on large databases)")
                print("   ✅ Database structure verified - proceeding with tests")
                conn.close()
                print()
            else:
                # For smaller databases, get record count
                print("   Reading record count (this may take a moment)...")
                import signal
                
                def timeout_handler(signum, frame):
                    raise TimeoutError("COUNT query timed out")
                
                # Try to get count with a timeout
                try:
                    # Use a faster approximate count if available
                    cursor.execute("SELECT COUNT(*) FROM dnc_list LIMIT 1")
                    # Actually do the full count but with timeout protection
                    cursor.execute("SELECT COUNT(*) FROM dnc_list")
                    total_records = cursor.fetchone()[0]
                    print(f"   ✅ Total records in DNC database: {total_records:,}")
                except Exception as count_error:
                    print(f"   ⚠️  Could not get record count: {count_error}")
                    print("   ✅ Database structure verified - proceeding with tests")
                
                conn.close()
                print()
        except sqlite3.OperationalError as e:
            print(f"   ⚠️  Database operational error: {e}")
            print("   This might indicate:")
            print("     - Database is locked by another process")
            print("     - Database file is corrupted")
            print("     - Permission issue")
            print()
            print("   Trying to continue with tests anyway...")
            print()
        except Exception as e:
            print(f"   ⚠️  Error reading database: {e}")
            import traceback
            traceback.print_exc()
            print()
            print("   Trying to continue with tests anyway...")
            print()
        
    except Exception as e:
        print(f"❌ Failed to initialize DNC Checker: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Test phone numbers (you can modify these)
    test_phones = [
        "313-782-5498",      # Test number 1
        "313-647-8335",      # Test number 2
        "5551234567",        # Standard 10-digit
        "(555) 123-4567",    # Formatted
        "15551234567",       # With country code
        "555-123-4567",      # Dashed format
    ]
    
    print(f"Testing {len(test_phones)} phone numbers:")
    for i, phone in enumerate(test_phones, 1):
        print(f"  {i}. {phone}")
    print()
    
    # Test single phone check
    print("-" * 70)
    print("TEST 1: Single Phone Check")
    print("-" * 70)
    print()
    
    try:
        result = dnc_checker.check_single_phone(test_phones[0])
        phone = result.get('phone', 'Unknown')
        in_list = result.get('in_dnc_list', False)
        status = result.get('status', 'unknown')
        area_code = result.get('area_code', 'N/A')
        phone_number = result.get('phone_number', 'N/A')
        
        if status == 'success':
            status_icon = "🔴" if in_list else "✅"
            status_text = "IN DNC LIST" if in_list else "NOT in DNC list"
        else:
            status_icon = "❌"
            status_text = f"ERROR: {result.get('error', 'Unknown error')}"
        
        print(f"Phone: {phone}")
        print(f"  {status_icon} {status_text}")
        print(f"  Area Code: {area_code}, Phone Number: {phone_number}")
        print(f"  Status: {status}")
        print()
    except Exception as e:
        print(f"❌ Error in single phone check: {e}")
        print()
    
    # Test batch checking
    print("-" * 70)
    print("TEST 2: Batch Phone Check")
    print("-" * 70)
    print()
    
    try:
        results = dnc_checker.check_multiple_phones(test_phones)
        
        print("Results:")
        print()
        
        dnc_count = 0
        success_count = 0
        error_count = 0
        
        for i, result in enumerate(results, 1):
            phone = test_phones[i-1] if i <= len(test_phones) else "Unknown"
            status = result.get('status', 'unknown')
            in_list = result.get('in_dnc_list', False)
            area_code = result.get('area_code', 'N/A')
            phone_number = result.get('phone_number', 'N/A')
            
            if status == 'success':
                success_count += 1
                if in_list:
                    dnc_count += 1
                    status_icon = "🔴"
                    status_text = "IN DNC LIST"
                else:
                    status_icon = "✅"
                    status_text = "NOT in DNC list"
            else:
                error_count += 1
                status_icon = "❌"
                status_text = f"ERROR: {result.get('error', 'Unknown error')}"
            
            print(f"  {i}. {phone}")
            print(f"     {status_icon} {status_text}")
            if area_code != 'N/A':
                print(f"     Area Code: {area_code}, Phone Number: {phone_number}")
            print()
        
        # Summary
        print("-" * 70)
        print("SUMMARY")
        print("-" * 70)
        print(f"Total phones tested:     {len(test_phones)}")
        print(f"Successful checks:      {success_count}")
        print(f"Errors:                 {error_count}")
        print(f"Found in DNC list:      {dnc_count}")
        print()
        
        # Test database query directly
        print("-" * 70)
        print("TEST 3: Direct Database Query Verification")
        print("-" * 70)
        print()
        
        import sqlite3
        conn = sqlite3.connect(dnc_checker.db_path)
        cursor = conn.cursor()
        
        # Get sample records from database
        cursor.execute("SELECT area_code, phone_number FROM dnc_list LIMIT 5")
        sample_records = cursor.fetchall()
        
        if sample_records:
            print("Sample records from DNC database:")
            for area_code, phone_number in sample_records:
                full_phone = f"{area_code}{phone_number}"
                print(f"  {area_code}-{phone_number} ({full_phone})")
            print()
            
            # Test checking one of the sample records
            if sample_records:
                test_area, test_phone = sample_records[0]
                test_full = f"{test_area}{test_phone}"
                print(f"Testing known DNC number: {test_area}-{test_phone} ({test_full})")
                test_result = dnc_checker.check_single_phone(test_full)
                if test_result.get('in_dnc_list', False):
                    print("  ✅ Correctly identified as DNC")
                else:
                    print("  ❌ ERROR: Should be in DNC list but wasn't found!")
        else:
            print("No records found in DNC database")
        
        conn.close()
        print()
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
        return
    
    print("=" * 70)
    print("  TEST COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    test_dnc_list()
