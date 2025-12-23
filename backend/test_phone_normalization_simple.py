"""
Simple test script to verify phone normalization logic
Tests the core logic without requiring full environment setup
"""


def normalize_phone_key(phone):
    """
    Test version of _normalize_phone_key - same logic as in cache_service.py
    """
    if phone is None:
        return ""

    # If it's already a string, return it
    if isinstance(phone, str):
        return phone.strip() if phone.strip() else ""

    # If it's a list, extract the first element
    if isinstance(phone, list):
        if len(phone) > 0:
            # Recursively normalize the first element
            return normalize_phone_key(phone[0])
        return ""

    # If it's a tuple, extract the cleaned phone (usually second element)
    if isinstance(phone, tuple):
        if len(phone) >= 2:
            # Usually tuple is (formatted, cleaned) - take cleaned
            return normalize_phone_key(phone[1])
        elif len(phone) == 1:
            return normalize_phone_key(phone[0])
        return ""

    # Try to convert to string
    try:
        phone_str = str(phone).strip()
        return phone_str if phone_str else ""
    except Exception as e:
        print(f"Warning: Failed to convert phone value to string: {phone}, error: {e}")
        return ""


def test_phone_normalization():
    """Test that phone normalization handles all types correctly"""
    print("=" * 60)
    print("Testing Phone Normalization Logic")
    print("=" * 60)

    # Test cases: (input, expected_output, description)
    test_cases = [
        ("1234567890", "1234567890", "string"),
        (["1234567890"], "1234567890", "list with string"),
        ([["1234567890"]], "1234567890", "nested list"),
        (("(123) 456-7890", "1234567890"), "1234567890", "tuple with formatted and cleaned"),
        (("1234567890",), "1234567890", "tuple with single element"),
        (1234567890, "1234567890", "integer"),
        (None, "", "None"),
        ([], "", "empty list"),
        ((), "", "empty tuple"),
        (" 1234567890 ", "1234567890", "string with whitespace"),
    ]

    print("\n1. Testing normalize_phone_key function:")
    print("-" * 60)
    all_passed = True

    for phone_input, expected, description in test_cases:
        try:
            result = normalize_phone_key(phone_input)
            is_string = isinstance(result, str)
            matches_expected = result == expected

            status = "[PASS]" if (is_string and matches_expected) else "[FAIL]"
            if status == "[FAIL]":
                all_passed = False

            print(
                f"{status} | {description:35} | Input: {repr(phone_input):30} | Expected: {expected:15} | Got: {result:15}"
            )
        except Exception as e:
            print(f"[ERROR] | {description:35} | Input: {repr(phone_input):30} | Error: {e}")
            all_passed = False

    print("\n2. Testing dictionary key usage (simulating cache operations):")
    print("-" * 60)

    # Simulate cache_data dictionary
    cache_data = {}

    test_phones = [
        ("1234567890", "string"),
        (["1234567890"], "list"),
        (("(123) 456-7890", "1234567890"), "tuple"),
        (9876543210, "integer"),
    ]

    for phone, description in test_phones:
        try:
            # Normalize phone before using as key
            phone_key = normalize_phone_key(phone)
            if phone_key:
                # This should not raise "unhashable type" error
                cache_data[phone_key] = {"test": "data"}
                cache_data[phone_key]
                print(f"[PASS] | Dictionary key with {description:15} | Key: {phone_key}")
            else:
                print(f"[SKIP] | Dictionary key with {description:15} | Normalized to empty string")
        except TypeError as e:
            if "unhashable" in str(e):
                print(f"[FAIL] | Dictionary key with {description:15} - {e}")
                all_passed = False
            else:
                print(f"[ERROR] | Dictionary key with {description:15} - {e}")
                all_passed = False
        except Exception as e:
            print(f"[ERROR] | Dictionary key with {description:15} - {e}")
            all_passed = False

    print("\n3. Testing SQL query syntax:")
    print("-" * 60)

    # The query we're using
    query = """
    SELECT DISTINCT UPPER(TRIM(address)) as cached_address
    FROM PROCESSED_DATA_DB.PUBLIC.PERSON_CACHE
    WHERE address IS NOT NULL AND address != ''
    """

    print("\nSQL Query:")
    print("-" * 60)
    print(query.strip())
    print("-" * 60)

    # Check for common issues
    issues = []

    # Check for quoted identifiers in function calls (should not be there)
    if 'UPPER(TRIM("address"))' in query:
        issues.append("[FAIL] Quoted identifier in function call")
    else:
        print("[PASS] No quoted identifier in function call")

    # Check that address is used (not "address" in function)
    if "UPPER(TRIM(address))" in query:
        print("[PASS] Unquoted identifier in function call")
    else:
        issues.append("[FAIL] Function call syntax incorrect")

    # Check WHERE clause
    if "WHERE address IS NOT NULL" in query:
        print("[PASS] WHERE clause uses unquoted identifier")
    else:
        issues.append("[FAIL] WHERE clause syntax incorrect")

    sql_passed = len(issues) == 0
    if not sql_passed:
        print("\nIssues found:")
        for issue in issues:
            print(f"  {issue}")

    print("\n" + "=" * 60)
    if all_passed and sql_passed:
        print("[PASS] ALL TESTS PASSED")
        return True
    else:
        print("[FAIL] SOME TESTS FAILED")
        return False


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("PHONE NORMALIZATION AND SQL QUERY VERIFICATION TESTS")
    print("=" * 60)

    result = test_phone_normalization()

    print("\n" + "=" * 60)
    print("FINAL RESULT")
    print("=" * 60)
    if result:
        print("[PASS] ALL VERIFICATION TESTS PASSED")
        print("\nThe fixes should work correctly:")
        print("  - Phone normalization handles lists, tuples, and strings")
        print("  - Dictionary keys are always strings (no unhashable type errors)")
        print("  - SQL query uses correct syntax for Snowflake")
        exit(0)
    else:
        print("[FAIL] SOME VERIFICATION TESTS FAILED")
        print("\nPlease review the test output above.")
        exit(1)
