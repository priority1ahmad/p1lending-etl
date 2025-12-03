"""
Job schemas
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID
from app.db.models.job import JobStatus, JobType


class JobCreate(BaseModel):
    """Job creation schema"""
    script_id: Optional[UUID] = None
    script_content: Optional[str] = None
    script_name: Optional[str] = None
    job_type: JobType
    row_limit: Optional[int] = None


class JobResponse(BaseModel):
    """Job response schema"""
    id: UUID
    job_type: JobType
    script_id: Optional[UUID] = None
    status: JobStatus
    progress: int
    message: Optional[str] = None
    row_limit: Optional[int] = None
    total_rows_processed: int
    litigator_count: int
    dnc_count: int
    both_count: int
    clean_count: int
    error_message: Optional[str] = None
    preview_data: Optional[Dict[str, Any]] = None  # Cached preview results for fast retrieval
    started_by: Optional[UUID] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    # Detailed progress fields
    current_row: Optional[int] = None
    total_rows: Optional[int] = None
    rows_remaining: Optional[int] = None
    current_batch: Optional[int] = None
    total_batches: Optional[int] = None

    class Config:
        from_attributes = True


class JobLogResponse(BaseModel):
    """Job log response schema"""
    id: UUID
    job_id: UUID
    level: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True


class JobPreviewResponse(BaseModel):
    """Job preview response schema"""
    script_name: str
    row_count: int  # Total rows from query (for backward compatibility)
    total_rows: Optional[int] = None  # Total rows from query
    already_processed: Optional[int] = None  # Rows already in PERSON_CACHE
    unprocessed: Optional[int] = None  # New rows that will be processed
    rows: Optional[List[Dict[str, Any]]] = None

