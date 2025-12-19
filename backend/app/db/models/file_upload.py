"""
File Upload model for tracking individual upload processing
"""

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.db.base import Base


class FileUpload(Base):
    """File Upload model - tracks processing of uploaded files into ETL jobs"""
    __tablename__ = "file_uploads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_source_id = Column(UUID(as_uuid=True), ForeignKey("file_sources.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("etl_jobs.id", ondelete="SET NULL"), nullable=True)

    # Processing results
    rows_uploaded = Column(Integer, nullable=False, default=0)
    rows_skipped = Column(Integer, nullable=False, default=0)
    error_message = Column(Text, nullable=True)
    validation_errors = Column(JSONB, nullable=True)  # Array of validation error details

    # Metadata
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    file_source = relationship("FileSource", back_populates="uploads")
    job = relationship("ETLJob", foreign_keys=[job_id])
    user = relationship("User", foreign_keys=[uploaded_by])

    def __repr__(self):
        return f"<FileUpload(id={self.id}, file_source_id={self.file_source_id}, rows_uploaded={self.rows_uploaded})>"
