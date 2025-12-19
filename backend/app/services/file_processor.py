"""
File processor service for CSV/Excel file handling and data transformation
"""

import pandas as pd
import re
from typing import Dict, List, Optional, Tuple, Any
from pathlib import Path
import logging
from datetime import datetime

from app.core.schema import (
    STANDARD_SCHEMA,
    COLUMN_ALIASES,
    normalize_column_name,
    get_standard_column,
    validate_schema_mapping,
)

logger = logging.getLogger(__name__)


class FileProcessor:
    """Handles reading, mapping, and processing of CSV/Excel files"""

    def __init__(self, file_path: str, file_type: str):
        """
        Initialize file processor.

        Args:
            file_path: Path to the file to process
            file_type: File type ('csv' or 'xlsx')
        """
        self.file_path = file_path
        self.file_type = file_type.lower()
        self._df: Optional[pd.DataFrame] = None

    def read_file(self, sheet_name: Optional[str] = None, max_rows: Optional[int] = None) -> pd.DataFrame:
        """
        Read CSV or Excel file into a pandas DataFrame.

        Args:
            sheet_name: Sheet name for Excel files (default: first sheet)
            max_rows: Maximum number of rows to read (for preview)

        Returns:
            pandas DataFrame with file contents

        Raises:
            ValueError: If file type is not supported
            FileNotFoundError: If file does not exist
        """
        file_path = Path(self.file_path)

        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {self.file_path}")

        try:
            if self.file_type == "csv":
                self._df = pd.read_csv(
                    file_path,
                    encoding="utf-8-sig",  # Handle BOM
                    nrows=max_rows,
                    low_memory=False,
                )
            elif self.file_type in ["xlsx", "xls"]:
                self._df = pd.read_excel(
                    file_path,
                    sheet_name=sheet_name or 0,
                    nrows=max_rows,
                    engine="openpyxl" if self.file_type == "xlsx" else "xlrd",
                )
            else:
                raise ValueError(f"Unsupported file type: {self.file_type}")

            # Clean column names
            self._df.columns = [str(col).strip() for col in self._df.columns]

            logger.info(f"Successfully read {len(self._df)} rows from {self.file_path}")
            return self._df

        except Exception as e:
            logger.error(f"Error reading file {self.file_path}: {str(e)}")
            raise

    def auto_match_columns(self) -> Dict[str, str]:
        """
        Automatically match file columns to standard schema columns.
        Uses the COLUMN_ALIASES dictionary and fuzzy matching.

        Returns:
            Dictionary mapping file columns to standard schema columns
        """
        if self._df is None:
            raise ValueError("File must be read before matching columns. Call read_file() first.")

        column_mapping = {}

        for file_column in self._df.columns:
            # Try to find a match
            standard_column = get_standard_column(file_column)

            # Only include if it maps to a valid standard column
            if standard_column in STANDARD_SCHEMA:
                column_mapping[file_column] = standard_column
                logger.debug(f"Matched '{file_column}' -> '{standard_column}'")
            else:
                logger.debug(f"No match found for column '{file_column}'")

        logger.info(f"Auto-matched {len(column_mapping)} columns out of {len(self._df.columns)}")
        return column_mapping

    def apply_mapping(self, column_mapping: Dict[str, str]) -> pd.DataFrame:
        """
        Apply column mapping to transform data to standard schema.

        Args:
            column_mapping: Dictionary mapping file columns to standard columns

        Returns:
            DataFrame with standard column names
        """
        if self._df is None:
            raise ValueError("File must be read before applying mapping. Call read_file() first.")

        # Create a new DataFrame with only mapped columns
        mapped_df = pd.DataFrame()

        for file_col, standard_col in column_mapping.items():
            if file_col in self._df.columns:
                mapped_df[standard_col] = self._df[file_col]

        logger.info(f"Applied mapping to create {len(mapped_df.columns)} columns")
        return mapped_df

    def normalize_data(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[Dict[str, Any]]]:
        """
        Normalize data by applying formatting rules.
        - Title case for names
        - Phone number formatting
        - Email validation
        - Data type conversions

        Args:
            df: DataFrame to normalize

        Returns:
            Tuple of (normalized DataFrame, list of validation errors)
        """
        normalized_df = df.copy()
        validation_errors = []

        # Normalize name fields (title case)
        name_fields = ["first_name", "middle_name", "last_name"]
        for field in name_fields:
            if field in normalized_df.columns:
                normalized_df[field] = normalized_df[field].apply(
                    lambda x: self._title_case(x) if pd.notna(x) else None
                )

        # Normalize phone numbers
        phone_fields = ["phone_1", "phone_2", "phone_3"]
        for field in phone_fields:
            if field in normalized_df.columns:
                normalized_df[field] = normalized_df[field].apply(
                    lambda x: self._normalize_phone(x) if pd.notna(x) else None
                )

        # Normalize email addresses
        if "email" in normalized_df.columns:
            normalized_df["email"] = normalized_df["email"].apply(
                lambda x: self._normalize_email(x) if pd.notna(x) else None
            )

        # Normalize state codes (uppercase)
        if "state" in normalized_df.columns:
            normalized_df["state"] = normalized_df["state"].apply(
                lambda x: str(x).upper().strip() if pd.notna(x) else None
            )

        # Normalize zip codes
        if "zip_code" in normalized_df.columns:
            normalized_df["zip_code"] = normalized_df["zip_code"].apply(
                lambda x: self._normalize_zip(x) if pd.notna(x) else None
            )

        # Convert numeric fields
        numeric_fields = [
            "property_value",
            "mortgage_balance",
            "estimated_equity",
            "interest_rate",
            "credit_score",
            "annual_income",
            "debt_to_income",
            "cash_out_amount",
        ]
        for field in numeric_fields:
            if field in normalized_df.columns:
                normalized_df[field] = pd.to_numeric(normalized_df[field], errors="coerce")

        # Validate required fields and collect errors
        for idx, row in normalized_df.iterrows():
            row_errors = []

            # Check for required fields (at least one name and one contact method)
            if pd.isna(row.get("first_name")) and pd.isna(row.get("last_name")):
                row_errors.append("Missing both first and last name")

            if (
                pd.isna(row.get("phone_1"))
                and pd.isna(row.get("phone_2"))
                and pd.isna(row.get("phone_3"))
                and pd.isna(row.get("email"))
            ):
                row_errors.append("Missing all contact methods (phone and email)")

            if row_errors:
                validation_errors.append({"row": int(idx) + 2, "errors": row_errors})  # +2 for header and 0-index

        logger.info(f"Normalized {len(normalized_df)} rows with {len(validation_errors)} validation errors")
        return normalized_df, validation_errors

    def get_column_info(self) -> List[Dict[str, Any]]:
        """
        Get information about columns in the file.

        Returns:
            List of dictionaries with column information
        """
        if self._df is None:
            raise ValueError("File must be read before getting column info. Call read_file() first.")

        column_info = []
        for col in self._df.columns:
            info = {
                "original_name": col,
                "normalized_name": normalize_column_name(col),
                "suggested_mapping": get_standard_column(col),
                "data_type": str(self._df[col].dtype),
                "non_null_count": int(self._df[col].count()),
                "null_count": int(self._df[col].isna().sum()),
                "sample_values": self._df[col].dropna().head(3).tolist(),
            }
            column_info.append(info)

        return column_info

    def preview_mapped_data(self, column_mapping: Dict[str, str], num_rows: int = 10) -> Dict[str, Any]:
        """
        Preview data after applying mapping and normalization.

        Args:
            column_mapping: Column mapping to apply
            num_rows: Number of rows to preview

        Returns:
            Dictionary with preview data and statistics
        """
        if self._df is None:
            raise ValueError("File must be read before previewing. Call read_file() first.")

        # Apply mapping
        mapped_df = self.apply_mapping(column_mapping)

        # Normalize
        normalized_df, validation_errors = self.normalize_data(mapped_df)

        # Get preview rows
        preview_rows = normalized_df.head(num_rows).fillna("").to_dict(orient="records")

        return {
            "total_rows": len(self._df),
            "mapped_columns": len(mapped_df.columns),
            "validation_errors": validation_errors[:10],  # First 10 errors
            "total_errors": len(validation_errors),
            "preview_rows": preview_rows,
        }

    @staticmethod
    def _title_case(value: str) -> str:
        """Apply title case to a string"""
        if not value:
            return ""
        return str(value).strip().title()

    @staticmethod
    def _normalize_phone(value: str) -> str:
        """
        Normalize phone number to format: XXX-XXX-XXXX

        Args:
            value: Raw phone number

        Returns:
            Normalized phone number or original if invalid
        """
        if not value:
            return ""

        # Remove all non-digit characters
        digits = re.sub(r"\D", "", str(value))

        # Handle 11-digit numbers (with country code 1)
        if len(digits) == 11 and digits[0] == "1":
            digits = digits[1:]

        # Format as XXX-XXX-XXXX if 10 digits
        if len(digits) == 10:
            return f"{digits[0:3]}-{digits[3:6]}-{digits[6:10]}"

        # Return original if not 10 digits
        return str(value).strip()

    @staticmethod
    def _normalize_email(value: str) -> str:
        """
        Normalize email address (lowercase and trim).

        Args:
            value: Raw email address

        Returns:
            Normalized email address
        """
        if not value:
            return ""

        email = str(value).strip().lower()

        # Basic email validation
        if "@" not in email or "." not in email.split("@")[1]:
            return ""

        return email

    @staticmethod
    def _normalize_zip(value: str) -> str:
        """
        Normalize ZIP code to 5-digit format.

        Args:
            value: Raw ZIP code

        Returns:
            Normalized ZIP code
        """
        if not value:
            return ""

        # Extract only digits
        digits = re.sub(r"\D", "", str(value))

        # Return first 5 digits if available
        if len(digits) >= 5:
            return digits[:5]

        return str(value).strip()
