"""
Phone Blacklist model for storing blocked litigator phone numbers
"""

from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.db.base import Base


class PhoneBlacklist(Base):
    """
    Phone Blacklist model for storing blocked phone numbers.

    Phone numbers added to this list will be automatically filtered out
    before ETL processing to avoid re-processing known litigators.
    """

    __tablename__ = "phone_blacklist"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone_number = Column(String(20), nullable=False, unique=True, index=True)
    reason = Column(String(50), nullable=False)  # 'litigator', 'manual', 'dnc'
    source_table_id = Column(
        String(255), nullable=True
    )  # The table_id from which this was blacklisted
    source_job_id = Column(
        UUID(as_uuid=True), ForeignKey("etl_jobs.id", ondelete="SET NULL"), nullable=True
    )
    added_by = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    source_job = relationship("ETLJob", foreign_keys=[source_job_id])
    added_by_user = relationship("User", foreign_keys=[added_by])

    def __repr__(self):
        return f"<PhoneBlacklist(phone={self.phone_number}, reason={self.reason})>"
