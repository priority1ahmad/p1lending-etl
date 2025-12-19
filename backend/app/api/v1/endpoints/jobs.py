"""
ETL Jobs endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from uuid import UUID
from datetime import datetime
import pandas as pd
from app.db.session import get_db
from app.db.models.job import ETLJob, JobLog, JobStatus, JobType
from app.db.models.user import User
from app.db.models.sql_script import SQLScript
from app.schemas.job import JobCreate, JobResponse, JobLogResponse, JobPreviewResponse
from app.api.v1.deps import get_current_user
from app.workers.etl_tasks import run_etl_job, cancel_job
from app.services.etl.snowflake_service import SnowflakeConnection
from app.core.logger import etl_logger, get_logs_dir
from app.services.ntfy_service import get_ntfy_events

router = APIRouter(prefix="/jobs", tags=["jobs"])


class JobsListResponse(BaseModel):
    """Jobs list response with metadata"""

    jobs: List[JobResponse]
    message: Optional[str] = None
    max_records: int = 50


@router.get("", response_model=JobsListResponse)
async def list_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=50),  # Max 50 records for storage-saving purposes
    status_filter: Optional[JobStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List ETL jobs with pagination. Limited to 50 records maximum for storage-saving purposes."""
    # Enforce max limit of 50
    effective_limit = min(limit, 50)

    query = select(ETLJob).order_by(desc(ETLJob.created_at))

    if status_filter:
        query = query.where(ETLJob.status == status_filter)

    query = query.offset(skip).limit(effective_limit)

    result = await db.execute(query)
    jobs = result.scalars().all()

    # Add message about 50 record limit for storage-saving purposes
    message = "Only the most recent 50 job records are shown for storage-saving purposes."

    return JobsListResponse(jobs=jobs, message=message, max_records=50)


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get a specific ETL job by ID"""
    result = await db.execute(select(ETLJob).where(ETLJob.id == job_id))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ETL job not found")

    return job


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_data: JobCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create and start a new ETL job"""
    # Validate script
    script_content = None
    script_name = None

    if job_data.script_id:
        result = await db.execute(select(SQLScript).where(SQLScript.id == job_data.script_id))
        script = result.scalar_one_or_none()
        if not script:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="SQL script not found"
            )
        # Clean SQL - remove trailing semicolons that break CTEs/subqueries
        script_content = script.content.rstrip().rstrip(";").strip()
        script_name = script.name
    elif job_data.script_content and job_data.script_name:
        # Clean SQL - remove trailing semicolons that break CTEs/subqueries
        script_content = job_data.script_content.rstrip().rstrip(";").strip()
        script_name = job_data.script_name
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either script_id or script_content+script_name must be provided",
        )

    # Create job record
    job = ETLJob(
        job_type=job_data.job_type,
        script_id=job_data.script_id,
        status=JobStatus.PENDING,
        progress=0,
        row_limit=job_data.row_limit,
        started_by=current_user.id,
    )

    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Check Celery worker availability before starting task
    try:
        from app.workers.celery_app import celery_app

        inspect = celery_app.control.inspect()
        active_workers = inspect.active()
        if not active_workers:
            etl_logger.warning(
                "No active Celery workers found. Task will be queued but may not execute until a worker starts."
            )
    except Exception as e:
        etl_logger.warning(
            f"Could not check Celery worker availability: {e}. Proceeding with task submission."
        )

    # Start Celery task
    try:
        run_etl_job.delay(
            str(job.id),
            str(job_data.script_id) if job_data.script_id else None,
            script_content,
            script_name,
            job_data.row_limit,
        )
    except Exception as e:
        etl_logger.error(f"Failed to start Celery task: {e}")
        job.status = JobStatus.FAILED
        job.error_message = f"Failed to start task: {str(e)}"
        job.completed_at = datetime.utcnow()  # Set completed_at for failed startup
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to start ETL job: {str(e)}. Please ensure Celery worker is running.",
        )

    # Update job status to RUNNING after successfully starting Celery task
    job.status = JobStatus.RUNNING
    job.started_at = datetime.utcnow()

    # Update job with task ID (if needed)
    # job.celery_task_id = task.id
    await db.commit()

    return job


@router.post("/{job_id}/cancel", response_model=JobResponse)
async def cancel_job_endpoint(
    job_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Cancel a running ETL job"""
    result = await db.execute(select(ETLJob).where(ETLJob.id == job_id))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ETL job not found")

    if job.status not in [JobStatus.PENDING, JobStatus.RUNNING]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel job with status {job.status}",
        )

    # Cancel the job
    cancel_job(str(job_id))

    job.status = JobStatus.CANCELLED
    job.message = "Job cancelled by user"
    await db.commit()
    await db.refresh(job)

    return job


@router.get("/{job_id}/logs", response_model=List[JobLogResponse])
async def get_job_logs(
    job_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1, le=10000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get logs for a specific ETL job"""
    # Verify job exists
    result = await db.execute(select(ETLJob).where(ETLJob.id == job_id))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ETL job not found")

    # Get logs
    query = (
        select(JobLog)
        .where(JobLog.job_id == job_id)
        .order_by(JobLog.created_at)
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    logs = result.scalars().all()

    return logs


@router.post("/preview", response_model=List[JobPreviewResponse])
async def preview_jobs(
    script_ids: List[UUID] = Body(..., description="List of script IDs to preview"),
    row_limit: Optional[int] = Query(
        None, ge=1, le=100000, description="Optional row limit to return actual data rows"
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get row count preview for SQL scripts. If row_limit is provided, returns actual row data.
    Always queries Snowflake for the most up-to-date data. Preview logs are saved for historical reference.
    """
    results = []
    preview_jobs_created = []

    # Send NTFY notification for preview initiation
    try:
        ntfy_events = get_ntfy_events()
        scripts_result_for_ntfy = await db.execute(
            select(SQLScript).where(SQLScript.id.in_(script_ids))
        )
        script_names = [s.name for s in scripts_result_for_ntfy.scalars().all()]
        for script_name in script_names:
            await ntfy_events.notify_preview_started(
                script_name=script_name, user_email=current_user.email, row_limit=row_limit
            )
    except Exception as ntfy_error:
        etl_logger.warning(f"Failed to send NTFY preview notification: {ntfy_error}")

    try:
        # Batch load all scripts in one query
        scripts_result = await db.execute(select(SQLScript).where(SQLScript.id.in_(script_ids)))
        scripts_dict = {script.id: script for script in scripts_result.scalars().all()}

        # Always query Snowflake for fresh data - no caching
        scripts_to_query = list(script_ids)

        # Connect to Snowflake once for all scripts
        snowflake_conn = None

        # Process scripts that need Snowflake queries
        for script_id in scripts_to_query:
            # Create a job record for this preview request
            preview_job = ETLJob(
                job_type=JobType.PREVIEW.value,  # Use enum value (string) to bypass name conversion issue
                script_id=script_id,
                status=JobStatus.RUNNING,
                progress=0,
                row_limit=row_limit,
                started_by=current_user.id,
                started_at=datetime.utcnow(),
                message="Initializing preview...",
            )
            db.add(preview_job)
            await db.flush()  # Flush to get the job ID
            preview_jobs_created.append(preview_job)

            # Get script from batch-loaded dict
            script = scripts_dict.get(script_id)

            if not script:
                results.append(JobPreviewResponse(script_name="Unknown", row_count=0, rows=None))
                preview_job.status = JobStatus.FAILED
                preview_job.error_message = "Script not found"
                preview_job.completed_at = datetime.utcnow()
                await db.commit()
                continue

            # Update status: Connecting to Snowflake (only if not already connected)
            if snowflake_conn is None:
                preview_job.message = "Connecting to Snowflake..."
                preview_job.progress = 10
                await db.commit()

                # Connect to Snowflake
                snowflake_conn = SnowflakeConnection()
                if not snowflake_conn.connect():
                    preview_job.status = JobStatus.FAILED
                    preview_job.error_message = "Failed to connect to Snowflake"
                    preview_job.completed_at = datetime.utcnow()
                    await db.commit()
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="Failed to connect to Snowflake",
                    )
            else:
                preview_job.message = "Preparing query..."
                preview_job.progress = 10
                await db.commit()

            # Update status: Executing SQL
            preview_job.message = "Executing SQL query..."
            preview_job.progress = 30
            await db.commit()

            # Clean the SQL query - remove trailing semicolon and whitespace
            cleaned_sql = script.content.rstrip().rstrip(";").strip()

            # If row_limit is provided, get actual data rows
            if row_limit:
                # Execute query with LIMIT
                query_with_limit = f"{cleaned_sql} LIMIT {row_limit}"
                preview_job.message = f"Executing SQL query (fetching {row_limit} rows)..."
                preview_job.progress = 50
                await db.commit()

                data_result = snowflake_conn.execute_query(query_with_limit)

                row_count = 0
                rows_data = None

                if data_result is not None and not data_result.empty:
                    row_count = len(data_result)
                    # Convert DataFrame to list of dictionaries using records orientation
                    try:
                        rows_data = data_result.to_dict(orient="records")
                    except Exception as e:
                        etl_logger.error(f"Error converting DataFrame to dict: {e}")
                        rows_data = []

                    # Convert any non-serializable types to JSON-serializable types
                    for row in rows_data:
                        for key, value in row.items():
                            try:
                                if value is None:
                                    row[key] = None
                                elif isinstance(value, float) and pd.isna(value):
                                    row[key] = None
                                elif isinstance(value, (int, float, str, bool)):
                                    row[key] = value
                                elif isinstance(value, (pd.Timestamp, datetime)):
                                    row[key] = (
                                        value.isoformat()
                                        if hasattr(value, "isoformat")
                                        else str(value)
                                    )
                                elif isinstance(value, (list, dict)):
                                    # Recursively clean nested structures
                                    if isinstance(value, list):
                                        row[key] = [
                                            (
                                                str(v)
                                                if not isinstance(
                                                    v, (int, float, str, bool, type(None))
                                                )
                                                else v
                                            )
                                            for v in value
                                        ]
                                    else:
                                        row[key] = {
                                            k: (
                                                str(v)
                                                if not isinstance(
                                                    v, (int, float, str, bool, type(None))
                                                )
                                                else v
                                            )
                                            for k, v in value.items()
                                        }
                                else:
                                    row[key] = str(value)
                            except Exception as e:
                                # If conversion fails, just use string representation
                                etl_logger.warning(f"Error converting value for key {key}: {e}")
                                row[key] = str(value) if value is not None else None
                else:
                    rows_data = []

                # Get total count
                preview_job.message = "Getting total row count..."
                preview_job.progress = 70
                await db.commit()

                count_query = f"SELECT COUNT(*) as count FROM ({cleaned_sql}) as subquery"
                count_result = snowflake_conn.execute_query(count_query)
                total_rows = row_count  # Default to row_count if COUNT fails
                if count_result is not None and not count_result.empty:
                    row = count_result.iloc[0]
                    if "count" in row:
                        total_rows = int(row["count"])
                    elif "COUNT" in row:
                        total_rows = int(row["COUNT"])
                    else:
                        total_rows = int(row.iloc[0])

                # Check against PERSON_CACHE for filtering (execute full query like old app for accuracy)
                preview_job.message = "Checking processed records..."
                preview_job.progress = 80
                await db.commit()

                already_processed = 0
                unprocessed = total_rows

                # Execute the FULL query to get accurate filtering count (like old app)
                # This matches the old app's behavior which prioritizes accuracy
                try:
                    # Execute the full query (no LIMIT) - same as old app
                    full_df = snowflake_conn.execute_query(cleaned_sql)

                    if full_df is not None and not full_df.empty:
                        # Find the Address column (flexible matching)
                        address_column = None
                        for col in full_df.columns:
                            if "address" in col.lower():
                                address_column = col
                                break

                        if address_column:
                            etl_logger.info(
                                f"Using address column: '{address_column}' for preview filtering"
                            )

                            # First, check if PERSON_CACHE has any data at all
                            count_query = """
                            SELECT COUNT(*) as total_count,
                                   COUNT(DISTINCT "address") as distinct_addresses,
                                   COUNT(DISTINCT UPPER(TRIM("address"))) as distinct_normalized_addresses
                            FROM PROCESSED_DATA_DB.PUBLIC.PERSON_CACHE
                            WHERE "address" IS NOT NULL AND "address" != ''
                            """
                            count_result = snowflake_conn.execute_query(count_query)
                            if count_result is not None and not count_result.empty:
                                total_count = (
                                    int(count_result.iloc[0]["total_count"])
                                    if "total_count" in count_result.columns
                                    else 0
                                )
                                distinct_addresses = (
                                    int(count_result.iloc[0]["distinct_addresses"])
                                    if "distinct_addresses" in count_result.columns
                                    else 0
                                )
                                distinct_normalized = (
                                    int(count_result.iloc[0]["distinct_normalized_addresses"])
                                    if "distinct_normalized_addresses" in count_result.columns
                                    else 0
                                )
                                etl_logger.info(
                                    f"PERSON_CACHE stats: {total_count:,} total rows, {distinct_addresses:,} distinct addresses, {distinct_normalized:,} distinct normalized addresses"
                                )

                            # Query Snowflake for cached addresses
                            cache_query = """
                            SELECT DISTINCT UPPER(TRIM("address")) as cached_address
                            FROM PROCESSED_DATA_DB.PUBLIC.PERSON_CACHE
                            WHERE "address" IS NOT NULL AND "address" != ''
                            """
                            etl_logger.info("Querying PERSON_CACHE for cached addresses...")
                            cache_result = snowflake_conn.execute_query(cache_query)

                            cached_addresses = set()
                            if cache_result is not None and not cache_result.empty:
                                # Handle case-insensitive column name matching
                                cache_col = None
                                for col in cache_result.columns:
                                    if col.lower() == "cached_address":
                                        cache_col = col
                                        break

                                if cache_col:
                                    cached_addresses = set(
                                        cache_result[cache_col].str.upper().str.strip().tolist()
                                    )
                                    etl_logger.info(
                                        f"Found {len(cached_addresses):,} unique cached addresses in PERSON_CACHE"
                                    )
                                else:
                                    etl_logger.warning(
                                        f"Could not find cached_address column. Available columns: {list(cache_result.columns)}"
                                    )
                            else:
                                etl_logger.warning(
                                    "PERSON_CACHE query returned no results - cache may be empty or query failed"
                                )

                            # Count processed records (exact count, not estimation)
                            processed_count = 0
                            sample_addresses_checked = []
                            sample_matches = []

                            for idx, (_, row) in enumerate(full_df.iterrows()):
                                address = (
                                    str(row[address_column]).upper().strip()
                                    if pd.notna(row[address_column])
                                    else ""
                                )

                                # Collect sample addresses for logging
                                if idx < 5 and address:
                                    sample_addresses_checked.append(address)

                                if address and address in cached_addresses:
                                    processed_count += 1
                                    if len(sample_matches) < 3:
                                        sample_matches.append(address)

                            already_processed = processed_count
                            unprocessed = len(full_df) - already_processed

                            etl_logger.info(
                                f"Preview check: {len(full_df):,} total, {already_processed:,} already processed, {unprocessed:,} new"
                            )
                            if sample_addresses_checked:
                                etl_logger.info(
                                    f"Sample addresses checked: {', '.join(sample_addresses_checked[:3])}"
                                )
                            if sample_matches:
                                etl_logger.info(
                                    f"Sample matched addresses: {', '.join(sample_matches[:3])}"
                                )
                        else:
                            etl_logger.warning(
                                f"No Address column found in query results. Available columns: {list(full_df.columns)}"
                            )
                    else:
                        etl_logger.warning("Full query returned no results")

                except Exception as e:
                    import traceback

                    etl_logger.error(f"Error checking PERSON_CACHE in preview: {e}")
                    etl_logger.error(f"Traceback: {traceback.format_exc()}")
                    # If filtering fails, assume all are unprocessed
                    already_processed = 0
                    unprocessed = total_rows

                # Ensure rows_data is a list (not None) for serialization
                if rows_data is None:
                    rows_data = []

                try:
                    preview_result = JobPreviewResponse(
                        script_name=script.name,
                        row_count=total_rows,  # For backward compatibility
                        total_rows=total_rows,
                        already_processed=already_processed,
                        unprocessed=unprocessed,
                        rows=rows_data if rows_data else None,
                    )
                    results.append(preview_result)
                    # Update the preview job with results and save preview data for logging
                    preview_job.total_rows_processed = total_rows
                    preview_job.message = f"Preview: {total_rows} total, {already_processed} already processed, {unprocessed} new"
                    preview_job.progress = 90
                    await db.commit()

                    preview_job.message = (
                        f"Preview completed: {total_rows} total rows ({unprocessed} new to process)"
                    )
                    # Save preview data for historical logging (not used for caching)
                    preview_job.preview_data = {
                        "script_name": script.name,
                        "row_count": total_rows,
                        "total_rows": total_rows,
                        "already_processed": already_processed,
                        "unprocessed": unprocessed,
                        "rows": rows_data if rows_data else None,
                    }
                except Exception as e:
                    etl_logger.error(f"Error creating JobPreviewResponse: {e}")
                    # Fallback: return without rows
                    preview_result = JobPreviewResponse(
                        script_name=script.name,
                        row_count=total_rows,
                        total_rows=total_rows,
                        already_processed=already_processed,
                        unprocessed=unprocessed,
                        rows=None,
                    )
                    results.append(preview_result)
                    preview_job.total_rows_processed = total_rows
                    preview_job.message = f"Preview: {total_rows} total, {already_processed} already processed, {unprocessed} new"
                    preview_job.progress = 90
                    await db.commit()

                    preview_job.message = (
                        f"Preview completed: {total_rows} total rows ({unprocessed} new to process)"
                    )
                    # Save preview data for historical logging (not used for caching)
                    preview_job.preview_data = {
                        "script_name": script.name,
                        "row_count": total_rows,
                        "total_rows": total_rows,
                        "already_processed": already_processed,
                        "unprocessed": unprocessed,
                        "rows": None,
                    }
            else:
                # No row_limit - get total count and check filtering
                preview_job.message = "Executing COUNT query..."
                preview_job.progress = 50
                await db.commit()

                count_query = f"SELECT COUNT(*) as count FROM ({cleaned_sql}) as subquery"
                count_result = snowflake_conn.execute_query(count_query)

                total_rows = 0
                if count_result is not None and not count_result.empty:
                    row = count_result.iloc[0]
                    if "count" in row:
                        total_rows = int(row["count"])
                    elif "COUNT" in row:
                        total_rows = int(row["COUNT"])
                    else:
                        total_rows = int(row.iloc[0])

                # Check against PERSON_CACHE using FULL query execution (like old app for accuracy)
                already_processed = 0
                unprocessed = total_rows

                if total_rows > 0:
                    preview_job.message = "Checking processed records..."
                    preview_job.progress = 70
                    await db.commit()

                    try:
                        # Execute the FULL query (no sampling, like old app)
                        full_df = snowflake_conn.execute_query(cleaned_sql)

                        if full_df is not None and not full_df.empty:
                            # Find the Address column
                            address_column = None
                            for col in full_df.columns:
                                if "address" in col.lower():
                                    address_column = col
                                    break

                            if address_column:
                                etl_logger.info(
                                    f"Using address column: '{address_column}' for preview filtering"
                                )

                                # First, check if PERSON_CACHE has any data at all
                                count_query = """
                                SELECT COUNT(*) as total_count,
                                       COUNT(DISTINCT "address") as distinct_addresses,
                                       COUNT(DISTINCT UPPER(TRIM("address"))) as distinct_normalized_addresses
                                FROM PROCESSED_DATA_DB.PUBLIC.PERSON_CACHE
                                WHERE "address" IS NOT NULL AND "address" != ''
                                """
                                count_result = snowflake_conn.execute_query(count_query)
                                if count_result is not None and not count_result.empty:
                                    total_count = (
                                        int(count_result.iloc[0]["total_count"])
                                        if "total_count" in count_result.columns
                                        else 0
                                    )
                                    distinct_addresses = (
                                        int(count_result.iloc[0]["distinct_addresses"])
                                        if "distinct_addresses" in count_result.columns
                                        else 0
                                    )
                                    distinct_normalized = (
                                        int(count_result.iloc[0]["distinct_normalized_addresses"])
                                        if "distinct_normalized_addresses" in count_result.columns
                                        else 0
                                    )
                                    etl_logger.info(
                                        f"PERSON_CACHE stats: {total_count:,} total rows, {distinct_addresses:,} distinct addresses, {distinct_normalized:,} distinct normalized addresses"
                                    )

                                # Query Snowflake for cached addresses
                                cache_query = """
                                SELECT DISTINCT UPPER(TRIM("address")) as cached_address
                                FROM PROCESSED_DATA_DB.PUBLIC.PERSON_CACHE
                                WHERE "address" IS NOT NULL AND "address" != ''
                                """
                                etl_logger.info("Querying PERSON_CACHE for cached addresses...")
                                cache_result = snowflake_conn.execute_query(cache_query)

                                cached_addresses = set()
                                if cache_result is not None and not cache_result.empty:
                                    # Handle case-insensitive column name matching
                                    cache_col = None
                                    for col in cache_result.columns:
                                        if col.lower() == "cached_address":
                                            cache_col = col
                                            break

                                    if cache_col:
                                        cached_addresses = set(
                                            cache_result[cache_col].str.upper().str.strip().tolist()
                                        )
                                        etl_logger.info(
                                            f"Found {len(cached_addresses):,} unique cached addresses in PERSON_CACHE"
                                        )
                                    else:
                                        etl_logger.warning(
                                            f"Could not find cached_address column. Available columns: {list(cache_result.columns)}"
                                        )
                                else:
                                    etl_logger.warning(
                                        "PERSON_CACHE query returned no results - cache may be empty or query failed"
                                    )

                                # Count processed records (exact count, not estimation)
                                processed_count = 0
                                sample_addresses_checked = []
                                sample_matches = []

                                for idx, (_, row) in enumerate(full_df.iterrows()):
                                    address = (
                                        str(row[address_column]).upper().strip()
                                        if pd.notna(row[address_column])
                                        else ""
                                    )

                                    # Collect sample addresses for logging
                                    if idx < 5 and address:
                                        sample_addresses_checked.append(address)

                                    if address and address in cached_addresses:
                                        processed_count += 1
                                        if len(sample_matches) < 3:
                                            sample_matches.append(address)

                                already_processed = processed_count
                                unprocessed = len(full_df) - already_processed

                                etl_logger.info(
                                    f"Preview check: {len(full_df):,} total, {already_processed:,} already processed, {unprocessed:,} new"
                                )
                                if sample_addresses_checked:
                                    etl_logger.info(
                                        f"Sample addresses checked: {', '.join(sample_addresses_checked[:3])}"
                                    )
                                if sample_matches:
                                    etl_logger.info(
                                        f"Sample matched addresses: {', '.join(sample_matches[:3])}"
                                    )
                            else:
                                etl_logger.warning(
                                    f"No Address column found in query results. Available columns: {list(full_df.columns)}"
                                )
                        else:
                            etl_logger.warning("Full query returned no results")

                    except Exception as e:
                        import traceback

                        etl_logger.error(f"Error checking PERSON_CACHE in preview: {e}")
                        etl_logger.error(f"Traceback: {traceback.format_exc()}")
                        # If filtering fails, assume all are unprocessed
                        already_processed = 0
                        unprocessed = total_rows

                preview_result = JobPreviewResponse(
                    script_name=script.name,
                    row_count=total_rows,  # For backward compatibility
                    total_rows=total_rows,
                    already_processed=already_processed,
                    unprocessed=unprocessed,
                    rows=None,
                )
                results.append(preview_result)
                # Update the preview job with results and save preview data for logging
                preview_job.total_rows_processed = total_rows
                preview_job.message = f"Preview: {total_rows} total, {already_processed} already processed, {unprocessed} new"
                preview_job.progress = 90
                await db.commit()

                preview_job.message = (
                    f"Preview completed: {total_rows} total rows ({unprocessed} new to process)"
                )
                # Save preview data for historical logging (not used for caching)
                preview_job.preview_data = {
                    "script_name": script.name,
                    "row_count": total_rows,
                    "total_rows": total_rows,
                    "already_processed": already_processed,
                    "unprocessed": unprocessed,
                    "rows": None,
                }

            # Mark preview job as completed
            preview_job.status = JobStatus.COMPLETED
            preview_job.progress = 100
            preview_job.completed_at = datetime.utcnow()
            await db.commit()

        # Disconnect from Snowflake after processing all scripts
        if snowflake_conn:
            snowflake_conn.disconnect()

    except Exception as e:
        import traceback

        error_trace = traceback.format_exc()
        etl_logger.error(f"Error in preview endpoint: {str(e)}\n{error_trace}")

        # Mark preview jobs as failed
        for preview_job in preview_jobs_created:
            preview_job.status = JobStatus.FAILED
            preview_job.error_message = str(e)
            preview_job.completed_at = datetime.utcnow()
        try:
            await db.commit()
        except Exception:
            pass  # Ignore commit errors if we're already in an error state

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting preview: {str(e)}",
        )

    finally:
        # Ensure all preview jobs are marked as either COMPLETED or FAILED
        # This is a safety net in case any preview job is still in RUNNING state
        for preview_job in preview_jobs_created:
            if preview_job.status == JobStatus.RUNNING:
                # If still running, mark as completed (no error occurred if we got here)
                preview_job.status = JobStatus.COMPLETED
                preview_job.progress = 100
                if preview_job.completed_at is None:
                    preview_job.completed_at = datetime.utcnow()
            # Ensure completed_at is set for all terminal states
            if (
                preview_job.status in [JobStatus.COMPLETED, JobStatus.FAILED]
                and preview_job.completed_at is None
            ):
                preview_job.completed_at = datetime.utcnow()

        # Commit any final status updates
        try:
            await db.commit()
        except Exception as commit_error:
            etl_logger.warning(f"Failed to commit final preview job statuses: {commit_error}")

    return results


@router.get("/{job_id}/stats")
async def get_job_stats(
    job_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get statistics for a completed job"""
    result = await db.execute(select(ETLJob).where(ETLJob.id == job_id))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ETL job not found")

    return {
        "job_id": str(job.id),
        "script_name": job.preview_data.get("script_name") if job.preview_data else None,
        "total_rows_processed": job.total_rows_processed or 0,
        "dnc_count": job.dnc_count or 0,
        "litigator_count": job.litigator_count or 0,
        "both_count": job.both_count or 0,
        "clean_count": job.clean_count or 0,
        "status": job.status,
        "progress": job.progress,
        "started_at": job.started_at.isoformat() if job.started_at else None,
        "completed_at": job.completed_at.isoformat() if job.completed_at else None,
    }


@router.get("/{job_id}/logfile")
async def get_job_logfile(
    job_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get log file content for a job"""

    result = await db.execute(select(ETLJob).where(ETLJob.id == job_id))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ETL job not found")

    # Log files are stored in backend/logs/jobs/{job_id}.log
    log_dir = get_logs_dir()
    log_file = log_dir / f"{job_id}.log"

    if not log_file.exists():
        # Return empty content if log file doesn't exist yet
        return {"job_id": str(job.id), "content": "", "exists": False}

    try:
        with open(log_file, "r", encoding="utf-8") as f:
            content = f.read()

        return {
            "job_id": str(job.id),
            "content": content,
            "exists": True,
            "size": len(content),
            "lines": content.count("\n") + 1,
        }
    except Exception as e:
        etl_logger.error(f"Error reading log file for job {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reading log file: {str(e)}",
        )
