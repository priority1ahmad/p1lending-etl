"""
Authentication schemas
"""

from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID


class LoginRequest(BaseModel):
    """Login request schema"""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response schema"""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema"""

    refresh_token: str


class UserResponse(BaseModel):
    """User response schema"""

    id: UUID
    email: str
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool
    is_superuser: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Login response schema"""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserUpdateRequest(BaseModel):
    """User profile update request schema"""

    first_name: Optional[str] = None
    last_name: Optional[str] = None

    @field_validator("first_name", "last_name")
    @classmethod
    def validate_names(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) > 100:
                raise ValueError("Name must be 100 characters or less")
            if len(v) < 1:
                raise ValueError("Name cannot be empty")
        return v


class PasswordChangeRequest(BaseModel):
    """Password change request schema"""

    current_password: str
    new_password: str
    confirm_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("confirm_password")
    @classmethod
    def validate_confirm_password(cls, v, info):
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Passwords do not match")
        return v
