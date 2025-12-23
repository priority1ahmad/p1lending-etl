"""
Phone Blacklist endpoints
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models.user import User
from app.api.v1.deps import get_current_user
from app.schemas.blacklist import (
    PhoneBlacklistAdd,
    PhoneBlacklistAddFromJob,
    PhoneBlacklistRemove,
    PhoneBlacklistResponse,
    PhoneBlacklistStatsResponse,
    PhoneBlacklistListResponse,
    PhoneBlacklistCheckResponse,
)
from app.services.blacklist_service import get_blacklist_service
from app.services.etl.results_service import get_results_service
from app.core.logger import etl_logger

router = APIRouter(prefix="/blacklist", tags=["blacklist"])


@router.post("", response_model=PhoneBlacklistResponse)
async def add_phones_to_blacklist(
    request: PhoneBlacklistAdd,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add phone numbers to the blacklist"""
    if request.reason not in ["litigator", "manual", "dnc"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reason must be 'litigator', 'manual', or 'dnc'",
        )

    blacklist_service = get_blacklist_service()

    added_count = await blacklist_service.add_phones_to_blacklist(
        phone_numbers=request.phone_numbers,
        reason=request.reason,
        db=db,
        source_table_id=request.source_table_id,
        source_job_id=str(request.source_job_id) if request.source_job_id else None,
        added_by=str(current_user.id),
    )

    return PhoneBlacklistResponse(
        success=True, message=f"Added {added_count} phones to blacklist", count=added_count
    )


@router.post("/add-litigators", response_model=PhoneBlacklistResponse)
async def add_litigators_from_job(
    request: PhoneBlacklistAddFromJob,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Add all litigator phones from a specific job/table_id to the blacklist.
    This extracts phones marked as 'In Litigator List' = 'Yes' from results.
    """
    results_service = get_results_service()
    blacklist_service = get_blacklist_service()

    # Get all litigator records from Snowflake results
    try:
        results = results_service.get_job_results(
            job_name=None,
            job_id=None,
            offset=0,
            limit=100000,  # Get all records
            exclude_litigators=False,
        )

        if not results or not results.get("records"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No results found for table_id: {request.table_id}",
            )

        # Filter to only litigator records and extract phones
        litigator_phones = []
        for record in results["records"]:
            # Check if this record is from the requested table_id
            if record.get("table_id") != request.table_id:
                continue

            if record.get("in_litigator_list") == "Yes" or record.get("IN_LITIGATOR_LIST") == "Yes":
                # Extract all phone numbers from this record
                for phone_key in ["phone_1", "phone_2", "phone_3", "PHONE_1", "PHONE_2", "PHONE_3"]:
                    phone = record.get(phone_key)
                    if phone and str(phone).strip():
                        litigator_phones.append(str(phone).strip())

        if not litigator_phones:
            return PhoneBlacklistResponse(
                success=True,
                message=f"No litigator phones found for table_id: {request.table_id}",
                count=0,
            )

        # Add to blacklist
        added_count = await blacklist_service.add_phones_to_blacklist(
            phone_numbers=litigator_phones,
            reason="litigator",
            db=db,
            source_table_id=request.table_id,
            added_by=str(current_user.id),
        )

        etl_logger.info(
            f"Added {added_count} litigator phones from table_id {request.table_id} to blacklist"
        )

        return PhoneBlacklistResponse(
            success=True,
            message=f"Added {added_count} litigator phones to blacklist from {len(litigator_phones)} found",
            count=added_count,
        )

    except HTTPException:
        raise
    except Exception as e:
        etl_logger.error(f"Error adding litigators to blacklist: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing litigator phones: {str(e)}",
        )


@router.delete("", response_model=PhoneBlacklistResponse)
async def remove_phones_from_blacklist(
    request: PhoneBlacklistRemove,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove phone numbers from the blacklist"""
    blacklist_service = get_blacklist_service()

    removed_count = await blacklist_service.remove_from_blacklist(
        phone_numbers=request.phone_numbers, db=db
    )

    return PhoneBlacklistResponse(
        success=True, message=f"Removed {removed_count} phones from blacklist", count=removed_count
    )


@router.delete("/phone/{phone_number}", response_model=PhoneBlacklistResponse)
async def remove_single_phone(
    phone_number: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a single phone number from the blacklist"""
    blacklist_service = get_blacklist_service()

    removed_count = await blacklist_service.remove_from_blacklist(
        phone_numbers=[phone_number], db=db
    )

    if removed_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Phone number {phone_number} not found in blacklist",
        )

    return PhoneBlacklistResponse(
        success=True, message=f"Removed phone {phone_number} from blacklist", count=removed_count
    )


@router.get("/stats", response_model=PhoneBlacklistStatsResponse)
async def get_blacklist_stats(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get statistics about the phone blacklist"""
    blacklist_service = get_blacklist_service()
    stats = await blacklist_service.get_blacklist_stats(db)
    return PhoneBlacklistStatsResponse(**stats)


@router.get("", response_model=PhoneBlacklistListResponse)
async def list_blacklist_entries(
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    reason: Optional[str] = Query(
        None, description="Filter by reason: 'litigator', 'manual', or 'dnc'"
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get paginated list of blacklist entries"""
    if reason and reason not in ["litigator", "manual", "dnc"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reason filter must be 'litigator', 'manual', or 'dnc'",
        )

    blacklist_service = get_blacklist_service()

    result = await blacklist_service.get_blacklist_entries(
        db=db, offset=offset, limit=limit, reason=reason
    )

    return PhoneBlacklistListResponse(**result)


@router.get("/check/{phone_number}", response_model=PhoneBlacklistCheckResponse)
async def check_phone_blacklisted(
    phone_number: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Check if a specific phone number is blacklisted"""
    blacklist_service = get_blacklist_service()

    is_blacklisted = await blacklist_service.is_phone_blacklisted(phone_number, db)

    return PhoneBlacklistCheckResponse(
        phone_number=phone_number,
        is_blacklisted=is_blacklisted,
        reason=None,  # Could be extended to return the reason if needed
    )
