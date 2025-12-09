"""
API dependencies
"""

from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.models.user import User
from app.core.security import decode_token
from app.core.logger import etl_logger

security = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token
    """
    # Check if credentials are provided
    if credentials is None:
        etl_logger.warning(f"Authentication failed: Missing Authorization header for {request.method} {request.url.path}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None:
        etl_logger.warning(f"Authentication failed: Invalid or expired token for {request.method} {request.url.path} (token decode failed)")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        etl_logger.warning(f"Authentication failed: Missing user ID in token payload for {request.method} {request.url.path}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format: missing user identifier",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        etl_logger.warning(f"Authentication failed: User not found in database (user_id: {user_id}) for {request.method} {request.url.path}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        etl_logger.warning(f"Authentication failed: Inactive user (user_id: {user_id}, email: {user.email}) for {request.method} {request.url.path}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current active user (alias for get_current_user)
    """
    return current_user

