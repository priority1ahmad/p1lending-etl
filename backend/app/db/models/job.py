"""
ETL Job models
"""

from sqlalchemy import (
    Column,
    String,
    Integer,
    Text,
    DateTime,
    ForeignKey,
    Enum as SQLEnum,
    TypeDecorator,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.db.base import Base


class JobType(str, enum.Enum):
    """ETL job type"""

    SINGLE_SCRIPT = "single_script"
    ALL_SCRIPTS = "all_scripts"
    PREVIEW = "preview"


class JobStatus(str, enum.Enum):
    """ETL job status"""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class EnumValueType(TypeDecorator):
    """Type decorator that ensures enum values (not names) are stored in PostgreSQL enum"""

    impl = SQLEnum
    cache_ok = True

    def __init__(self, enum_class, enum_name, *args, **kwargs):
        self.enum_class = enum_class
        self.enum_name = enum_name
        # Create the underlying SQLEnum with native_enum=True
        super().__init__(enum_class, name=enum_name, native_enum=True, *args, **kwargs)

    def bind_processor(self, dialect):
        """Override bind_processor to ensure enum values are used, not names"""

        def process(value):
            if value is None:
                return None
            # Always convert to enum value string
            if isinstance(value, str):
                # Check if string matches an enum name and convert to value
                for enum_member in self.enum_class:
                    if enum_member.name == value or enum_member.name.upper() == value.upper():
                        return enum_member.value  # Convert name to value
                    if enum_member.value == value:
                        return value  # Already the value
                return value
            # If it's an enum member, return its value
            if isinstance(value, enum.Enum):
                return value.value
            return value

        return process

    def result_processor(self, dialect, coltype):
        """Override result_processor to handle enum values from database"""

        def process(value):
            if value is None:
                return None
            # The database returns enum values (like 'preview'), but SQLEnum expects names
            # Convert the value to the enum member before SQLEnum processes it
            if isinstance(value, str):
                # Try to find enum member by value
                try:
                    return self.enum_class(value)  # This will find by value
                except ValueError:
                    # If not found by value, try by name (fallback)
                    try:
                        return getattr(self.enum_class, value.upper())
                    except AttributeError:
                        return value
            # If it's already an enum member, return it
            if isinstance(value, self.enum_class):
                return value
            return value

        return process

    def process_bind_param(self, value, dialect):
        """Convert enum to its value before binding to database"""
        if value is None:
            return None
        # Always ensure we return the enum VALUE as a string, never the name
        if isinstance(value, str):
            # Check if string is a valid enum value
            for enum_member in self.enum_class:
                if enum_member.value == value:
                    return value  # It's already the value, return as-is
                if enum_member.name == value or enum_member.name.upper() == value.upper():
                    return enum_member.value  # It's a name, return the value
            # If not found, return as-is (might be invalid, but let DB handle it)
            return value
        # If it's an enum member, return its value
        if isinstance(value, enum.Enum):
            return value.value
        return value

    def process_result_value(self, value, dialect):
        """Convert database value back to enum"""
        if value is None:
            return None
        # If it's already the correct enum type, return it
        if isinstance(value, self.enum_class):
            return value
        # Convert string value to enum member
        return self.enum_class(value)


class ETLJob(Base):
    """ETL Job model"""

    __tablename__ = "etl_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_type = Column(EnumValueType(JobType, "jobtype"), nullable=False)
    script_id = Column(UUID(as_uuid=True), ForeignKey("sql_scripts.id"), nullable=True)
    file_source_id = Column(UUID(as_uuid=True), ForeignKey("file_sources.id"), nullable=True)
    file_upload_id = Column(UUID(as_uuid=True), ForeignKey("file_uploads.id"), nullable=True)
    status = Column(
        EnumValueType(JobStatus, "jobstatus"), nullable=False, default=JobStatus.PENDING
    )
    progress = Column(Integer, default=0, nullable=False)
    message = Column(Text, nullable=True)
    row_limit = Column(Integer, nullable=True)

    # Table ID for results grouping (format: ScriptName_RowCount_DDMMYYYY)
    table_id = Column(String(255), nullable=True, index=True)
    table_title = Column(String(255), nullable=True)  # Custom display title
    total_rows_processed = Column(Integer, default=0, nullable=False)
    litigator_count = Column(Integer, default=0, nullable=False)
    dnc_count = Column(Integer, default=0, nullable=False)
    both_count = Column(Integer, default=0, nullable=False)
    clean_count = Column(Integer, default=0, nullable=False)
    error_message = Column(Text, nullable=True)
    preview_data = Column(JSONB, nullable=True)  # Store cached preview results for fast retrieval
    started_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    script = relationship("SQLScript", back_populates="jobs")
    file_source = relationship("FileSource", foreign_keys=[file_source_id])
    file_upload = relationship("FileUpload", foreign_keys=[file_upload_id])
    logs = relationship("JobLog", back_populates="job", cascade="all, delete-orphan")
    user = relationship("User", foreign_keys=[started_by])

    def __repr__(self):
        return f"<ETLJob(id={self.id}, status={self.status}, progress={self.progress})>"


class JobLog(Base):
    """Job log entry"""

    __tablename__ = "job_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(
        UUID(as_uuid=True), ForeignKey("etl_jobs.id", ondelete="CASCADE"), nullable=False
    )
    level = Column(String(20), nullable=False)  # INFO, WARNING, ERROR
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    job = relationship("ETLJob", back_populates="logs")

    def __repr__(self):
        return f"<JobLog(id={self.id}, level={self.level}, job_id={self.job_id})>"
