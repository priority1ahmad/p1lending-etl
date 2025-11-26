"""
Test to verify phone normalization NEVER returns a list or unhashable type.
Run this test manually to verify the fix works before running ETL jobs.

Usage:
    cd backend
    python test_phone_key_safety.py
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_ensure_string_key():
    """Test that _ensure_string_key NEVER returns a list or unhashable type"""
    
    # All the problematic inputs we need to handle
    test_cases = [
        # (Input, Description)
        ("1234567890", "Plain string"),
        (["1234567890"], "Single-element list"),
        ([["1234567890"]], "Nested single-element list"),
        (("formatted", "cleaned"), "Tuple with 2 elements - should return 'cleaned'"),
        (["formatted", "cleaned"], "List with 2 elements (JSON cache format) - should return 'cleaned'"),
        ([("formatted", "cleaned")], "List containing tuple"),
        ([["formatted", "cleaned"]], "Nested list with 2 elements"),
        (None, "None value"),
        ("", "Empty string"),
        ([], "Empty list"),
        ((), "Empty tuple"),
        ([""], "List with empty string"),
        (("",), "Tuple with empty string"),
        (123, "Integer"),
        ([123, 456], "List of integers"),
    ]
    
    print("=" * 60)
    print("Testing Phone Key Safety")
    print("=" * 60)
    
    # Test ETLEngine._ensure_string_key
    print("\n1. Testing ETLEngine._ensure_string_key:")
    print("-" * 40)
    
    try:
        from app.services.etl.engine import ETLEngine
        engine = ETLEngine.__new__(ETLEngine)  # Create without __init__ to avoid DB connections
        
        # Create a mock logger
        class MockLogger:
            def debug(self, msg): pass
            def warning(self, msg): print(f"  WARNING: {msg}")
            def error(self, msg): print(f"  ERROR: {msg}")
        
        class MockJobLogger:
            logger = MockLogger()
        
        engine.logger = MockJobLogger()
        
        all_passed = True
        for test_input, description in test_cases:
            try:
                result = engine._ensure_string_key(test_input)
                
                # Check if result is valid (string or None)
                is_valid = result is None or isinstance(result, str)
                is_hashable = True
                try:
                    hash(result) if result is not None else None
                except TypeError:
                    is_hashable = False
                
                status = "[OK]" if (is_valid and is_hashable) else "[FAIL]"
                result_display = repr(result)[:50] if result else repr(result)
                print(f"  {status} {description}")
                print(f"      Input: {repr(test_input)[:40]}")
                print(f"      Result: {result_display} (type: {type(result).__name__})")
                
                if not is_valid:
                    print(f"      ERROR: Expected string or None, got {type(result).__name__}")
                    all_passed = False
                if not is_hashable:
                    print(f"      ERROR: Result is not hashable!")
                    all_passed = False
            except Exception as e:
                print(f"  [EXCEPTION] for {description}: {e}")
                all_passed = False
        
        print(f"\n  ETLEngine tests: {'PASSED' if all_passed else 'FAILED'}")
        
    except ImportError as e:
        print(f"  Could not import ETLEngine: {e}")
        all_passed = False
    
    # Test CCCAPIService._safe_string_key
    print("\n2. Testing CCCAPIService._safe_string_key:")
    print("-" * 40)
    
    try:
        from app.services.etl.ccc_service import CCCAPIService
        
        # Create mock service without full initialization
        ccc = CCCAPIService.__new__(CCCAPIService)
        
        class MockCCCLogger:
            def debug(self, msg): pass
            def info(self, msg): pass
            def warning(self, msg): print(f"  WARNING: {msg}")
            def error(self, msg): print(f"  ERROR: {msg}")
        
        ccc.logger = MockCCCLogger()
        
        ccc_passed = True
        for test_input, description in test_cases:
            try:
                result = ccc._safe_string_key(test_input)
                
                # Check if result is valid (string or None)
                is_valid = result is None or isinstance(result, str)
                is_hashable = True
                try:
                    hash(result) if result is not None else None
                except TypeError:
                    is_hashable = False
                
                status = "[OK]" if (is_valid and is_hashable) else "[FAIL]"
                result_display = repr(result)[:50] if result else repr(result)
                print(f"  {status} {description}")
                print(f"      Input: {repr(test_input)[:40]}")
                print(f"      Result: {result_display} (type: {type(result).__name__})")
                
                if not is_valid:
                    print(f"      ERROR: Expected string or None, got {type(result).__name__}")
                    ccc_passed = False
                if not is_hashable:
                    print(f"      ERROR: Result is not hashable!")
                    ccc_passed = False
            except Exception as e:
                print(f"  [EXCEPTION] for {description}: {e}")
                ccc_passed = False
        
        print(f"\n  CCCAPIService tests: {'PASSED' if ccc_passed else 'FAILED'}")
        all_passed = all_passed and ccc_passed
        
    except ImportError as e:
        print(f"  Could not import CCCAPIService: {e}")
    
    # Test PhoneCache._normalize_phone_key
    print("\n3. Testing PhoneCache._normalize_phone_key:")
    print("-" * 40)
    
    try:
        from app.services.etl.cache_service import PhoneCache
        
        # Create mock cache without full initialization
        cache = PhoneCache.__new__(PhoneCache)
        
        class MockCacheLogger:
            def debug(self, msg): pass
            def info(self, msg): pass
            def warning(self, msg): print(f"  WARNING: {msg}")
            def error(self, msg): print(f"  ERROR: {msg}")
        
        cache.logger = MockCacheLogger()
        
        cache_passed = True
        for test_input, description in test_cases:
            try:
                result = cache._normalize_phone_key(test_input)
                
                # Check if result is valid (string - this one returns "" instead of None)
                is_valid = isinstance(result, str)
                is_hashable = True
                try:
                    hash(result)
                except TypeError:
                    is_hashable = False
                
                status = "[OK]" if (is_valid and is_hashable) else "[FAIL]"
                result_display = repr(result)[:50] if result else repr(result)
                print(f"  {status} {description}")
                print(f"      Input: {repr(test_input)[:40]}")
                print(f"      Result: {result_display} (type: {type(result).__name__})")
                
                if not is_valid:
                    print(f"      ERROR: Expected string, got {type(result).__name__}")
                    cache_passed = False
                if not is_hashable:
                    print(f"      ERROR: Result is not hashable!")
                    cache_passed = False
            except Exception as e:
                print(f"  [EXCEPTION] for {description}: {e}")
                cache_passed = False
        
        print(f"\n  PhoneCache tests: {'PASSED' if cache_passed else 'FAILED'}")
        all_passed = all_passed and cache_passed
        
    except ImportError as e:
        print(f"  Could not import PhoneCache: {e}")
    
    # Critical test: verify list is NEVER a result
    print("\n4. CRITICAL TEST - List/Tuple must NEVER be returned:")
    print("-" * 40)
    
    dangerous_inputs = [
        ["phone1", "phone2"],
        [["nested", "list"]],
        [[["deeply", "nested"]]],
        [("tuple", "in", "list")],
    ]
    
    critical_passed = True
    try:
        for test_input in dangerous_inputs:
            # Test all three functions
            for name, func in [
                ("ETLEngine._ensure_string_key", engine._ensure_string_key),
                ("CCCAPIService._safe_string_key", ccc._safe_string_key),
                ("PhoneCache._normalize_phone_key", cache._normalize_phone_key),
            ]:
                result = func(test_input)
                if isinstance(result, (list, tuple)):
                    print(f"  [CRITICAL FAILURE]: {name}")
                    print(f"      Input: {test_input}")
                    print(f"      Returned: {result} (type: {type(result).__name__})")
                    critical_passed = False
                else:
                    print(f"  [OK] {name}: {str(test_input)[:30]} -> {repr(result)}")
    except Exception as e:
        print(f"  [EXCEPTION] during critical tests: {e}")
        critical_passed = False
    
    print(f"\n  Critical tests: {'PASSED' if critical_passed else 'FAILED'}")
    all_passed = all_passed and critical_passed
    
    # Summary
    print("\n" + "=" * 60)
    if all_passed:
        print("[OK] ALL TESTS PASSED! The fix should work.")
        print("  You can now run ETL jobs without the 'unhashable type: list' error.")
    else:
        print("[FAIL] SOME TESTS FAILED! The fix needs more work.")
        print("  Do NOT run ETL jobs until tests pass.")
    print("=" * 60)
    
    return all_passed


if __name__ == "__main__":
    success = test_ensure_string_key()
    sys.exit(0 if success else 1)

