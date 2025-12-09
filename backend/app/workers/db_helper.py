"""
Synchronous database helper for Celery tasks

This module provides synchronous database operations for use in Celery tasks,
which run in a synchronous context and cannot use async database sessions.
"""

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from uuid import UUID
from app.core.config import settings
from app.core.logger import etl_logger
from app.db.models.job import ETLJob, JobLog, JobStatus

# Global engine and session factory
_engine = None
_SessionLocal = None


def get_sync_engine():
    """Get or create synchronous database engine"""
    global _engine
    if _engine is None:
        # Convert asyncpg URL to psycopg2 URL for synchronous operations
        sync_url = settings.database_url.replace('+asyncpg', '')
        _engine = create_engine(
            sync_url,
            echo=False,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
        )
    return _engine


def get_sync_session():
    """Get synchronous database session factory"""
    global _SessionLocal
    if _SessionLocal is None:
        engine = get_sync_engine()
        _SessionLocal = sessionmaker(
            bind=engine,
            autocommit=False,
            autoflush=False,
        )
    return _SessionLocal


def update_job_status(
    job_id: str,
    status: JobStatus,
    error_message: str = None,
    progress: int = None,
    message: str = None,
    total_rows_processed: int = None,
    litigator_count: int = None,
    dnc_count: int = None,
    both_count: int = None,
    clean_count: int = None
):
    """
    Update job status in database (synchronous, for use in Celery tasks)
    
    Args:
        job_id: Job UUID as string
        status: JobStatus enum value
        error_message: Optional error message for failed jobs
        progress: Optional progress percentage (0-100)
        message: Optional status message
        total_rows_processed: Optional total rows processed
        litigator_count: Optional count of litigator records
        dnc_count: Optional count of DNC records
        both_count: Optional count of records in both lists
        clean_count: Optional count of clean records
    
    Returns:
        bool: True if update succeeded, False otherwise
    """
    try:
        SessionLocal = get_sync_session()
        with SessionLocal() as session:
            try:
                # Convert string UUID to UUID object
                job_uuid = UUID(job_id)
                
                # Query the job
                result = session.execute(
                    select(ETLJob).where(ETLJob.id == job_uuid)
                )
                job = result.scalar_one_or_none()
                
                if not job:
                    etl_logger.warning(f"Job {job_id} not found in database")
                    return False
                
                # Update job status
                job.status = status
                
                # Update progress if provided
                if progress is not None:
                    job.progress = progress
                
                # Update error message if provided
                if error_message:
                    job.error_message = error_message
                
                # Update message if provided
                if message:
                    job.message = message
                
                # Update counts if provided
                if total_rows_processed is not None:
                    job.total_rows_processed = total_rows_processed
                if litigator_count is not None:
                    job.litigator_count = litigator_count
                if dnc_count is not None:
                    job.dnc_count = dnc_count
                if both_count is not None:
                    job.both_count = both_count
                if clean_count is not None:
                    job.clean_count = clean_count
                
                # Set completed_at for terminal states
                if status in [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED]:
                    if job.completed_at is None:
                        job.completed_at = datetime.utcnow()
                
                # Set started_at if transitioning to RUNNING
                if status == JobStatus.RUNNING and job.started_at is None:
                    job.started_at = datetime.utcnow()
                
                # Commit changes
                session.commit()
                etl_logger.info(f"Updated job {job_id} status to {status.value}")
                return True
                
            except Exception as e:
                session.rollback()
                etl_logger.error(f"Failed to update job {job_id} status: {e}")
                return False

    except Exception as e:
        etl_logger.error(f"Database error updating job {job_id} status: {e}")
        return False


def add_job_log(job_id: str, level: str, message: str) -> bool:
    """
    Add a log entry to the database for a job (synchronous, for use in Celery tasks)

    Args:
        job_id: Job UUID as string
        level: Log level (INFO, WARNING, ERROR)
        message: Log message

    Returns:
        bool: True if insert succeeded, False otherwise
    """
    try:
        SessionLocal = get_sync_session()
        with SessionLocal() as session:
            try:
                # Convert string UUID to UUID object
                job_uuid = UUID(job_id)

                # Create log entry
                log_entry = JobLog(
                    job_id=job_uuid,
                    level=level.upper(),
                    message=message
                )

                session.add(log_entry)
                session.commit()
                return True

            except Exception as e:
                session.rollback()
                # Don't log every failure to avoid log spam
                return False

    except Exception as e:
        return False

