"""
Configuration schemas
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any


class ConfigItem(BaseModel):
    """Configuration item schema"""
    key: str
    value: Optional[str] = None
    is_encrypted: bool = False


class ConfigUpdate(BaseModel):
    """Configuration update schema"""
    config: Dict[str, Any]


class ConfigResponse(BaseModel):
    """Configuration response schema"""
    idicore_client_id: Optional[str] = None
    idicore_client_secret: Optional[str] = None
    google_sheet_url: Optional[str] = None
    snowflake_account: Optional[str] = None
    snowflake_user: Optional[str] = None
    snowflake_database: Optional[str] = None
    snowflake_schema: Optional[str] = None


class TestConnectionResponse(BaseModel):
    """Test connection response schema"""
    success: bool
    message: str

