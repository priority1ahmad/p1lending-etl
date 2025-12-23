"""
Combined test script for both Litigator and DNC lists
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import test functions - handle both local and Docker paths
try:
    from scripts.test_litigator_list import test_litigator_list
    from scripts.test_dnc_list import test_dnc_list
except ImportError:
    # Fallback for different path structures
    from test_litigator_list import test_litigator_list
    from test_dnc_list import test_dnc_list


def test_both():
    """Test both litigator and DNC lists"""
    import os
    import sys

    print("\n" + "=" * 70)
    print("  COMPREHENSIVE LIST TESTING")
    print("=" * 70)
    print()
    print("Environment:")
    print(f"  Working directory: {os.getcwd()}")
    print(f"  Running in Docker: {os.path.exists('/app')}")
    print(f"  Python version: {sys.version.split()[0]}")
    print()
    print("Test phone numbers that will be used:")
    print("  - 313-782-5498")
    print("  - 313-647-8335")
    print("  - Plus additional format variations")
    print()

    # Test Litigator List
    print("\n" + "=" * 70)
    print("  PART 1: LITIGATOR LIST TEST")
    print("=" * 70)
    print()
    try:
        test_litigator_list()
    except Exception as e:
        print(f"❌ Error in litigator list test: {e}")
        import traceback

        traceback.print_exc()

    print("\n\n")

    # Test DNC List
    print("=" * 70)
    print("  PART 2: DNC LIST TEST")
    print("=" * 70)
    print()
    try:
        test_dnc_list()
    except Exception as e:
        print(f"❌ Error in DNC list test: {e}")
        import traceback

        traceback.print_exc()

    print("\n" + "=" * 70)
    print("  ALL TESTS COMPLETE")
    print("=" * 70)
    print()
    print("Summary:")
    print("  - Litigator list: Tested via CCC API")
    print("  - DNC list: Tested via SQLite database at /app/dnc_database.db")
    print()
    print("Note: If DNC database was not found, ensure it's set up:")
    print("  - Run: bash setup-dnc-database.sh")
    print("  - Or place at: /home/ubuntu/etl_app/dnc_database.db")
    print(
        "  - Then restart: docker compose -f docker-compose.prod.yml restart backend celery-worker"
    )
    print()


if __name__ == "__main__":
    test_both()
