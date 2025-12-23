"""
User management endpoints (admin-only)

All endpoints require superuser privileges via the require_superuser dependency.
"""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models.user import User
from app.api.v1.deps import require_superuser
from app.services.user_service import UserService
from app.core.security import get_client_ip
from app.schemas.users import (
    UserListResponse,
    UserCreateRequest,
    UserCreateResponse,
    PasswordResetRequest,
    AuditLogResponse,
    AuditLogListResponse,
    UsersListResponse,
)

router = APIRouter()


@router.get("/", response_model=UsersListResponse)
async def list_users(
    admin_user: User = Depends(require_superuser), db: AsyncSession = Depends(get_db)
):
    """
    List all users in the system.

    Requires superuser privileges.
    Returns all users ordered by creation date (newest first).
    """
    users, total = await UserService.list_users(db)

    return UsersListResponse(users=[UserListResponse.model_validate(u) for u in users], total=total)


@router.post("/", response_model=UserCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreateRequest,
    request: Request,
    admin_user: User = Depends(require_superuser),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new user with an auto-generated temporary password.

    Requires superuser privileges.
    The temporary password is returned ONLY in this response - it cannot be retrieved later.
    Admin should share this password with the user securely.

    Returns:
        User object and temporary password
    """
    ip_address = get_client_ip(request)

    try:
        user, temp_password = await UserService.create_user(
            db=db,
            email=user_data.email,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            is_superuser=user_data.is_superuser,
            admin_user=admin_user,
            ip_address=ip_address,
        )

        return UserCreateResponse(
            user=UserListResponse.model_validate(user), temporary_password=temp_password
        )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
    user_id: UUID,
    request: Request,
    admin_user: User = Depends(require_superuser),
    db: AsyncSession = Depends(get_db),
):
    """
    Permanently delete a user (hard delete).

    Requires superuser privileges.
    Cannot delete your own account.
    Audit logs are preserved with user_id set to NULL.

    Returns:
        Success message
    """
    ip_address = get_client_ip(request)

    try:
        await UserService.delete_user(
            db=db, user_id=user_id, admin_user=admin_user, ip_address=ip_address
        )
        return {"message": "User deleted successfully"}

    except ValueError as e:
        error_message = str(e)
        if "not found" in error_message.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_message)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_message)


@router.post("/{user_id}/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    user_id: UUID,
    password_data: PasswordResetRequest,
    request: Request,
    admin_user: User = Depends(require_superuser),
    db: AsyncSession = Depends(get_db),
):
    """
    Reset a user's password (admin sets the new password).

    Requires superuser privileges.
    Admin enters the new password directly (no temporary password generation).

    Returns:
        Success message
    """
    ip_address = get_client_ip(request)

    try:
        await UserService.reset_password(
            db=db,
            user_id=user_id,
            new_password=password_data.new_password,
            admin_user=admin_user,
            ip_address=ip_address,
        )
        return {"message": "Password reset successfully"}

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/audit-logs", response_model=AuditLogListResponse)
async def get_audit_logs(
    admin_user: User = Depends(require_superuser),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=10, le=100, description="Items per page"),
):
    """
    Get audit logs (login events + user management events).

    Requires superuser privileges.
    Returns paginated logs ordered by timestamp (newest first).

    Event types include:
    - Login events: success, invalid_email, invalid_password, inactive_user, account_locked
    - User management: user_created, user_deleted, password_reset_by_admin
    """
    offset = (page - 1) * page_size

    logs, total = await UserService.get_audit_logs(db=db, limit=page_size, offset=offset)

    return AuditLogListResponse(
        logs=[AuditLogResponse.model_validate(log) for log in logs],
        total=total,
        page=page,
        page_size=page_size,
    )
