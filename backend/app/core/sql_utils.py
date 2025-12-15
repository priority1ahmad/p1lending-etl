"""SQL utility functions for safe string escaping."""
import json
import pandas as pd
from typing import Any


def escape_sql_string(value: Any, return_null: bool = True) -> str:
    """
    Escape string value for safe SQL insertion.

    Handles: single quotes, backslashes, newlines, carriage returns,
    tabs, backspace, form feed, and null bytes.

    Args:
        value: Any value to escape
        return_null: If True, return 'NULL' for None/NaN values

    Returns:
        SQL-safe string with quotes, or 'NULL' for null values
    """
    if value is None:
        return "NULL" if return_null else "''"

    if isinstance(value, float) and pd.isna(value):
        return "NULL" if return_null else "''"

    str_val = str(value)
    # Order matters: escape backslashes first to avoid double-escaping
    str_val = str_val.replace("\\", "\\\\")
    str_val = str_val.replace("'", "''")
    str_val = str_val.replace("\n", "\\n")
    str_val = str_val.replace("\r", "\\r")
    str_val = str_val.replace("\t", "\\t")
    str_val = str_val.replace("\b", "\\b")
    str_val = str_val.replace("\f", "\\f")
    str_val = str_val.replace("\0", "")  # Remove null bytes entirely

    return f"'{str_val}'"


def escape_json_for_sql(data: dict) -> str:
    """
    Convert dictionary to JSON string, escaped for SQL PARSE_JSON().

    json.dumps handles control character escaping (\\n, \\t, etc.)
    We only need to escape single quotes for SQL embedding.

    Args:
        data: Dictionary to convert to JSON

    Returns:
        JSON string safe for use in SQL PARSE_JSON()
    """
    # ensure_ascii=True converts any unicode to \\uXXXX format
    json_str = json.dumps(data, ensure_ascii=True)
    # Escape single quotes for SQL (json.dumps already escaped backslashes)
    return json_str.replace("'", "''")
