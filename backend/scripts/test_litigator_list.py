"""
Test script for Litigator List checking functionality
Tests the CCC API service to verify phones are being checked correctly
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.etl.ccc_service import CCCAPIService


def test_litigator_list():
    """Test litigator list checking with sample phone numbers"""
    print("=" * 70)
    print("  LITIGATOR LIST TEST")
    print("=" * 70)
    print()

    # Initialize service
    try:
        ccc_service = CCCAPIService()
        print("✅ CCC API Service initialized")
        print(f"   API URL: {ccc_service.base_url}")
        print(f"   Batch Size: {ccc_service.batch_size}")
        print()
    except Exception as e:
        print(f"❌ Failed to initialize CCC API Service: {e}")
        return

    # Test phone numbers (you can modify these)
    test_phones = [
        "313-782-5498",  # Test number 1
        "313-647-8335",  # Test number 2
        "5551234567",  # Standard 10-digit
        "(555) 123-4567",  # Formatted
        "15551234567",  # With country code
        "555-123-4567",  # Dashed format
    ]

    print(f"Testing {len(test_phones)} phone numbers:")
    for i, phone in enumerate(test_phones, 1):
        print(f"  {i}. {phone}")
    print()

    # Test single phone check (if method exists)
    print("-" * 70)
    print("TEST 1: Single Phone Check (if available)")
    print("-" * 70)
    # Note: The service uses batch checking, so we'll test with batches

    # Test batch checking
    print()
    print("-" * 70)
    print("TEST 2: Batch Phone Check (Threaded)")
    print("-" * 70)
    print()

    try:
        results = ccc_service.check_multiple_phones_threaded(test_phones, max_workers=4)

        print("Results:")
        print()

        litigator_count = 0
        success_count = 0
        error_count = 0
        cached_count = 0

        for i, result in enumerate(results, 1):
            phone = test_phones[i - 1] if i <= len(test_phones) else "Unknown"
            status = result.get("status", "unknown")
            in_list = result.get("in_litigator_list", False)
            cached = result.get("cached", False)
            confidence = result.get("confidence", 0)

            if cached:
                cached_count += 1
                cache_indicator = " [CACHED]"
            else:
                cache_indicator = ""

            if status == "success":
                success_count += 1
                if in_list:
                    litigator_count += 1
                    status_icon = "🔴"
                    status_text = "IN LITIGATOR LIST"
                else:
                    status_icon = "✅"
                    status_text = "NOT in list"
            else:
                error_count += 1
                status_icon = "❌"
                status_text = f"ERROR: {result.get('error', 'Unknown error')}"

            print(f"  {i}. {phone}")
            print(f"     {status_icon} {status_text} (Confidence: {confidence}%){cache_indicator}")
            if "cleaned_phone" in result and result["cleaned_phone"] != phone:
                print(f"     Cleaned: {result['cleaned_phone']}")
            print()

        # Summary
        print("-" * 70)
        print("SUMMARY")
        print("-" * 70)
        print(f"Total phones tested:     {len(test_phones)}")
        print(f"Successful checks:        {success_count}")
        print(f"Errors:                   {error_count}")
        print(f"Found in litigator list:  {litigator_count}")
        print(f"Cached results:          {cached_count}")
        print(f"Cache hit rate:          {(cached_count/len(test_phones)*100):.1f}%")
        print()

        # Test cache functionality
        print("-" * 70)
        print("TEST 3: Cache Verification (Re-check same phones)")
        print("-" * 70)
        print()
        print("Re-checking the same phones to verify caching...")
        print()

        cached_results = ccc_service.check_multiple_phones_threaded(test_phones[:3], max_workers=2)
        cached_hits = sum(1 for r in cached_results if r and r.get("cached", False))
        print(f"Cache hits on re-check: {cached_hits}/{len(test_phones[:3])}")
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
    test_litigator_list()
