"""
File Source schemas
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID

from app.db.models.file_source import FileSourceStatus


class FileSourceBase(BaseModel):
    """Base file source schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)


class FileSourceCreate(FileSourceBase):
    """File source creation schema"""
    pass


class FileSourceUpdate(BaseModel):
    """File source update schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    column_mapping: Optional[Dict[str, str]] = None
    status: Optional[FileSourceStatus] = None


class FileSourceResponse(FileSourceBase):
    """File source response schema"""
    id: UUID
    original_filename: str
    file_path: str
    file_size: int
    file_type: str
    status: FileSourceStatus
    column_mapping: Optional[Dict[str, str]] = None
    total_rows: Optional[int] = None
    valid_rows: Optional[int] = None
    error_rows: Optional[int] = None
    uploaded_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    processed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FileSourceDetail(FileSourceResponse):
    """Detailed file source response with upload history"""
    upload_count: int = 0


class ColumnMappingRequest(BaseModel):
    """Request schema for updating column mapping"""
    column_mapping: Dict[str, str] = Field(..., description="Mapping of file columns to standard columns")

    @field_validator("column_mapping")
    @classmethod
    def validate_mapping(cls, v: Dict[str, str]) -> Dict[str, str]:
        """Validate that mapping is not empty"""
        if not v:
            raise ValueError("Column mapping cannot be empty")
        return v


class PreviewRequest(BaseModel):
    """Request schema for previewing file data"""
    column_mapping: Optional[Dict[str, str]] = Field(None, description="Optional column mapping to apply")
    num_rows: int = Field(10, ge=1, le=100, description="Number of rows to preview")


class PreviewResponse(BaseModel):
    """Response schema for file preview"""
    total_rows: int
    mapped_columns: int
    validation_errors: List[Dict[str, Any]]
    total_errors: int
    preview_rows: List[Dict[str, Any]]


class ColumnInfo(BaseModel):
    """Schema for column information"""
    original_name: str
    normalized_name: str
    suggested_mapping: str
    data_type: str
    non_null_count: int
    null_count: int
    sample_values: List[Any]


class ColumnInfoResponse(BaseModel):
    """Response schema for column information"""
    columns: List[ColumnInfo]
    total_columns: int
    total_rows: int
