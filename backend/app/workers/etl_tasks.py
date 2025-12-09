"""
Celery tasks for ETL job execution
"""

import time
from typing import Optional, Dict, Any
from app.workers.celery_app import celery_app
from app.services.etl.engine import ETLEngine
from app.core.logger import etl_logger
from app.workers.db_helper import update_job_status
from app.db.models.job import JobStatus
from app.services.ntfy_service import get_ntfy_events

# Global stop flags for jobs
job_stop_flags: Dict[str, bool] = {}

# Track 50% notification to avoid duplicate sends
job_50_notified: Dict[str, bool] = {}


@celery_app.task(bind=True, name="app.workers.etl_tasks.run_etl_job")
def run_etl_job(self, job_id: str, script_id: Optional[str], script_content: str, 
                script_name: str, limit_rows: Optional[int] = None):
    """
    Execute ETL job as Celery task
    
    Args:
        job_id: Unique job identifier
        script_id: SQL script ID (optional)
        script_content: SQL script content
        script_name: SQL script name
        limit_rows: Row limit (optional)
    """
    # Initialize stop flag and 50% notification tracker
    job_stop_flags[job_id] = False
    job_50_notified[job_id] = False
    start_time = time.time()

    def stop_flag():
        return job_stop_flags.get(job_id, False)

    # Get NTFY service for notifications
    ntfy_events = get_ntfy_events()

    try:
        # Emit job started event
        emit_job_event(job_id, "job_progress", {
            "status": "running",
            "progress": 0,
            "message": "ETL job started",
            "current_row": 0,
            "total_rows": 0,
            "rows_remaining": 0,
            "current_batch": 0,
            "total_batches": 0
        })

        # Send NTFY notification for job start
        try:
            ntfy_events.notify_job_started_sync(
                job_id=job_id,
                script_name=script_name,
                user_email="system",  # User email not available in task context
                row_limit=limit_rows
            )
        except Exception as ntfy_error:
            etl_logger.warning(f"Failed to send NTFY job start notification: {ntfy_error}")
        
        # Update job status to RUNNING in database
        try:
            update_job_status(
                job_id=job_id,
                status=JobStatus.RUNNING,
                progress=0,
                message="ETL job started"
            )
        except Exception as db_error:
            etl_logger.warning(f"Failed to update job {job_id} status to RUNNING: {db_error}")
        
        # Create log callback to emit logs via WebSocket
        def log_callback(level: str, message: str):
            """Callback to emit logs via WebSocket"""
            emit_job_event(job_id, "job_log", {
                "level": level,
                "message": message
            })
        
        # Initialize ETL engine with job_id and log callback
        engine = ETLEngine(job_id=job_id, log_callback=log_callback)
        
        # Store row data for row_processed events
        row_data_cache = {}
        
        # Create progress callback
        def progress_callback(current_row, total_rows, current_batch, total_batches, percentage, message, row_data=None):
            """Progress callback that emits events"""
            rows_remaining = total_rows - current_row if total_rows > 0 else 0
            emit_job_event(job_id, "job_progress", {
                "status": "running",
                "progress": percentage,
                "message": message,
                "current_row": current_row,
                "total_rows": total_rows,
                "rows_remaining": rows_remaining,
                "current_batch": current_batch,
                "total_batches": total_batches
            })
            
            # Also emit batch progress event
            if current_batch > 0:
                emit_job_event(job_id, "batch_progress", {
                    "current_batch": current_batch,
                    "total_batches": total_batches,
                    "batch_start_row": (current_batch - 1) * 200 + 1,
                    "batch_end_row": min(current_batch * 200, total_rows),
                    "message": f"Processing batch {current_batch}/{total_batches}"
                })
            
            # Emit row processed event if row_data provided
            if row_data and current_row > 0 and current_row % 10 == 0:
                emit_job_event(job_id, "row_processed", {
                    "row_data": row_data,
                    "row_number": current_row,
                    "total_rows": total_rows,
                    "batch": current_batch
                })
        
        # Execute script with progress callback
        result = engine.execute_single_script(
            script_content=script_content,
            script_name=script_name,
            limit_rows=limit_rows,
            stop_flag=stop_flag,
            progress_callback=progress_callback
        )
        
        # Emit completion event
        if result.get('success'):
            # Update job status to COMPLETED in database
            try:
                update_job_status(
                    job_id=job_id,
                    status=JobStatus.COMPLETED,
                    progress=100,
                    message="ETL job completed successfully",
                    total_rows_processed=result.get('rows_processed', 0),
                    litigator_count=result.get('litigator_count', 0),
                    dnc_count=result.get('dnc_count', 0),
                    both_count=result.get('both_count', 0),
                    clean_count=result.get('clean_count', 0)
                )
            except Exception as db_error:
                etl_logger.warning(f"Failed to update job {job_id} status to COMPLETED: {db_error}")
            
            emit_job_event(job_id, "job_complete", {
                "status": "completed",
                "progress": 100,
                "message": "ETL job completed successfully",
                "rows_processed": result.get('rows_processed', 0),
                "litigator_count": result.get('litigator_count', 0),
                "dnc_count": result.get('dnc_count', 0),
                "both_count": result.get('both_count', 0),
                "clean_count": result.get('clean_count', 0),
            })

            # Send NTFY notification for job completion
            try:
                duration = time.time() - start_time
                ntfy_events.notify_job_completed_sync(
                    job_id=job_id,
                    script_name=script_name,
                    total_rows=result.get('rows_processed', 0),
                    clean_count=result.get('clean_count', 0),
                    litigator_count=result.get('litigator_count', 0),
                    dnc_count=result.get('dnc_count', 0),
                    duration_seconds=duration
                )
            except Exception as ntfy_error:
                etl_logger.warning(f"Failed to send NTFY job complete notification: {ntfy_error}")
        else:
            # Update job status to FAILED in database
            error_msg = result.get('error_message', 'Unknown error')
            try:
                update_job_status(
                    job_id=job_id,
                    status=JobStatus.FAILED,
                    error_message=error_msg,
                    progress=0,
                    message=error_msg
                )
            except Exception as db_error:
                etl_logger.warning(f"Failed to update job {job_id} status to FAILED: {db_error}")
            
            emit_job_event(job_id, "job_error", {
                "status": "failed",
                "progress": 0,
                "message": error_msg,
                "error": error_msg
            })

            # Send NTFY notification for job failure (URGENT)
            try:
                ntfy_events.notify_job_failed_sync(
                    job_id=job_id,
                    script_name=script_name,
                    error_message=error_msg
                )
            except Exception as ntfy_error:
                etl_logger.warning(f"Failed to send NTFY job failed notification: {ntfy_error}")

        return result

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        etl_logger.error(f"ETL job {job_id} failed: {e}\n{error_trace}")
        
        # Update job status to FAILED in database
        try:
            update_job_status(
                job_id=job_id,
                status=JobStatus.FAILED,
                error_message=str(e),
                progress=0,
                message=str(e)
            )
        except Exception as db_error:
            etl_logger.warning(f"Failed to update job {job_id} status to FAILED: {db_error}")
        
        emit_job_event(job_id, "job_error", {
            "status": "failed",
            "progress": 0,
            "message": str(e),
            "error": str(e),
            "traceback": error_trace
        })

        # Send NTFY notification for job failure (URGENT)
        try:
            ntfy_events.notify_job_failed_sync(
                job_id=job_id,
                script_name=script_name,
                error_message=str(e)
            )
        except Exception as ntfy_error:
            etl_logger.warning(f"Failed to send NTFY job failed notification: {ntfy_error}")

        raise

    finally:
        # Clean up stop flag and 50% notification tracker
        if job_id in job_stop_flags:
            del job_stop_flags[job_id]
        if job_id in job_50_notified:
            del job_50_notified[job_id]


def emit_job_event(job_id: str, event_type: str, data: Dict[str, Any]):
    """
    Emit Socket.io event for job updates via Redis pub/sub
    Also persists job_log events to the database for historical access.

    Args:
        job_id: Job identifier
        event_type: Event type (job_progress, job_complete, job_error, job_log, batch_progress, row_processed)
        data: Event data
    """
    try:
        import redis
        import json
        from app.core.config import settings
        from app.workers.db_helper import add_job_log

        # Persist log events to database for historical access
        if event_type == "job_log":
            level = data.get("level", "INFO")
            message = data.get("message", "")
            add_job_log(job_id, level, message)

        r = redis.from_url(settings.redis_url)
        # Serialize data as JSON
        message_json = json.dumps({
            'event_type': event_type,
            'data': data
        })
        r.publish(f"job_{job_id}", message_json)
        etl_logger.info(f"Job event: {event_type} for job {job_id}: {data}")
    except Exception as e:
        etl_logger.error(f"Failed to emit job event: {e}")


def cancel_job(job_id: str):
    """
    Cancel a running ETL job
    
    Args:
        job_id: Job identifier to cancel
    """
    job_stop_flags[job_id] = True
    emit_job_event(job_id, "job_progress", {
        "status": "cancelling",
        "progress": 0,
        "message": "Job cancellation requested"
    })

