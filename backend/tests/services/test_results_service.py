"""
Tests for ETLResultsService - specifically for column handling
"""

import pandas as pd

from app.services.etl.column_utils import handle_zip_columns


class TestResultsServiceColumnHandling:
    """Test column handling in results service"""

    def test_no_duplicate_columns_when_both_zip_columns_exist(self):
        """
        When both 'zip' and 'zip_code' exist, we should keep 'zip' data,
        drop 'zip_code', and rename 'zip' to 'zip_code'. No duplicates.
        """
        df = pd.DataFrame(
            {
                "record_id": ["1", "2"],
                "zip_code": ["OLD", "OLD"],
                "zip": ["12345", "67890"],
            }
        )

        df = handle_zip_columns(df)

        # Should have no duplicate columns
        assert len(df.columns) == len(
            set(df.columns)
        ), f"Should have no duplicate columns, but got: {list(df.columns)}"

        # Should have zip_code column with real data (from original 'zip')
        assert "zip_code" in df.columns
        assert list(df["zip_code"]) == ["12345", "67890"]
