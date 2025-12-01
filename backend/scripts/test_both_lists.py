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
    
    print("\n" + "=" * 70)
    print("  COMPREHENSIVE LIST TESTING")
    print("=" * 70)
    print()
    print("Environment:")
    print(f"  Working directory: {os.getcwd()}")
    print(f"  Running in Docker: {os.path.exists('/app')}")
    print()
    
    # Test Litigator List
    print("\n" + "=" * 70)
    print("  PART 1: LITIGATOR LIST TEST")
    print("=" * 70)
    test_litigator_list()
    
    print("\n\n")
    
    # Test DNC List
    print("=" * 70)
    print("  PART 2: DNC LIST TEST")
    print("=" * 70)
    test_dnc_list()
    
    print("\n" + "=" * 70)
    print("  ALL TESTS COMPLETE")
    print("=" * 70)
    print()
    print("Note: If DNC database was not found, ensure it's set up:")
    print("  - Run: bash setup-dnc-database.sh")
    print("  - Or place at: /home/ubuntu/etl_app/dnc_database.db")
    print("  - Then restart: docker compose -f docker-compose.prod.yml restart backend celery-worker")
    print()


if __name__ == "__main__":
    test_both()

