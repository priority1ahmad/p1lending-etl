"""CRM Import History model for tracking Lodasoft imports."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class CRMImportHistory(Base):
    """Track history of CRM imports to Lodasoft."""

    __tablename__ = "crm_import_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=True)
    job_name = Column(String(255), nullable=True)
    table_id = Column(String(100), nullable=True)  # Lodasoft contact list ID
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    status = Column(String(50), default="pending")  # pending, in_progress, completed, failed
    total_records = Column(Integer, default=0)
    successful_records = Column(Integer, default=0)
    failed_records = Column(Integer, default=0)
    merged_records = Column(Integer, default=0)
    duplicate_records = Column(Integer, default=0)
    
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "job_id": str(self.job_id) if self.job_id else None,
            "job_name": self.job_name,
            "table_id": self.table_id,
            "user_id": str(self.user_id),
            "status": self.status,
            "total_records": self.total_records,
            "successful_records": self.successful_records,
            "failed_records": self.failed_records,
            "merged_records": self.merged_records,
            "duplicate_records": self.duplicate_records,
            "error_message": self.error_message,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
