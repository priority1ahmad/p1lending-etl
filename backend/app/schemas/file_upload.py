"""
File Upload schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


class FileUploadBase(BaseModel):
    """Base file upload schema"""

    file_source_id: UUID


class FileUploadCreate(FileUploadBase):
    """File upload creation schema"""

    pass


class FileUploadResponse(FileUploadBase):
    """File upload response schema"""

    id: UUID
    job_id: Optional[UUID] = None
    rows_uploaded: int
    rows_skipped: int
    error_message: Optional[str] = None
    validation_errors: Optional[List[Dict[str, Any]]] = None
    uploaded_by: Optional[UUID] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProcessFileRequest(BaseModel):
    """Request schema for processing uploaded file"""

    file_source_id: UUID
    column_mapping: Dict[str, str] = Field(..., description="Column mapping to apply")
    row_limit: Optional[int] = Field(None, ge=1, description="Optional limit on rows to process")
    skip_validation_errors: bool = Field(False, description="Skip rows with validation errors")


class ProcessFileResponse(BaseModel):
    """Response schema for file processing"""

    upload_id: UUID
    job_id: Optional[UUID] = None
    rows_uploaded: int
    rows_skipped: int
    validation_errors: Optional[List[Dict[str, Any]]] = None
    message: str
