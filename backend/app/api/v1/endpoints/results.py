"""
ETL Results API Endpoints

Provides access to processed ETL results stored in Snowflake MASTER_PROCESSED_DB.
Replaces Google Sheets as the primary output destination.
"""

from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import io
from datetime import datetime

from app.db.session import get_db
from app.db.models.user import User
from app.db.models.job import ETLJob
from app.api.v1.deps import get_current_user
from app.services.etl.results_service import get_results_service
from app.services.results_cache_service import get_results_cache_service
from app.core.logger import etl_logger

router = APIRouter(prefix="/results", tags=["results"])


class UpdateTableTitleRequest(BaseModel):
    """Request schema for updating table title"""

    title: str = Field(..., min_length=1, max_length=255)


@router.get("/jobs")
async def list_result_jobs(
    limit: int = Query(50, ge=1, le=100), current_user: User = Depends(get_current_user)
):
    """
    List all jobs that have results in MASTER_PROCESSED_DB.
    Returns job_id, job_name, record_count, litigator_count, and last_processed timestamp.
    """
    try:
        results_service = get_results_service()
        jobs = results_service.get_jobs_list(limit=limit)
        return {"jobs": jobs, "total": len(jobs), "message": f"Found {len(jobs)} jobs with results"}
    except Exception as e:
        etl_logger.error(f"Error listing result jobs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list jobs: {str(e)}",
        )


@router.get("/job/{job_id}")
async def get_job_results(
    job_id: str,
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    exclude_litigators: bool = Query(False),
    current_user: User = Depends(get_current_user),
):
    """
    Get paginated results for a specific job.

    Args:
        job_id: The ETL job ID
        offset: Pagination offset
        limit: Maximum records to return (max 1000)
        exclude_litigators: If True, exclude records flagged as litigators
    """
    try:
        results_service = get_results_service()
        results = results_service.get_job_results(
            job_id=job_id, offset=offset, limit=limit, exclude_litigators=exclude_litigators
        )
        return results
    except Exception as e:
        etl_logger.error(f"Error getting job results: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get results: {str(e)}",
        )


@router.get("/by-name/{job_name}")
async def get_results_by_job_name(
    job_name: str,
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    exclude_litigators: bool = Query(False),
    current_user: User = Depends(get_current_user),
):
    """
    Get paginated results filtered by job name (e.g., 'Conventional', 'VA 6 months').

    Args:
        job_name: The job/script name to filter by
        offset: Pagination offset
        limit: Maximum records to return (max 1000)
        exclude_litigators: If True, exclude records flagged as litigators
    """
    try:
        results_service = get_results_service()
        results = results_service.get_job_results(
            job_name=job_name, offset=offset, limit=limit, exclude_litigators=exclude_litigators
        )
        return results
    except Exception as e:
        etl_logger.error(f"Error getting results by name: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get results: {str(e)}",
        )


@router.get("/export/{job_id}")
async def export_job_results_csv(
    job_id: str,
    exclude_litigators: bool = Query(False),
    current_user: User = Depends(get_current_user),
):
    """
    Export job results as CSV file download.

    Args:
        job_id: The ETL job ID
        exclude_litigators: If True, exclude records flagged as litigators
    """
    try:
        results_service = get_results_service()
        df = results_service.export_to_csv(job_id=job_id, exclude_litigators=exclude_litigators)

        if df is None or df.empty:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="No results found for this job"
            )

        # Create CSV in memory
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)

        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"etl_results_{job_id[:8]}_{timestamp}.csv"

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": "text/csv; charset=utf-8",
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        etl_logger.error(f"Error exporting results: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export results: {str(e)}",
        )


@router.get("/export-by-name/{job_name}")
async def export_results_by_name_csv(
    job_name: str,
    exclude_litigators: bool = Query(False),
    current_user: User = Depends(get_current_user),
):
    """
    Export results by job name as CSV file download.

    Args:
        job_name: The job/script name to filter by
        exclude_litigators: If True, exclude records flagged as litigators
    """
    try:
        results_service = get_results_service()
        df = results_service.export_to_csv(job_name=job_name, exclude_litigators=exclude_litigators)

        if df is None or df.empty:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No results found for job name: {job_name}",
            )

        # Create CSV in memory
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)

        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_name = job_name.replace(" ", "_").replace("/", "_")[:30]
        filename = f"etl_results_{safe_name}_{timestamp}.csv"

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": "text/csv; charset=utf-8",
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        etl_logger.error(f"Error exporting results: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export results: {str(e)}",
        )


@router.delete("/job/{job_id}")
async def delete_job_results(job_id: str, current_user: User = Depends(get_current_user)):
    """
    Delete all results for a specific job.
    Requires superuser privileges.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only superusers can delete results"
        )

    try:
        results_service = get_results_service()
        success = results_service.delete_job_results(job_id)

        if success:
            return {"message": f"Results for job {job_id} deleted successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete results"
            )
    except HTTPException:
        raise
    except Exception as e:
        etl_logger.error(f"Error deleting results: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete results: {str(e)}",
        )


@router.get("/stats")
async def get_results_stats(current_user: User = Depends(get_current_user)):
    """
    Get overall statistics for ETL results.
    Returns total records, total jobs, litigator counts, etc.
    """
    try:
        results_service = get_results_service()
        jobs = results_service.get_jobs_list(limit=1000)

        total_records = sum(job.get("RECORD_COUNT", job.get("record_count", 0)) for job in jobs)
        total_litigators = sum(
            job.get("LITIGATOR_COUNT", job.get("litigator_count", 0)) for job in jobs
        )
        total_jobs = len(jobs)

        # Calculate DNC count (records with any phone in DNC)
        total_dnc = sum(
            job.get("DNC_COUNT", job.get("dnc_count", 0)) for job in jobs
        )
        # Records that are BOTH litigator AND DNC
        total_both = sum(
            job.get("BOTH_COUNT", job.get("both_count", 0)) for job in jobs
        )
        # Clean = total - litigators - dnc + both (to avoid double-counting)
        clean_records = total_records - total_litigators - total_dnc + total_both

        return {
            "total_jobs": total_jobs,
            "total_records": total_records,
            "total_litigators": total_litigators,
            "total_dnc": total_dnc,
            "clean_records": clean_records,
            "litigator_percentage": (
                round((total_litigators / total_records * 100), 2) if total_records > 0 else 0
            ),
        }
    except Exception as e:
        etl_logger.error(f"Error getting stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get stats: {str(e)}",
        )


# =====================
# Table ID Endpoints
# =====================


@router.get("/by-table-id/{table_id}")
async def get_results_by_table_id(
    table_id: str,
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    exclude_litigators: bool = Query(False),
    use_cache: bool = Query(True, description="Use PostgreSQL cache if available"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get paginated results by table_id with optional caching.

    Args:
        table_id: The table ID (format: ScriptName_RowCount_DDMMYYYY)
        offset: Pagination offset
        limit: Maximum records to return (max 1000)
        exclude_litigators: If True, exclude records flagged as litigators
        use_cache: If True, use PostgreSQL cache if available
    """
    try:
        # Try cache first if enabled
        if use_cache:
            cache_service = get_results_cache_service()
            cached_results = await cache_service.get_cached_results(
                table_id=table_id, offset=offset, limit=limit, db=db
            )
            if cached_results:
                return cached_results

        # Fall back to Snowflake
        results_service = get_results_service()
        # Query Snowflake by table_id (filtering by job_name that matches table_id pattern)
        results = results_service.get_job_results(
            job_id=None,
            job_name=None,
            offset=offset,
            limit=limit,
            exclude_litigators=exclude_litigators,
        )

        # Filter results by table_id (since Snowflake has table_id column)
        if results and results.get("records"):
            filtered_records = [
                r
                for r in results["records"]
                if r.get("table_id") == table_id or r.get("TABLE_ID") == table_id
            ]
            results["records"] = filtered_records
            results["total"] = len(filtered_records)

        return results
    except Exception as e:
        etl_logger.error(f"Error getting results by table_id: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get results: {str(e)}",
        )


@router.put("/table-title/{table_id}")
async def update_table_title(
    table_id: str,
    request: UpdateTableTitleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update the display title for a table_id.

    Args:
        table_id: The table ID to update
        request: New title for the table
    """
    try:
        # Find the job(s) with this table_id and update the title
        result = await db.execute(select(ETLJob).where(ETLJob.table_id == table_id))
        jobs = result.scalars().all()

        if not jobs:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No job found with table_id: {table_id}",
            )

        # Update all matching jobs
        for job in jobs:
            job.table_title = request.title

        await db.commit()

        return {
            "success": True,
            "message": f"Updated title for {len(jobs)} job(s)",
            "table_id": table_id,
            "new_title": request.title,
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        etl_logger.error(f"Error updating table title: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update title: {str(e)}",
        )


@router.get("/export-utf8/{table_id}")
async def export_results_utf8_csv(
    table_id: str,
    exclude_litigators: bool = Query(False),
    current_user: User = Depends(get_current_user),
):
    """
    Export results by table_id as UTF-8 CSV with BOM for Excel compatibility.

    Args:
        table_id: The table ID to export
        exclude_litigators: If True, exclude records flagged as litigators
    """
    try:
        results_service = get_results_service()

        # Get all results (no pagination for export)
        results = results_service.get_job_results(
            job_id=None,
            job_name=None,
            offset=0,
            limit=100000,  # Large limit for export
            exclude_litigators=exclude_litigators,
        )

        if not results or not results.get("records"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No results found for table_id: {table_id}",
            )

        # Filter by table_id
        filtered_records = [
            r
            for r in results["records"]
            if r.get("table_id") == table_id or r.get("TABLE_ID") == table_id
        ]

        if not filtered_records:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No results found for table_id: {table_id}",
            )

        # Create CSV with UTF-8 BOM for Excel
        output = io.BytesIO()
        # Write UTF-8 BOM
        output.write(b"\xef\xbb\xbf")

        # Get columns from first record
        columns = list(filtered_records[0].keys())
        # Filter out internal columns
        display_columns = [
            c for c in columns if not c.startswith("_") and c not in ["record_id", "RECORD_ID"]
        ]

        # Write header
        header_line = ",".join(display_columns) + "\n"
        output.write(header_line.encode("utf-8"))

        # Write data rows
        for record in filtered_records:
            row_values = []
            for col in display_columns:
                val = record.get(col, "")
                # Handle None and escape quotes
                if val is None:
                    val = ""
                val_str = str(val).replace('"', '""')
                if "," in val_str or '"' in val_str or "\n" in val_str:
                    val_str = f'"{val_str}"'
                row_values.append(val_str)
            row_line = ",".join(row_values) + "\n"
            output.write(row_line.encode("utf-8"))

        output.seek(0)

        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_table_id = table_id.replace(" ", "_").replace("/", "_")[:50]
        filename = f"etl_results_{safe_table_id}_{timestamp}.csv"

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": "text/csv; charset=utf-8",
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        etl_logger.error(f"Error exporting UTF-8 results: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export results: {str(e)}",
        )


@router.get("/cached")
async def list_cached_tables(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    List all currently cached table_ids.
    Returns metadata about each cached table including record counts.
    """
    try:
        cache_service = get_results_cache_service()
        cached_tables = await cache_service.get_cached_table_ids(db)
        return {
            "cached_tables": cached_tables,
            "total": len(cached_tables),
            "message": f"Found {len(cached_tables)} cached tables",
        }
    except Exception as e:
        etl_logger.error(f"Error listing cached tables: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list cached tables: {str(e)}",
        )


@router.delete("/cache/{table_id}")
async def invalidate_cache(
    table_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Invalidate (clear) cache for a specific table_id.
    """
    try:
        cache_service = get_results_cache_service()
        success = await cache_service.invalidate_cache(table_id, db)

        if success:
            return {"message": f"Cache invalidated for table_id: {table_id}"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to invalidate cache",
            )
    except HTTPException:
        raise
    except Exception as e:
        etl_logger.error(f"Error invalidating cache: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to invalidate cache: {str(e)}",
        )
