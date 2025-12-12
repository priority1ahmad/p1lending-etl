"""
Phone Blacklist schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


class PhoneBlacklistAdd(BaseModel):
    """Request schema for adding phones to blacklist"""
    phone_numbers: List[str] = Field(..., min_length=1, description="List of phone numbers to blacklist")
    reason: str = Field(..., description="Reason for blacklisting: 'litigator', 'manual', or 'dnc'")
    source_table_id: Optional[str] = Field(None, description="Source table_id if from ETL results")
    source_job_id: Optional[UUID] = Field(None, description="Source job_id if from ETL job")


class PhoneBlacklistAddFromJob(BaseModel):
    """Request schema for adding litigator phones from a specific job"""
    table_id: str = Field(..., description="Table ID to extract litigator phones from")


class PhoneBlacklistRemove(BaseModel):
    """Request schema for removing phones from blacklist"""
    phone_numbers: List[str] = Field(..., min_length=1, description="List of phone numbers to remove")


class PhoneBlacklistEntry(BaseModel):
    """Response schema for a single blacklist entry"""
    id: UUID
    phone_number: str
    reason: str
    source_table_id: Optional[str] = None
    source_job_id: Optional[UUID] = None
    added_by: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PhoneBlacklistResponse(BaseModel):
    """Response schema for blacklist operations"""
    success: bool
    message: str
    count: int = 0


class PhoneBlacklistStatsResponse(BaseModel):
    """Response schema for blacklist statistics"""
    total: int
    by_reason: Dict[str, int]
    litigator_count: int
    manual_count: int
    dnc_count: int


class PhoneBlacklistListResponse(BaseModel):
    """Response schema for paginated blacklist entries"""
    entries: List[PhoneBlacklistEntry]
    total: int
    offset: int
    limit: int


class PhoneBlacklistCheckResponse(BaseModel):
    """Response schema for checking if a phone is blacklisted"""
    phone_number: str
    is_blacklisted: bool
    reason: Optional[str] = None
