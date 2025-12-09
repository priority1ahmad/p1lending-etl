"""
ETL Results API Endpoints

Provides access to processed ETL results stored in Snowflake MASTER_PROCESSED_DB.
Replaces Google Sheets as the primary output destination.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import io
import csv
from datetime import datetime

from app.db.session import get_db
from app.db.models.user import User
from app.api.v1.deps import get_current_user
from app.services.etl.results_service import get_results_service
from app.core.logger import etl_logger

router = APIRouter(prefix="/results", tags=["results"])


@router.get("/jobs")
async def list_result_jobs(
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """
    List all jobs that have results in MASTER_PROCESSED_DB.
    Returns job_id, job_name, record_count, litigator_count, and last_processed timestamp.
    """
    try:
        results_service = get_results_service()
        jobs = results_service.get_jobs_list(limit=limit)
        return {
            "jobs": jobs,
            "total": len(jobs),
            "message": f"Found {len(jobs)} jobs with results"
        }
    except Exception as e:
        etl_logger.error(f"Error listing result jobs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list jobs: {str(e)}"
        )


@router.get("/job/{job_id}")
async def get_job_results(
    job_id: str,
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    exclude_litigators: bool = Query(False),
    current_user: User = Depends(get_current_user)
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
            job_id=job_id,
            offset=offset,
            limit=limit,
            exclude_litigators=exclude_litigators
        )
        return results
    except Exception as e:
        etl_logger.error(f"Error getting job results: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get results: {str(e)}"
        )


@router.get("/by-name/{job_name}")
async def get_results_by_job_name(
    job_name: str,
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    exclude_litigators: bool = Query(False),
    current_user: User = Depends(get_current_user)
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
            job_name=job_name,
            offset=offset,
            limit=limit,
            exclude_litigators=exclude_litigators
        )
        return results
    except Exception as e:
        etl_logger.error(f"Error getting results by name: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get results: {str(e)}"
        )


@router.get("/export/{job_id}")
async def export_job_results_csv(
    job_id: str,
    exclude_litigators: bool = Query(False),
    current_user: User = Depends(get_current_user)
):
    """
    Export job results as CSV file download.

    Args:
        job_id: The ETL job ID
        exclude_litigators: If True, exclude records flagged as litigators
    """
    try:
        results_service = get_results_service()
        df = results_service.export_to_csv(
            job_id=job_id,
            exclude_litigators=exclude_litigators
        )

        if df is None or df.empty:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No results found for this job"
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
                "Content-Type": "text/csv; charset=utf-8"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        etl_logger.error(f"Error exporting results: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export results: {str(e)}"
        )


@router.get("/export-by-name/{job_name}")
async def export_results_by_name_csv(
    job_name: str,
    exclude_litigators: bool = Query(False),
    current_user: User = Depends(get_current_user)
):
    """
    Export results by job name as CSV file download.

    Args:
        job_name: The job/script name to filter by
        exclude_litigators: If True, exclude records flagged as litigators
    """
    try:
        results_service = get_results_service()
        df = results_service.export_to_csv(
            job_name=job_name,
            exclude_litigators=exclude_litigators
        )

        if df is None or df.empty:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No results found for job name: {job_name}"
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
                "Content-Type": "text/csv; charset=utf-8"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        etl_logger.error(f"Error exporting results: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export results: {str(e)}"
        )


@router.delete("/job/{job_id}")
async def delete_job_results(
    job_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete all results for a specific job.
    Requires superuser privileges.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superusers can delete results"
        )

    try:
        results_service = get_results_service()
        success = results_service.delete_job_results(job_id)

        if success:
            return {"message": f"Results for job {job_id} deleted successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete results"
            )
    except HTTPException:
        raise
    except Exception as e:
        etl_logger.error(f"Error deleting results: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete results: {str(e)}"
        )


@router.get("/stats")
async def get_results_stats(
    current_user: User = Depends(get_current_user)
):
    """
    Get overall statistics for ETL results.
    Returns total records, total jobs, litigator counts, etc.
    """
    try:
        results_service = get_results_service()
        jobs = results_service.get_jobs_list(limit=1000)

        total_records = sum(job.get('RECORD_COUNT', job.get('record_count', 0)) for job in jobs)
        total_litigators = sum(job.get('LITIGATOR_COUNT', job.get('litigator_count', 0)) for job in jobs)
        total_jobs = len(jobs)

        return {
            "total_jobs": total_jobs,
            "total_records": total_records,
            "total_litigators": total_litigators,
            "clean_records": total_records - total_litigators,
            "litigator_percentage": round((total_litigators / total_records * 100), 2) if total_records > 0 else 0
        }
    except Exception as e:
        etl_logger.error(f"Error getting stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get stats: {str(e)}"
        )
