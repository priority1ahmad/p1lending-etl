"""
Audit log models for security tracking
"""

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.db.base import Base


class LoginAuditLog(Base):
    """Login audit trail for security monitoring"""

    __tablename__ = "login_audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    email = Column(String(255), nullable=False)
    ip_address = Column(String(45), nullable=True)  # IPv4 (15) + IPv6 (45) chars
    user_agent = Column(Text, nullable=True)
    login_status = Column(
        String(50), nullable=False
    )  # success, invalid_email, invalid_password, inactive_user
    failure_reason = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])

    # Indexes for common queries
    __table_args__ = (
        Index("ix_login_audit_email", "email"),
        Index("ix_login_audit_timestamp", "timestamp"),
        Index("ix_login_audit_ip", "ip_address"),
        Index("ix_login_audit_status", "login_status"),
    )

    def __repr__(self):
        return f"<LoginAuditLog(id={self.id}, email={self.email}, status={self.login_status})>"
