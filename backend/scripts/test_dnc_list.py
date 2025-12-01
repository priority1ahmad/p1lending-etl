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
    
    # Initialize service
    try:
        dnc_checker = DNCCheckerDB()
        print(f"✅ DNC Checker initialized")
        print(f"   Database path: {os.path.abspath(dnc_checker.db_path)}")
        print(f"   Database exists: {os.path.exists(dnc_checker.db_path)}")
        print()
        
        if not os.path.exists(dnc_checker.db_path):
            print("⚠️  WARNING: DNC database not found!")
            print("   Please ensure the DNC database exists at one of these locations:")
            print("   - /app/data/dnc_database.db (Docker volume - recommended)")
            print("   - data/dnc_database.db")
            print("   - dnc_database.db")
            print("   - /home/ubuntu/etl_app/dnc_database.db (Production host)")
            print()
            print("   To fix this:")
            print("   1. Copy DNC database to: /home/ubuntu/etl_app/dnc_database.db")
            print("   2. Or mount it in docker-compose.prod.yml")
            print("   3. Or place it in the data directory that's mounted to /app/data")
            print()
            return
        
        # Verify database structure
        import sqlite3
        conn = sqlite3.connect(dnc_checker.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM dnc_list")
        total_records = cursor.fetchone()[0]
        conn.close()
        print(f"   Total records in DNC database: {total_records:,}")
        print()
        
    except Exception as e:
        print(f"❌ Failed to initialize DNC Checker: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Test phone numbers (you can modify these)
    test_phones = [
        "5551234567",      # Standard 10-digit
        "(555) 123-4567",  # Formatted
        "15551234567",     # With country code
        "555-123-4567",    # Dashed format
        "5551234568",      # Another test number
        "5551234569",      # Another test number
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

