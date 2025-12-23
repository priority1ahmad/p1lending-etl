"""
Celery tasks for ETL job execution
"""

import time
from typing import Optional, Dict, Any
from app.workers.celery_app import celery_app
from app.services.etl.engine import ETLEngine
from app.core.logger import etl_logger
from app.workers.db_helper import update_job_status, update_job_table_id
from app.db.models.job import JobStatus
from app.services.ntfy_service import get_ntfy_events
from app.services.table_id_service import get_table_id_service

# Global stop flags for jobs
job_stop_flags: Dict[str, bool] = {}

# Track progress milestones to avoid duplicate NTFY notifications
job_progress_milestones: Dict[str, set] = {}


@celery_app.task(bind=True, name="app.workers.etl_tasks.run_etl_job")
def run_etl_job(
    self,
    job_id: str,
    script_id: Optional[str],
    script_content: Optional[str] = None,
    script_name: Optional[str] = None,
    limit_rows: Optional[int] = None,
    table_id: Optional[str] = None,
    table_title: Optional[str] = None,
    file_path: Optional[str] = None,
    file_source_id: Optional[str] = None,
    file_upload_id: Optional[str] = None,
):
    """
    Execute ETL job as Celery task (supports both Snowflake and file-based sources)

    Args:
        job_id: Unique job identifier
        script_id: SQL script ID (optional, for Snowflake jobs)
        script_content: SQL script content (optional, for Snowflake jobs)
        script_name: SQL script name or file name
        limit_rows: Row limit (optional)
        table_id: Optional table ID (generated if not provided)
        table_title: Optional custom title for results
        file_path: Path to uploaded file (optional, for file-based jobs)
        file_source_id: FileSource UUID (optional, for file-based jobs)
        file_upload_id: FileUpload UUID (optional, for file-based jobs)
    """
    # Initialize stop flag and progress milestone tracker
    job_stop_flags[job_id] = False
    job_progress_milestones[job_id] = (
        set()
    )  # Track which milestones (20, 40, 60, 80) have been notified
    start_time = time.time()

    # Generate table_id if not provided
    if not table_id:
        table_id_service = get_table_id_service()
        table_id = table_id_service.generate_table_id_sync(
            script_name=script_name,
            row_count=limit_rows or 0,
            existing_count=0,  # Will be calculated properly in async context
        )
        etl_logger.info(f"Generated table_id for job {job_id}: {table_id}")

    # Update job record with table_id
    try:
        update_job_table_id(job_id, table_id, table_title)
    except Exception as e:
        etl_logger.warning(f"Failed to update job {job_id} with table_id: {e}")

    def stop_flag():
        return job_stop_flags.get(job_id, False)

    # Get NTFY service for notifications
    ntfy_events = get_ntfy_events()

    try:
        # Emit job started event
        emit_job_event(
            job_id,
            "job_progress",
            {
                "status": "running",
                "progress": 0,
                "message": "ETL job started",
                "current_row": 0,
                "total_rows": 0,
                "rows_remaining": 0,
                "current_batch": 0,
                "total_batches": 0,
            },
        )

        # Send NTFY notification for job start
        try:
            ntfy_events.notify_job_started_sync(
                job_id=job_id,
                script_name=script_name,
                user_email="system",  # User email not available in task context
                row_limit=limit_rows,
            )
        except Exception as ntfy_error:
            etl_logger.warning(f"Failed to send NTFY job start notification: {ntfy_error}")

        # Update job status to RUNNING in database
        try:
            update_job_status(
                job_id=job_id, status=JobStatus.RUNNING, progress=0, message="ETL job started"
            )
        except Exception as db_error:
            etl_logger.warning(f"Failed to update job {job_id} status to RUNNING: {db_error}")

        # Create log callback to emit logs via WebSocket
        def log_callback(level: str, message: str):
            """Callback to emit logs via WebSocket"""
            emit_job_event(job_id, "job_log", {"level": level, "message": message})

        # Initialize ETL engine with job_id, log callback, and table_id
        engine = ETLEngine(
            job_id=job_id, log_callback=log_callback, table_id=table_id, table_title=table_title
        )

        # Store row data for row_processed events

        # Smart row emission: track if first row has been emitted
        first_row_emitted = False

        # Track start time for ETA calculation

        # Create progress callback
        def progress_callback(
            current_row,
            total_rows,
            current_batch,
            total_batches,
            percentage,
            message,
            row_data=None,
        ):
            """Progress callback that emits events with time estimates"""
            rows_remaining = total_rows - current_row if total_rows > 0 else 0

            # Calculate time estimates
            elapsed_time = time.time() - start_time
            if current_row > 0 and elapsed_time > 0:
                rows_per_second = current_row / elapsed_time
                estimated_remaining_seconds = (
                    rows_remaining / rows_per_second if rows_per_second > 0 else 0
                )

                # Format time remaining
                if estimated_remaining_seconds < 60:
                    time_remaining = f"{int(estimated_remaining_seconds)}s"
                elif estimated_remaining_seconds < 3600:
                    time_remaining = f"{int(estimated_remaining_seconds / 60)}m {int(estimated_remaining_seconds % 60)}s"
                else:
                    hours = int(estimated_remaining_seconds / 3600)
                    minutes = int((estimated_remaining_seconds % 3600) / 60)
                    time_remaining = f"{hours}h {minutes}m"
            else:
                time_remaining = "Calculating..."

            emit_job_event(
                job_id,
                "job_progress",
                {
                    "status": "running",
                    "progress": percentage,
                    "message": message,
                    "current_row": current_row,
                    "total_rows": total_rows,
                    "rows_remaining": rows_remaining,
                    "current_batch": current_batch,
                    "total_batches": total_batches,
                    "time_remaining": time_remaining,
                    "elapsed_time": int(elapsed_time),
                },
            )

            # Also emit batch progress event
            if current_batch > 0:
                emit_job_event(
                    job_id,
                    "batch_progress",
                    {
                        "current_batch": current_batch,
                        "total_batches": total_batches,
                        "batch_start_row": (current_batch - 1) * 200 + 1,
                        "batch_end_row": min(current_batch * 200, total_rows),
                        "message": f"Processing batch {current_batch}/{total_batches}",
                    },
                )

            # Smart row emission: first row immediately, then every 5 rows
            if row_data:
                nonlocal first_row_emitted
                should_emit = False

                # Always emit first row for immediate UI feedback
                if not first_row_emitted:
                    should_emit = True
                    first_row_emitted = True
                # After first row, emit every 5 rows
                elif current_row > 0 and current_row % 5 == 0:
                    should_emit = True

                if should_emit:
                    emit_job_event(
                        job_id,
                        "row_processed",
                        {
                            "row_data": row_data,
                            "row_number": current_row,
                            "total_rows": total_rows,
                            "batch": current_batch,
                        },
                    )

            # Send NTFY notification at 20% milestones (20, 40, 60, 80)
            milestones = [20, 40, 60, 80]
            for milestone in milestones:
                if percentage >= milestone and milestone not in job_progress_milestones.get(
                    job_id, set()
                ):
                    job_progress_milestones.setdefault(job_id, set()).add(milestone)
                    try:
                        ntfy_events.notify_job_progress_sync(
                            job_id=job_id,
                            progress=milestone,
                            current_row=current_row,
                            total_rows=total_rows,
                            script_name=script_name,
                        )
                    except Exception as ntfy_error:
                        etl_logger.warning(
                            f"Failed to send NTFY progress notification: {ntfy_error}"
                        )

        # Execute ETL job (either Snowflake-based or file-based)
        if file_path and file_source_id:
            # File-based execution
            etl_logger.info(f"Executing file-based ETL job {job_id} with file: {file_path}")
            result = engine.execute_with_file_source(
                file_path=file_path,
                file_source_id=file_source_id,
                file_name=script_name,
                limit_rows=limit_rows,
                stop_flag=stop_flag,
                progress_callback=progress_callback,
            )
        else:
            # Snowflake-based execution
            etl_logger.info(f"Executing Snowflake-based ETL job {job_id}")
            result = engine.execute_single_script(
                script_content=script_content,
                script_name=script_name,
                limit_rows=limit_rows,
                stop_flag=stop_flag,
                progress_callback=progress_callback,
            )

        # Emit completion event
        if result.get("success"):
            # Update job status to COMPLETED in database
            try:
                update_job_status(
                    job_id=job_id,
                    status=JobStatus.COMPLETED,
                    progress=100,
                    message="ETL job completed successfully",
                    total_rows_processed=result.get("rows_processed", 0),
                    litigator_count=result.get("litigator_count", 0),
                    dnc_count=result.get("dnc_count", 0),
                    both_count=result.get("both_count", 0),
                    clean_count=result.get("clean_count", 0),
                )
            except Exception as db_error:
                etl_logger.warning(f"Failed to update job {job_id} status to COMPLETED: {db_error}")

            emit_job_event(
                job_id,
                "job_complete",
                {
                    "status": "completed",
                    "progress": 100,
                    "message": "ETL job completed successfully",
                    "rows_processed": result.get("rows_processed", 0),
                    "litigator_count": result.get("litigator_count", 0),
                    "dnc_count": result.get("dnc_count", 0),
                    "both_count": result.get("both_count", 0),
                    "clean_count": result.get("clean_count", 0),
                },
            )

            # Send NTFY notification for job completion
            try:
                duration = time.time() - start_time
                ntfy_events.notify_job_completed_sync(
                    job_id=job_id,
                    script_name=script_name,
                    total_rows=result.get("rows_processed", 0),
                    clean_count=result.get("clean_count", 0),
                    litigator_count=result.get("litigator_count", 0),
                    dnc_count=result.get("dnc_count", 0),
                    duration_seconds=duration,
                    both_count=result.get("both_count", 0),
                )
            except Exception as ntfy_error:
                etl_logger.warning(f"Failed to send NTFY job complete notification: {ntfy_error}")
        else:
            # Update job status to FAILED in database
            error_msg = result.get("error_message", "Unknown error")
            try:
                update_job_status(
                    job_id=job_id,
                    status=JobStatus.FAILED,
                    error_message=error_msg,
                    progress=0,
                    message=error_msg,
                )
            except Exception as db_error:
                etl_logger.warning(f"Failed to update job {job_id} status to FAILED: {db_error}")

            emit_job_event(
                job_id,
                "job_error",
                {"status": "failed", "progress": 0, "message": error_msg, "error": error_msg},
            )

            # Send NTFY notification for job failure (URGENT)
            try:
                ntfy_events.notify_job_failed_sync(
                    job_id=job_id, script_name=script_name, error_message=error_msg
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
                message=str(e),
            )
        except Exception as db_error:
            etl_logger.warning(f"Failed to update job {job_id} status to FAILED: {db_error}")

        emit_job_event(
            job_id,
            "job_error",
            {
                "status": "failed",
                "progress": 0,
                "message": str(e),
                "error": str(e),
                "traceback": error_trace,
            },
        )

        # Send NTFY notification for job failure (URGENT)
        try:
            ntfy_events.notify_job_failed_sync(
                job_id=job_id, script_name=script_name, error_message=str(e)
            )
        except Exception as ntfy_error:
            etl_logger.warning(f"Failed to send NTFY job failed notification: {ntfy_error}")

        raise

    finally:
        # Clean up temp file if this was a file-based job
        if file_path:
            try:
                import os

                if os.path.exists(file_path):
                    os.remove(file_path)
                    etl_logger.info(f"Cleaned up temp file: {file_path}")
            except Exception as cleanup_error:
                etl_logger.warning(f"Failed to clean up temp file {file_path}: {cleanup_error}")

        # Clean up stop flag and progress milestone tracker
        if job_id in job_stop_flags:
            del job_stop_flags[job_id]
        if job_id in job_progress_milestones:
            del job_progress_milestones[job_id]


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
        message_json = json.dumps({"event_type": event_type, "data": data})
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
    emit_job_event(
        job_id,
        "job_progress",
        {"status": "cancelling", "progress": 0, "message": "Job cancellation requested"},
    )
