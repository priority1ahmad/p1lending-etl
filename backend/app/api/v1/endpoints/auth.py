"""
Authentication endpoints with audit logging
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.db.session import get_db
from app.db.models.user import User
from app.db.models.audit import LoginAuditLog
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    TokenResponse,
    RefreshTokenRequest,
    UserResponse,
    UserUpdateRequest,
    PasswordChangeRequest
)
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash
)
from app.api.v1.deps import get_current_user
from app.core.logger import etl_logger
from app.services.ntfy_service import get_ntfy_events
from app.core.token_blacklist import token_blacklist
from app.core.account_lockout import account_lockout

router = APIRouter()
security = HTTPBearer()

# Get limiter from app state (will be set in main.py)
def get_limiter(request: Request) -> Limiter:
    return request.app.state.limiter


async def log_login_attempt(
    db: AsyncSession,
    email: str,
    status: str,
    user_id=None,
    ip_address: str = None,
    user_agent: str = None,
    failure_reason: str = None
):
    """Log a login attempt to the audit table"""
    try:
        audit_log = LoginAuditLog(
            user_id=user_id,
            email=email.lower(),
            ip_address=ip_address,
            user_agent=user_agent[:500] if user_agent and len(user_agent) > 500 else user_agent,
            login_status=status,
            failure_reason=failure_reason
        )
        db.add(audit_log)
        await db.commit()
        etl_logger.info(f"Login audit: {status} for {email} from {ip_address}")
    except Exception as e:
        etl_logger.error(f"Failed to log login attempt: {e}")
        # Don't fail the login because of audit log failure
        await db.rollback()


@router.post("/login", response_model=LoginResponse)
async def login(
    credentials: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    limiter: Limiter = Depends(get_limiter)
):
    """
    Login endpoint - authenticate user and return JWT tokens
    With rate limiting and account lockout protection
    """
    # Apply rate limiting (5 attempts per minute per IP)
    await limiter.limit("5/minute")(request)

    # Extract client info for audit logging
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent")

    # Check if account is locked BEFORE checking credentials
    if await account_lockout.is_locked(credentials.email):
        remaining = await account_lockout.get_remaining_lockout_time(credentials.email)
        await log_login_attempt(
            db=db,
            email=credentials.email,
            status="account_locked",
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason=f"Account locked for {remaining} more seconds"
        )
        etl_logger.warning(f"Login attempt on locked account: {credentials.email} from {ip_address}")
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account is locked due to too many failed login attempts. Try again in {remaining // 60} minutes."
        )

    # Find user by email
    result = await db.execute(select(User).where(User.email == credentials.email.lower()))
    user = result.scalar_one_or_none()

    if not user:
        # Log failed attempt - invalid email
        await log_login_attempt(
            db=db,
            email=credentials.email,
            status="invalid_email",
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason="Email not found in system"
        )
        # Record failed attempt for account lockout
        await account_lockout.record_failed_attempt(credentials.email, ip_address)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(credentials.password, user.hashed_password):
        # Log failed attempt - invalid password
        await log_login_attempt(
            db=db,
            email=credentials.email,
            status="invalid_password",
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason="Incorrect password"
        )
        # Record failed attempt for account lockout
        await account_lockout.record_failed_attempt(credentials.email, ip_address)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        # Log failed attempt - inactive user
        await log_login_attempt(
            db=db,
            email=credentials.email,
            status="inactive_user",
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason="User account is deactivated"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # Successful authentication - clear any previous failures
    await account_lockout.clear_failures(credentials.email)

    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    # Log successful login
    await log_login_attempt(
        db=db,
        email=credentials.email,
        status="success",
        user_id=user.id,
        ip_address=ip_address,
        user_agent=user_agent
    )

    # Send NTFY notification for successful login
    try:
        ntfy_events = get_ntfy_events()
        await ntfy_events.notify_login(
            email=credentials.email,
            ip_address=ip_address,
            status="success"
        )
    except Exception as ntfy_error:
        etl_logger.warning(f"Failed to send NTFY login notification: {ntfy_error}")

    etl_logger.info(f"Successful login: {credentials.email} from {ip_address}")

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshTokenRequest
):
    """
    Refresh access token using refresh token
    """
    payload = decode_token(request.refresh_token)

    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    # Create new access token
    access_token = create_access_token(data={"sub": user_id})

    return TokenResponse(
        access_token=access_token,
        refresh_token=request.refresh_token,  # Refresh token remains the same
        token_type="bearer"
    )


@router.post("/logout")
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Logout endpoint - blacklist the current token to invalidate it
    """
    # Extract token from Authorization header
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]  # Remove "Bearer " prefix
        try:
            payload = decode_token(token)
            if payload:
                jti = payload.get("jti")
                exp = payload.get("exp")
                if jti and exp:
                    # Calculate remaining time until token expiration
                    remaining = int(exp - datetime.utcnow().timestamp())
                    if remaining > 0:
                        # Blacklist the token for the remaining time
                        await token_blacklist.blacklist_token(jti, remaining)
                        etl_logger.info(f"Token blacklisted for user {current_user.email} (JTI: {jti[:8]}...)")
                    else:
                        etl_logger.warning(f"Token already expired for user {current_user.email}")
                else:
                    etl_logger.warning(f"Token missing JTI or EXP for user {current_user.email}")
        except Exception as e:
            etl_logger.error(f"Error blacklisting token for user {current_user.email}: {e}")

    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user information
    """
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_profile(
    update_data: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update current user's profile (first name, last name)
    """
    # Update fields if provided
    if update_data.first_name is not None:
        current_user.first_name = update_data.first_name
    if update_data.last_name is not None:
        current_user.last_name = update_data.last_name

    # Also update full_name for backward compatibility
    if update_data.first_name is not None or update_data.last_name is not None:
        first = current_user.first_name or ""
        last = current_user.last_name or ""
        current_user.full_name = f"{first} {last}".strip() or None

    await db.commit()
    await db.refresh(current_user)

    etl_logger.info(f"User {current_user.email} updated their profile")
    return UserResponse.model_validate(current_user)


@router.post("/change-password")
async def change_password(
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Change current user's password
    """
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # Verify new passwords match (additional server-side check)
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New passwords do not match"
        )

    # Check that new password is different from current
    if verify_password(password_data.new_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )

    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    await db.commit()

    etl_logger.info(f"User {current_user.email} changed their password")
    return {"message": "Password changed successfully"}
