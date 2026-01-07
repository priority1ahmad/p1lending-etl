"""Tests for Lodasoft CRM Integration Service"""

import os

# Set required env vars before any imports that trigger config loading
os.environ.setdefault("SNOWFLAKE_ACCOUNT", "test")
os.environ.setdefault("SNOWFLAKE_USER", "test")
os.environ.setdefault("SNOWFLAKE_PRIVATE_KEY_PASSWORD", "test")
os.environ.setdefault("SECRET_KEY", "test")
os.environ.setdefault("CCC_API_KEY", "test")
os.environ.setdefault("IDICORE_CLIENT_ID", "test")
os.environ.setdefault("IDICORE_CLIENT_SECRET", "test")


class TestLodasoftServiceInstantiation:
    """Tests for service instantiation"""

    def test_service_can_be_instantiated(self):
        """Test that LodasoftCRMService can be created"""
        from app.services.lodasoft_service import LodasoftCRMService

        service = LodasoftCRMService()

        assert service is not None


class TestLodasoftServiceProperCase:
    """Tests for PROPER case formatting"""

    def test_proper_case_converts_uppercase_to_title_case(self):
        """Test converting uppercase string to proper case"""
        from app.services.lodasoft_service import LodasoftCRMService

        service = LodasoftCRMService()

        result = service._proper_case("JOHN DOE")

        assert result == "John Doe"

    def test_proper_case_converts_lowercase_to_title_case(self):
        """Test converting lowercase string to proper case"""
        from app.services.lodasoft_service import LodasoftCRMService

        service = LodasoftCRMService()

        result = service._proper_case("mary jane")

        assert result == "Mary Jane"


class TestLodasoftServiceColumnMapping:
    """Tests for snake_case to Title Case column mapping."""

    def test_format_record_converts_snake_case_to_title_case(self):
        """Test that snake_case column names from Snowflake are converted to Title Case."""
        from app.services.lodasoft_service import LodasoftCRMService

        service = LodasoftCRMService()

        # Snowflake returns snake_case column names
        snowflake_record = {
            "first_name": "john",
            "last_name": "doe",
        }

        formatted = service._format_record_for_lodasoft(snowflake_record)

        # Should have Title Case keys and proper cased values
        assert "First Name" in formatted
        assert "Last Name" in formatted
        assert formatted["First Name"] == "John"
        assert formatted["Last Name"] == "Doe"


class TestLodasoftServiceNumericCleaning:
    """Tests for cleaning numeric values with decimal suffixes.

    LodaSoft API requires Int32 for fields like Total Units, but Snowflake
    often returns string values like "1.0" which fail API validation with:
    "The input string '1.0' was not in a correct format. Expected type is Int32."
    """

    def test_format_record_strips_decimal_suffix_from_total_units(self):
        """Test that '1.0' becomes 1 (integer) for Total Units field."""
        from app.services.lodasoft_service import LodasoftCRMService

        service = LodasoftCRMService()

        record = {"total_units": "1.0"}

        formatted = service._format_record_for_lodasoft(record)

        # LodaSoft API expects Int32, not "1.0" string
        assert formatted["Total Units"] == 1

    def test_format_record_strips_decimal_suffix_from_phone_numbers(self):
        """Test that phone numbers like '4103793040.0' become '4103793040'."""
        from app.services.lodasoft_service import LodasoftCRMService

        service = LodasoftCRMService()

        record = {
            "phone_1": "8043068325",
            "phone_2": "4103793040.0",
            "phone_3": "8047989403.0",
        }

        formatted = service._format_record_for_lodasoft(record)

        # Phone numbers should be clean strings without .0
        assert formatted["Phone 1"] == "8043068325"
        assert formatted["Phone 2"] == "4103793040"
        assert formatted["Phone 3"] == "8047989403"

    def test_format_record_uses_zip_when_zip_code_is_null(self):
        """Test that 'zip' column is used when 'zip_code' is null.

        Snowflake data often has zip_code=null but zip='30228.0'.
        We should use the zip value and clean it.
        """
        from app.services.lodasoft_service import LodasoftCRMService

        service = LodasoftCRMService()

        # This is what Snowflake actually returns
        record = {
            "zip_code": None,
            "zip": "30228.0",
        }

        formatted = service._format_record_for_lodasoft(record)

        # Should use zip value (cleaned) since zip_code is null
        assert formatted["Zip"] == "30228"

    def test_format_record_cleans_other_integer_fields(self):
        """Test that other numeric fields like assessed_value are cleaned."""
        from app.services.lodasoft_service import LodasoftCRMService

        service = LodasoftCRMService()

        record = {
            "annual_tax_amount": "8883.0",
            "assessed_value": "222560.0",
            "first_mortgage_balance": "507278.0",
            "term": "348",
        }

        formatted = service._format_record_for_lodasoft(record)

        # These should be integers, not strings with .0
        assert formatted["Annual Tax Amount"] == 8883
        assert formatted["Assessed Value"] == 222560
        assert formatted["First Mortgage Balance"] == 507278
        assert formatted["Term"] == 348

    def test_format_record_proper_cases_all_string_fields(self):
        """Test that all string fields are properly cased (Title Case).

        LodaSoft expects proper casing for display. Fields like city, address,
        lender names should be Title Case even if source data is ALL CAPS or lowercase.
        """
        from app.services.lodasoft_service import LodasoftCRMService

        service = LodasoftCRMService()

        record = {
            "first_name": "JOHN",
            "last_name": "doe",
            "address": "123 MAIN STREET",
            "city": "NEW YORK",
            "current_lender": "ROCKET MORTGAGE LLC",
            "lead_source": "DATA LEAD",
            "loan_type": "va",
        }

        formatted = service._format_record_for_lodasoft(record)

        # All string fields should be properly cased
        assert formatted["First Name"] == "John"
        assert formatted["Last Name"] == "Doe"
        assert formatted["Address"] == "123 Main Street"
        assert formatted["City"] == "New York"
        assert formatted["Current Lender"] == "Rocket Mortgage Llc"
        assert formatted["Lead Source"] == "Data Lead"
        assert formatted["Loan Type"] == "Va"
