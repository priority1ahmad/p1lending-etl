"""
SQL Script schemas
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class SQLScriptBase(BaseModel):
    """Base SQL script schema"""
    name: str
    description: Optional[str] = None
    content: str


class SQLScriptCreate(SQLScriptBase):
    """SQL script creation schema"""
    pass


class SQLScriptUpdate(BaseModel):
    """SQL script update schema"""
    name: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None


class SQLScriptResponse(SQLScriptBase):
    """SQL script response schema"""
    id: UUID
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

