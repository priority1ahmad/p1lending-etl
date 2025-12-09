# Add New API Endpoint

Scaffold a new FastAPI endpoint following project patterns.

## Endpoint Description
$ARGUMENTS

---

## Pre-Flight Checks

1. **Parse the request** to determine:
   - HTTP method (GET, POST, PUT, DELETE)
   - Resource path
   - Required parameters
   - Auth requirements

2. **Determine target file**:
   - Existing resource? Add to existing router
   - New resource? Create new file

3. **Check for conflicts**:
   ```bash
   grep -r "path=\"/api/v1/{path}\"" backend/app/api/v1/endpoints/
   ```

**If path exists:**
```
❌ ERROR: Endpoint path already exists.
File: {existing_file}:{line}

Options:
1. Add to existing endpoint
2. Choose different path
3. Update existing endpoint
```

---

## Required File References

| Category | Files to Reference |
|----------|-------------------|
| Patterns | `backend/app/api/v1/endpoints/jobs.py` (CRUD example) |
| Deps | `backend/app/api/v1/deps.py` (auth, db injection) |
| Schemas | `backend/app/schemas/` (Pydantic patterns) |
| Models | `backend/app/db/models/` (SQLAlchemy patterns) |
| Services | `backend/app/services/` (business logic patterns) |
| Router | `backend/app/api/v1/router.py` (registration) |

---

## Implementation Steps

### Step 1: Create/Update Endpoint File

**Location**: `backend/app/api/v1/endpoints/{resource}.py`

```python
"""
{Resource} API endpoints
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.v1.deps import get_current_user, get_db
from app.db.models.user import User
from app.db.models.{resource} import {Resource}
from app.schemas.{resource} import (
    {Resource}Create,
    {Resource}Update,
    {Resource}Response,
    {Resource}ListResponse,
)
from app.core.logger import etl_logger

router = APIRouter()


# === List Endpoint ===
@router.get("/", response_model=List[{Resource}Response])
async def list_{resources}(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """
    List all {resources} for the current user.

    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum records to return
    """
    query = (
        select({Resource})
        .where({Resource}.created_by == current_user.id)
        .offset(skip)
        .limit(limit)
        .order_by({Resource}.created_at.desc())
    )
    result = await db.execute(query)
    return result.scalars().all()


# === Create Endpoint ===
@router.post("/", response_model={Resource}Response, status_code=status.HTTP_201_CREATED)
async def create_{resource}(
    data: {Resource}Create,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new {resource}.

    - **name**: Required name field
    - **description**: Optional description
    """
    {resource} = {Resource}(
        **data.model_dump(),
        created_by=current_user.id,
    )
    db.add({resource})

    try:
        await db.commit()
        await db.refresh({resource})
    except Exception as e:
        await db.rollback()
        etl_logger.error(f"Failed to create {resource}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create {resource}"
        )

    return {resource}


# === Get Single Endpoint ===
@router.get("/{{{resource}_id}}", response_model={Resource}Response)
async def get_{resource}(
    {resource}_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific {resource} by ID.
    """
    {resource} = await db.get({Resource}, {resource}_id)

    if not {resource}:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="{Resource} not found"
        )

    # Check ownership (unless admin)
    if {resource}.created_by != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this {resource}"
        )

    return {resource}


# === Update Endpoint ===
@router.put("/{{{resource}_id}}", response_model={Resource}Response)
async def update_{resource}(
    {resource}_id: UUID,
    data: {Resource}Update,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a {resource}.
    """
    {resource} = await db.get({Resource}, {resource}_id)

    if not {resource}:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="{Resource} not found"
        )

    if {resource}.created_by != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this {resource}"
        )

    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr({resource}, field, value)

    await db.commit()
    await db.refresh({resource})

    return {resource}


# === Delete Endpoint ===
@router.delete("/{{{resource}_id}}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_{resource}(
    {resource}_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a {resource}.
    """
    {resource} = await db.get({Resource}, {resource}_id)

    if not {resource}:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="{Resource} not found"
        )

    if {resource}.created_by != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this {resource}"
        )

    await db.delete({resource})
    await db.commit()
```

### Step 2: Create Pydantic Schemas

**Location**: `backend/app/schemas/{resource}.py`

```python
"""
{Resource} schemas for request/response validation
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class {Resource}Base(BaseModel):
    """Base schema with common fields"""
    name: str = Field(..., min_length=1, max_length=255, description="Name of the {resource}")
    description: Optional[str] = Field(None, max_length=1000, description="Optional description")


class {Resource}Create({Resource}Base):
    """Schema for creating a new {resource}"""
    pass


class {Resource}Update(BaseModel):
    """Schema for updating a {resource} (all fields optional)"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)


class {Resource}Response({Resource}Base):
    """Schema for {resource} responses"""
    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
```

### Step 3: Create Database Model (if needed)

**Location**: `backend/app/db/models/{resource}.py`

```python
"""
{Resource} database model
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.db.base import Base


class {Resource}(Base):
    """Database model for {resource}"""
    __tablename__ = "{resources}"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    creator = relationship("User", foreign_keys=[created_by])

    def __repr__(self):
        return f"<{Resource}(id={self.id}, name={self.name})>"
```

### Step 4: Register Router

**Update**: `backend/app/api/v1/router.py`

```python
from app.api.v1.endpoints import {resource}

api_router.include_router(
    {resource}.router,
    prefix="/{resources}",
    tags=["{resources}"]
)
```

### Step 5: Create Migration (if new model)

```bash
cd backend
alembic revision --autogenerate -m "Add {resources} table"
alembic upgrade head
```

---

## Output Format

```markdown
# Endpoint Creation Summary

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `backend/app/api/v1/endpoints/{resource}.py` | Created | Endpoint handlers |
| `backend/app/schemas/{resource}.py` | Created | Pydantic schemas |
| `backend/app/db/models/{resource}.py` | Created | Database model |
| `backend/app/api/v1/router.py` | Modified | Router registration |
| `backend/alembic/versions/{id}_{resource}.py` | Created | Migration |

## Endpoints Created

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/{resources}/` | List all |
| POST | `/api/v1/{resources}/` | Create new |
| GET | `/api/v1/{resources}/{id}` | Get by ID |
| PUT | `/api/v1/{resources}/{id}` | Update |
| DELETE | `/api/v1/{resources}/{id}` | Delete |

## Test Commands

```bash
# Create
curl -X POST http://localhost:8000/api/v1/{resources}/ \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "description": "Test description"}'

# List
curl http://localhost:8000/api/v1/{resources}/ \
  -H "Authorization: Bearer {token}"

# Get
curl http://localhost:8000/api/v1/{resources}/{id} \
  -H "Authorization: Bearer {token}"
```

## Validation Checklist

- [ ] All files created without syntax errors
- [ ] Migration runs successfully
- [ ] All CRUD operations work
- [ ] Auth enforced on all endpoints
- [ ] 404 returned for non-existent resources
- [ ] 403 returned for unauthorized access
- [ ] Pagination works on list endpoint
```

---

## Error Handling

| Error | Resolution |
|-------|------------|
| Import error | Check model/schema file names match |
| Migration fails | Check foreign key references |
| Router not found | Verify registration in router.py |
| 422 on requests | Check schema field requirements |

---

## Validation Steps

1. **Verify imports**:
   ```bash
   cd backend
   python -c "from app.api.v1.endpoints.{resource} import router"
   ```

2. **Run migration**:
   ```bash
   alembic upgrade head
   ```

3. **Start server and test**:
   ```bash
   uvicorn app.main:app --reload
   # Then test endpoints with curl
   ```

4. **Check API docs**:
   - Visit http://localhost:8000/docs
   - Verify new endpoints appear
