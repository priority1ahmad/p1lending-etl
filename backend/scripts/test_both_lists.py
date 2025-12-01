"""
Combined test script for both Litigator and DNC lists
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.test_litigator_list import test_litigator_list
from scripts.test_dnc_list import test_dnc_list


def test_both():
    """Test both litigator and DNC lists"""
    print("\n" + "=" * 70)
    print("  COMPREHENSIVE LIST TESTING")
    print("=" * 70)
    print()
    
    # Test Litigator List
    test_litigator_list()
    
    print("\n\n")
    
    # Test DNC List
    test_dnc_list()
    
    print("\n" + "=" * 70)
    print("  ALL TESTS COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    test_both()

