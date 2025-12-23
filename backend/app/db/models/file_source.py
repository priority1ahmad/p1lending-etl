"""
File Source model for CSV/Excel uploads
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.db.base import Base


class FileSourceStatus(str, enum.Enum):
    """File source processing status"""

    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class FileSource(Base):
    """File Source model - represents an uploaded CSV/Excel file"""

    __tablename__ = "file_sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_type = Column(String(20), nullable=False)  # 'csv' or 'xlsx'
    status = Column(
        SQLEnum(FileSourceStatus, name="filesourcestatus", create_type=False),
        nullable=False,
        default=FileSourceStatus.UPLOADED,
    )

    # Column mapping configuration
    column_mapping = Column(JSONB, nullable=True)  # Maps file columns to standard schema
    total_rows = Column(Integer, nullable=True)
    valid_rows = Column(Integer, nullable=True)
    error_rows = Column(Integer, nullable=True)

    # Metadata
    uploaded_by = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    processed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[uploaded_by])
    uploads = relationship("FileUpload", back_populates="file_source", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<FileSource(id={self.id}, name={self.name}, status={self.status})>"
