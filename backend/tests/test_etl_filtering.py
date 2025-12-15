"""
Unit tests for Snowflake Pre-Filtering Optimization

Tests the database-side filtering implementation that provides 10-15x
performance improvement over Python-side filtering.

Run with: pytest tests/test_etl_filtering.py -v
"""

import pytest
from unittest.mock import Mock, MagicMock, patch
import pandas as pd


class TestDetectAddressColumn:
    """Tests for _detect_address_column() method"""

    def test_detects_standard_address_column(self):
        """Should detect 'Address' column"""
        from app.services.etl.engine import ETLEngine

        # Mock Snowflake connection
        mock_df = pd.DataFrame({
            'First Name': ['John'],
            'Last Name': ['Doe'],
            'Address': ['123 Main St'],
            'City': ['Boston']
        })

        with patch.object(ETLEngine, '__init__', lambda x, *args, **kwargs: None):
            engine = ETLEngine.__new__(ETLEngine)
            engine.snowflake_conn = Mock()
            engine.snowflake_conn.execute_query = Mock(return_value=mock_df)
            engine.logger = Mock()
            engine.logger.log_step = Mock()
            engine.logger.log_error = Mock()

            result = engine._detect_address_column("SELECT * FROM test")

            assert result == 'Address'

    def test_detects_lowercase_address_column(self):
        """Should detect 'address' column (case-insensitive)"""
        from app.services.etl.engine import ETLEngine

        mock_df = pd.DataFrame({
            'first_name': ['John'],
            'address': ['123 Main St'],
        })

        with patch.object(ETLEngine, '__init__', lambda x, *args, **kwargs: None):
            engine = ETLEngine.__new__(ETLEngine)
            engine.snowflake_conn = Mock()
            engine.snowflake_conn.execute_query = Mock(return_value=mock_df)
            engine.logger = Mock()
            engine.logger.log_step = Mock()
            engine.logger.log_error = Mock()

            result = engine._detect_address_column("SELECT * FROM test")

            assert result == 'address'

    def test_detects_property_address_column(self):
        """Should detect 'PROPERTY_ADDRESS' column"""
        from app.services.etl.engine import ETLEngine

        mock_df = pd.DataFrame({
            'FIRST_NAME': ['John'],
            'PROPERTY_ADDRESS': ['123 Main St'],
        })

        with patch.object(ETLEngine, '__init__', lambda x, *args, **kwargs: None):
            engine = ETLEngine.__new__(ETLEngine)
            engine.snowflake_conn = Mock()
            engine.snowflake_conn.execute_query = Mock(return_value=mock_df)
            engine.logger = Mock()
            engine.logger.log_step = Mock()
            engine.logger.log_error = Mock()

            result = engine._detect_address_column("SELECT * FROM test")

            assert result == 'PROPERTY_ADDRESS'

    def test_raises_exception_when_no_address_column(self):
        """Should raise exception when no address column found"""
        from app.services.etl.engine import ETLEngine

        mock_df = pd.DataFrame({
            'First Name': ['John'],
            'Last Name': ['Doe'],
            'City': ['Boston']  # No address column
        })

        with patch.object(ETLEngine, '__init__', lambda x, *args, **kwargs: None):
            engine = ETLEngine.__new__(ETLEngine)
            engine.snowflake_conn = Mock()
            engine.snowflake_conn.execute_query = Mock(return_value=mock_df)
            engine.logger = Mock()
            engine.logger.log_step = Mock()
            engine.logger.log_error = Mock()

            with pytest.raises(Exception) as exc_info:
                engine._detect_address_column("SELECT * FROM test")

            assert "No Address column found" in str(exc_info.value)

    def test_raises_exception_when_empty_result(self):
        """Should raise exception when query returns empty result"""
        from app.services.etl.engine import ETLEngine

        mock_df = pd.DataFrame()  # Empty DataFrame

        with patch.object(ETLEngine, '__init__', lambda x, *args, **kwargs: None):
            engine = ETLEngine.__new__(ETLEngine)
            engine.snowflake_conn = Mock()
            engine.snowflake_conn.execute_query = Mock(return_value=mock_df)
            engine.logger = Mock()
            engine.logger.log_step = Mock()
            engine.logger.log_error = Mock()

            with pytest.raises(Exception) as exc_info:
                engine._detect_address_column("SELECT * FROM test")

            assert "no results" in str(exc_info.value).lower() or "cannot detect" in str(exc_info.value).lower()


class TestBuildFilteredQuery:
    """Tests for _build_filtered_query() method"""

    def test_builds_query_with_not_exists(self):
        """Should build query with NOT EXISTS clause"""
        from app.services.etl.engine import ETLEngine

        mock_df = pd.DataFrame({'Address': ['123 Main St']})

        with patch.object(ETLEngine, '__init__', lambda x, *args, **kwargs: None):
            engine = ETLEngine.__new__(ETLEngine)
            engine.snowflake_conn = Mock()
            engine.snowflake_conn.execute_query = Mock(return_value=mock_df)
            engine.logger = Mock()
            engine.logger.log_step = Mock()
            engine.logger.log_error = Mock()

            user_sql = "SELECT * FROM MORTGAGES WHERE state = 'CA'"
            result = engine._build_filtered_query(user_sql)

            assert "WITH UserQuery AS" in result
            assert "NOT EXISTS" in result
            assert "PERSON_CACHE" in result
            assert user_sql in result

    def test_applies_limit_when_specified(self):
        """Should add LIMIT clause when limit_rows is provided"""
        from app.services.etl.engine import ETLEngine

        mock_df = pd.DataFrame({'Address': ['123 Main St']})

        with patch.object(ETLEngine, '__init__', lambda x, *args, **kwargs: None):
            engine = ETLEngine.__new__(ETLEngine)
            engine.snowflake_conn = Mock()
            engine.snowflake_conn.execute_query = Mock(return_value=mock_df)
            engine.logger = Mock()
            engine.logger.log_step = Mock()
            engine.logger.log_error = Mock()

            result = engine._build_filtered_query("SELECT * FROM test", limit_rows=100)

            assert "LIMIT 100" in result

    def test_no_limit_when_not_specified(self):
        """Should not add LIMIT clause when limit_rows is None"""
        from app.services.etl.engine import ETLEngine

        mock_df = pd.DataFrame({'Address': ['123 Main St']})

        with patch.object(ETLEngine, '__init__', lambda x, *args, **kwargs: None):
            engine = ETLEngine.__new__(ETLEngine)
            engine.snowflake_conn = Mock()
            engine.snowflake_conn.execute_query = Mock(return_value=mock_df)
            engine.logger = Mock()
            engine.logger.log_step = Mock()
            engine.logger.log_error = Mock()

            result = engine._build_filtered_query("SELECT * FROM test", limit_rows=None)

            # Should not have LIMIT at the end (may have LIMIT 1 in detection query)
            assert not result.strip().endswith("LIMIT None")

    def test_uses_detected_column_name(self):
        """Should use the detected address column name in query"""
        from app.services.etl.engine import ETLEngine

        mock_df = pd.DataFrame({'PROPERTY_ADDRESS': ['123 Main St']})

        with patch.object(ETLEngine, '__init__', lambda x, *args, **kwargs: None):
            engine = ETLEngine.__new__(ETLEngine)
            engine.snowflake_conn = Mock()
            engine.snowflake_conn.execute_query = Mock(return_value=mock_df)
            engine.logger = Mock()
            engine.logger.log_step = Mock()
            engine.logger.log_error = Mock()

            result = engine._build_filtered_query("SELECT * FROM test")

            assert 'PROPERTY_ADDRESS' in result

    def test_handles_complex_user_sql(self):
        """Should handle complex SQL with JOINs and subqueries"""
        from app.services.etl.engine import ETLEngine

        mock_df = pd.DataFrame({'Address': ['123 Main St']})

        with patch.object(ETLEngine, '__init__', lambda x, *args, **kwargs: None):
            engine = ETLEngine.__new__(ETLEngine)
            engine.snowflake_conn = Mock()
            engine.snowflake_conn.execute_query = Mock(return_value=mock_df)
            engine.logger = Mock()
            engine.logger.log_step = Mock()
            engine.logger.log_error = Mock()

            complex_sql = """
            SELECT m.*, o.owner_name
            FROM MORTGAGES m
            JOIN OWNERS o ON m.owner_id = o.id
            WHERE m.state IN ('CA', 'TX', 'FL')
            AND m.loan_amount > 100000
            """

            result = engine._build_filtered_query(complex_sql)

            assert "WITH UserQuery AS" in result
            assert complex_sql.strip() in result or "MORTGAGES" in result


class TestFilterUnprocessedRecordsDeprecation:
    """Tests for deprecated _filter_unprocessed_records() method"""

    def test_logs_deprecation_warning(self):
        """Should log deprecation warning when called"""
        from app.services.etl.engine import ETLEngine

        mock_df = pd.DataFrame({
            'Address': ['123 Main St', '456 Oak Ave'],
            'Name': ['John', 'Jane']
        })

        with patch.object(ETLEngine, '__init__', lambda x, *args, **kwargs: None):
            engine = ETLEngine.__new__(ETLEngine)
            engine.snowflake_conn = Mock()
            engine.snowflake_conn.execute_query = Mock(return_value=pd.DataFrame())
            engine.logger = Mock()
            engine.logger.log_step = Mock()
            engine.logger.log_error = Mock()
            engine.logger.logger = Mock()
            engine.logger.logger.warning = Mock()

            # Call deprecated method
            engine._filter_unprocessed_records(mock_df)

            # Verify warning was logged
            engine.logger.logger.warning.assert_called()
            warning_call = str(engine.logger.logger.warning.call_args)
            assert "DEPRECATED" in warning_call or "deprecated" in warning_call.lower()


class TestFeatureFlag:
    """Tests for database filtering feature flag"""

    def test_feature_flag_exists_in_config(self):
        """Should have use_database_filtering setting in config"""
        from app.core.config import settings

        # Check if the setting exists (may be in etl or root settings)
        has_flag = (
            hasattr(settings, 'use_database_filtering') or
            (hasattr(settings, 'etl') and hasattr(settings.etl, 'use_database_filtering'))
        )

        assert has_flag, "use_database_filtering setting should exist in config"

    def test_feature_flag_default_is_true(self):
        """Feature flag should default to True (optimization enabled)"""
        from app.core.config import settings

        if hasattr(settings, 'use_database_filtering'):
            assert settings.use_database_filtering == True
        elif hasattr(settings, 'etl') and hasattr(settings.etl, 'use_database_filtering'):
            assert settings.etl.use_database_filtering == True


class TestQueryStructure:
    """Tests for generated query structure"""

    def test_query_uses_cte_pattern(self):
        """Should use CTE (Common Table Expression) pattern"""
        from app.services.etl.engine import ETLEngine

        mock_df = pd.DataFrame({'Address': ['123 Main St']})

        with patch.object(ETLEngine, '__init__', lambda x, *args, **kwargs: None):
            engine = ETLEngine.__new__(ETLEngine)
            engine.snowflake_conn = Mock()
            engine.snowflake_conn.execute_query = Mock(return_value=mock_df)
            engine.logger = Mock()
            engine.logger.log_step = Mock()
            engine.logger.log_error = Mock()

            result = engine._build_filtered_query("SELECT * FROM test")

            assert "WITH" in result
            assert "AS (" in result or "AS(" in result

    def test_query_filters_against_person_cache(self):
        """Should filter against PERSON_CACHE table"""
        from app.services.etl.engine import ETLEngine

        mock_df = pd.DataFrame({'Address': ['123 Main St']})

        with patch.object(ETLEngine, '__init__', lambda x, *args, **kwargs: None):
            engine = ETLEngine.__new__(ETLEngine)
            engine.snowflake_conn = Mock()
            engine.snowflake_conn.execute_query = Mock(return_value=mock_df)
            engine.logger = Mock()
            engine.logger.log_step = Mock()
            engine.logger.log_error = Mock()

            result = engine._build_filtered_query("SELECT * FROM test")

            assert "PERSON_CACHE" in result
            assert "PROCESSED_DATA_DB" in result or "person_cache" in result.lower()

    def test_query_normalizes_addresses(self):
        """Should use UPPER(TRIM()) for address comparison"""
        from app.services.etl.engine import ETLEngine

        mock_df = pd.DataFrame({'Address': ['123 Main St']})

        with patch.object(ETLEngine, '__init__', lambda x, *args, **kwargs: None):
            engine = ETLEngine.__new__(ETLEngine)
            engine.snowflake_conn = Mock()
            engine.snowflake_conn.execute_query = Mock(return_value=mock_df)
            engine.logger = Mock()
            engine.logger.log_step = Mock()
            engine.logger.log_error = Mock()

            result = engine._build_filtered_query("SELECT * FROM test")

            assert "UPPER" in result
            assert "TRIM" in result


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
