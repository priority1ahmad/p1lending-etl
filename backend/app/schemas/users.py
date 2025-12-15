"""
User management schemas for admin operations
"""

from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserListResponse(BaseModel):
    """Response schema for user list items"""
    id: UUID
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserCreateRequest(BaseModel):
    """Request schema for creating a new user"""
    email: EmailStr
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    is_superuser: bool = False

    @field_validator('email')
    @classmethod
    def email_lowercase(cls, v: str) -> str:
        return v.lower()


class UserCreateResponse(BaseModel):
    """Response schema for user creation (includes temporary password)"""
    user: UserListResponse
    temporary_password: str


class PasswordResetRequest(BaseModel):
    """Request schema for admin password reset"""
    new_password: str = Field(..., min_length=8)

    @field_validator('new_password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v


class AuditLogResponse(BaseModel):
    """Response schema for audit log entries"""
    id: UUID
    user_id: Optional[UUID] = None
    email: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    login_status: str  # Event type (login events + user management events)
    failure_reason: Optional[str] = None  # Event details
    timestamp: datetime

    model_config = {"from_attributes": True}


class AuditLogListResponse(BaseModel):
    """Response schema for paginated audit logs"""
    logs: List[AuditLogResponse]
    total: int
    page: int
    page_size: int


class UsersListResponse(BaseModel):
    """Response schema for paginated users list"""
    users: List[UserListResponse]
    total: int
