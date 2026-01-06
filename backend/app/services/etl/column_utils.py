"""
Column utilities for ETL results processing.

Pure functions for DataFrame column manipulation, no external dependencies.
"""

import pandas as pd


def handle_zip_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Handle zip/zip_code column naming for frontend compatibility.

    Snowflake table may have both 'zip' and 'zip_code' columns.
    Frontend expects 'zip_code'. This method handles the conflict.

    Args:
        df: DataFrame with potential zip/zip_code columns

    Returns:
        DataFrame with single 'zip_code' column (no duplicates)
    """
    if df is None or df.empty:
        return df
    # Handle conflict: if both exist, drop zip_code (OLD data), keep zip (real data)
    if "zip" in df.columns and "zip_code" in df.columns:
        df = df.drop(columns=["zip_code"])
        df = df.rename(columns={"zip": "zip_code"})
    elif "zip" in df.columns:
        df = df.rename(columns={"zip": "zip_code"})
    return df
