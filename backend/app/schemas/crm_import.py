"""Pydantic schemas for CRM import operations."""

from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel


class CRMImportRequest(BaseModel):
    """Request to start a CRM import."""
    job_id: Optional[UUID] = None
    job_name: Optional[str] = None
    record_ids: Optional[List[str]] = None  # Specific records to import


class CRMImportStartResponse(BaseModel):
    """Response when starting a CRM import."""
    import_id: UUID
    status: str
    message: str
    total_records: int


class CRMImportProgress(BaseModel):
    """Real-time import progress update."""
    import_id: UUID
    status: str
    total_records: int
    processed_records: int
    successful_records: int
    failed_records: int
    merged_records: int
    duplicate_records: int
    current_batch: int
    total_batches: int
    progress_percent: float
    logs: List[str]
    error_message: Optional[str] = None


class CRMImportHistoryItem(BaseModel):
    """A single import history record."""
    id: UUID
    job_id: Optional[UUID]
    job_name: Optional[str]
    status: str
    total_records: int
    successful_records: int
    failed_records: int
    merged_records: int
    duplicate_records: int
    error_message: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class CRMImportHistoryResponse(BaseModel):
    """Paginated list of import history."""
    items: List[CRMImportHistoryItem]
    total: int
    page: int
    page_size: int


class CRMConnectionStatus(BaseModel):
    """Lodasoft API connection status."""
    success: bool
    message: str
    auth_url: Optional[str] = None
    upload_url: Optional[str] = None
