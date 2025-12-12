"""
Results Cache models for caching ETL job results in PostgreSQL
"""

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.db.base import Base


class ResultsCache(Base):
    """
    Results Cache model for storing paginated result data.

    Caches results from Snowflake MASTER_PROCESSED_DB for fast retrieval.
    Each cache entry stores a chunk of data (e.g., 1000 records per entry).
    Only the last 3 runs are cached; older caches are evicted automatically.
    """
    __tablename__ = "results_cache"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    table_id = Column(String(255), nullable=False, index=True)
    job_id = Column(UUID(as_uuid=True), ForeignKey("etl_jobs.id", ondelete="CASCADE"), nullable=False)
    cache_key = Column(String(255), nullable=False, unique=True, index=True)  # Format: {table_id}_{offset}_{limit}
    data = Column(JSONB, nullable=False)  # Array of result records
    record_count = Column(Integer, nullable=False)  # Number of records in this chunk
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)

    # Relationships
    job = relationship("ETLJob", foreign_keys=[job_id])

    def __repr__(self):
        return f"<ResultsCache(table_id={self.table_id}, key={self.cache_key}, records={self.record_count})>"


class ResultsCacheMetadata(Base):
    """
    Results Cache Metadata for tracking which runs are cached.

    Used to quickly determine if a table_id is cached and to manage
    cache eviction (keeping only last 3 runs).
    """
    __tablename__ = "results_cache_metadata"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    table_id = Column(String(255), nullable=False, unique=True, index=True)
    job_id = Column(UUID(as_uuid=True), ForeignKey("etl_jobs.id", ondelete="CASCADE"), nullable=False)
    total_records = Column(Integer, nullable=False)
    litigator_count = Column(Integer, default=0, nullable=False)
    cached_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    job = relationship("ETLJob", foreign_keys=[job_id])

    def __repr__(self):
        return f"<ResultsCacheMetadata(table_id={self.table_id}, records={self.total_records})>"
