"""API endpoints for CRM import operations."""

import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime

from app.api.v1.deps import get_current_user, get_db
from app.db.models.user import User
from app.db.models.crm_import import CRMImportHistory
from app.schemas.crm_import import (
    CRMImportRequest,
    CRMImportStartResponse,
    CRMImportProgress,
    CRMImportHistoryItem,
    CRMImportHistoryResponse,
    CRMConnectionStatus,
)
from app.services.etl.results_service import ETLResultsService
from app.services.lodasoft_service import get_lodasoft_service, ImportProgress
from app.websockets.job_events import emit_crm_import_progress

router = APIRouter(prefix="/crm-import", tags=["CRM Import"])


async def run_import_task(
    import_id: str,
    records: list,
    db_session_factory,
):
    """Background task to run CRM import."""
    service = get_lodasoft_service()

    def progress_callback(progress: ImportProgress):
        # Emit WebSocket event
        emit_crm_import_progress(import_id, progress.to_dict())

    # Run the import
    result = service.import_records(records, progress_callback=progress_callback)

    # Update database record
    async with db_session_factory() as db:
        stmt = select(CRMImportHistory).where(CRMImportHistory.id == uuid.UUID(import_id))
        db_result = await db.execute(stmt)
        import_record = db_result.scalar_one_or_none()

        if import_record:
            import_record.status = result.status
            import_record.successful_records = result.successful_records
            import_record.failed_records = result.failed_records
            import_record.merged_records = result.merged_records
            import_record.duplicate_records = result.duplicate_records
            import_record.completed_at = result.completed_at
            import_record.error_message = result.error_message
            await db.commit()


@router.post("/start", response_model=CRMImportStartResponse)
async def start_import(
    request: CRMImportRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start a CRM import to Lodasoft."""
    # Get records from Snowflake results
    results_service = ETLResultsService()

    if request.job_id:
        records = await results_service.get_results_for_job(str(request.job_id))
    else:
        records = await results_service.get_all_results(limit=10000)

    if not records:
        raise HTTPException(status_code=400, detail="No records found to import")

    # Create import history record
    import_record = CRMImportHistory(
        id=uuid.uuid4(),
        job_id=request.job_id,
        job_name=request.job_name,
        table_id="964",  # Lodasoft contact list ID
        user_id=current_user.id,
        status="in_progress",
        total_records=len(records),
        started_at=datetime.utcnow(),
    )
    db.add(import_record)
    await db.commit()
    await db.refresh(import_record)

    # Start background import task
    from app.db.session import async_session_factory
    background_tasks.add_task(
        run_import_task,
        str(import_record.id),
        records,
        async_session_factory,
    )

    return CRMImportStartResponse(
        import_id=import_record.id,
        status="in_progress",
        message=f"Import started for {len(records)} records",
        total_records=len(records),
    )


@router.get("/status/{import_id}", response_model=CRMImportProgress)
async def get_import_status(
    import_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the current status of a CRM import."""
    stmt = select(CRMImportHistory).where(
        CRMImportHistory.id == uuid.UUID(import_id),
        CRMImportHistory.user_id == current_user.id,
    )
    result = await db.execute(stmt)
    import_record = result.scalar_one_or_none()

    if not import_record:
        raise HTTPException(status_code=404, detail="Import not found")

    return CRMImportProgress(
        import_id=import_record.id,
        status=import_record.status,
        total_records=import_record.total_records,
        processed_records=import_record.successful_records + import_record.failed_records,
        successful_records=import_record.successful_records,
        failed_records=import_record.failed_records,
        merged_records=import_record.merged_records,
        duplicate_records=import_record.duplicate_records,
        current_batch=0,
        total_batches=0,
        progress_percent=round(
            (import_record.successful_records + import_record.failed_records)
            / import_record.total_records * 100, 1
        ) if import_record.total_records > 0 else 0,
        logs=[],
        error_message=import_record.error_message,
    )


@router.get("/history", response_model=CRMImportHistoryResponse)
async def get_import_history(
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get paginated import history for the current user."""
    offset = (page - 1) * page_size

    # Get total count
    count_stmt = select(CRMImportHistory).where(
        CRMImportHistory.user_id == current_user.id
    )
    count_result = await db.execute(count_stmt)
    total = len(count_result.scalars().all())

    # Get paginated items
    stmt = (
        select(CRMImportHistory)
        .where(CRMImportHistory.user_id == current_user.id)
        .order_by(desc(CRMImportHistory.created_at))
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    items = result.scalars().all()

    return CRMImportHistoryResponse(
        items=[CRMImportHistoryItem.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/test-connection", response_model=CRMConnectionStatus)
async def test_connection(
    current_user: User = Depends(get_current_user),
):
    """Test the connection to Lodasoft CRM API."""
    service = get_lodasoft_service()
    result = service.test_connection()

    return CRMConnectionStatus(
        success=result.get("success", False),
        message=result.get("message", "Unknown error"),
        auth_url=result.get("auth_url"),
        upload_url=result.get("upload_url"),
    )


@router.post("/cancel/{import_id}")
async def cancel_import(
    import_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel an ongoing import (marks as failed, does not stop in-flight batches)."""
    stmt = select(CRMImportHistory).where(
        CRMImportHistory.id == uuid.UUID(import_id),
        CRMImportHistory.user_id == current_user.id,
    )
    result = await db.execute(stmt)
    import_record = result.scalar_one_or_none()

    if not import_record:
        raise HTTPException(status_code=404, detail="Import not found")

    if import_record.status not in ["pending", "in_progress"]:
        raise HTTPException(status_code=400, detail="Import already completed")

    import_record.status = "cancelled"
    import_record.completed_at = datetime.utcnow()
    import_record.error_message = "Cancelled by user"
    await db.commit()

    return {"message": "Import cancelled", "import_id": import_id}
