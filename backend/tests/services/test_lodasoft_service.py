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
