---
allowed-tools: Read, Edit, Write, Glob, Grep
description: Create a new FastAPI endpoint with proper structure
argument-hint: <endpoint-name> <http-method>
---

## Task
Create a new API endpoint named `$1` with HTTP method `$2`.

## Supported Arguments
- `<endpoint-name>` - Name of the resource (e.g., "users", "reports", "notifications")
- `<http-method>` - HTTP method: GET, POST, PUT, PATCH, DELETE

## Workflow

### Step 1: Analyze Existing Patterns
Read reference implementations:
- `@backend/app/api/v1/endpoints/jobs.py` - Full CRUD example
- `@backend/app/api/v1/endpoints/scripts.py` - Simple CRUD
- `@backend/app/schemas/job.py` - Schema patterns

### Step 2: Create Pydantic Schemas
Create `backend/app/schemas/{endpoint_name}.py`:

```python
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class {EndpointName}Base(BaseModel):
    """Base schema with common fields."""
    # Add common fields here
    pass

class {EndpointName}Create({EndpointName}Base):
    """Schema for creating a new {endpoint_name}."""
    pass

class {EndpointName}Update(BaseModel):
    """Schema for updating. All fields optional."""
    pass

class {EndpointName}Response({EndpointName}Base):
    """Response schema with database fields."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime
```

### Step 3: Create Endpoint File
Create `backend/app/api/v1/endpoints/{endpoint_name}.py`:

```python
"""
{EndpointName} API endpoints.
"""
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.v1.deps import get_current_user, get_db
from app.db.models.user import User
from app.db.models.{endpoint_name} import {EndpointName}
from app.schemas.{endpoint_name} import (
    {EndpointName}Create,
    {EndpointName}Update,
    {EndpointName}Response,
)

router = APIRouter()


@router.get("/", response_model=list[{EndpointName}Response])
async def list_{endpoint_name}s(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    List all {endpoint_name}s.
    """
    result = await db.execute(
        select({EndpointName}).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get("/{id}", response_model={EndpointName}Response)
async def get_{endpoint_name}(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get {endpoint_name} by ID.
    """
    result = await db.execute(
        select({EndpointName}).where({EndpointName}.id == str(id))
    )
    {endpoint_name} = result.scalar_one_or_none()
    if not {endpoint_name}:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="{EndpointName} not found"
        )
    return {endpoint_name}


@router.post("/", response_model={EndpointName}Response, status_code=status.HTTP_201_CREATED)
async def create_{endpoint_name}(
    data: {EndpointName}Create,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create new {endpoint_name}.
    """
    {endpoint_name} = {EndpointName}(**data.model_dump())
    db.add({endpoint_name})
    await db.commit()
    await db.refresh({endpoint_name})
    return {endpoint_name}


@router.put("/{id}", response_model={EndpointName}Response)
async def update_{endpoint_name}(
    id: UUID,
    data: {EndpointName}Update,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Update {endpoint_name}.
    """
    result = await db.execute(
        select({EndpointName}).where({EndpointName}.id == str(id))
    )
    {endpoint_name} = result.scalar_one_or_none()
    if not {endpoint_name}:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="{EndpointName} not found"
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr({endpoint_name}, field, value)

    await db.commit()
    await db.refresh({endpoint_name})
    return {endpoint_name}


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_{endpoint_name}(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Delete {endpoint_name}.
    """
    result = await db.execute(
        select({EndpointName}).where({EndpointName}.id == str(id))
    )
    {endpoint_name} = result.scalar_one_or_none()
    if not {endpoint_name}:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="{EndpointName} not found"
        )

    await db.delete({endpoint_name})
    await db.commit()
```

### Step 4: Register Router
Edit `backend/app/api/v1/router.py`:
```python
from app.api.v1.endpoints import {endpoint_name}

api_router.include_router(
    {endpoint_name}.router,
    prefix="/{endpoint-name}",
    tags=["{endpoint_name}"]
)
```

### Step 5: Update Schema Exports
Edit `backend/app/schemas/__init__.py`:
```python
from app.schemas.{endpoint_name} import (
    {EndpointName}Create,
    {EndpointName}Update,
    {EndpointName}Response,
)
```

## Error Handling Patterns

```python
# Not Found
raise HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="{EndpointName} not found"
)

# Validation Error
raise HTTPException(
    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    detail="Invalid input: {reason}"
)

# Conflict (duplicate)
raise HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="{EndpointName} already exists"
)

# Forbidden
raise HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Not authorized to access this resource"
)
```

## Testing the Endpoint
After creation, test with:
```bash
# List
curl http://localhost:8000/api/v1/{endpoint-name}/

# Create
curl -X POST http://localhost:8000/api/v1/{endpoint-name}/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"field": "value"}'

# Get by ID
curl http://localhost:8000/api/v1/{endpoint-name}/{id}
```

## Output
- Created: `backend/app/schemas/{endpoint_name}.py`
- Created: `backend/app/api/v1/endpoints/{endpoint_name}.py`
- Updated: `backend/app/api/v1/router.py`
- Updated: `backend/app/schemas/__init__.py`

## Related Commands
- If model needed: `/add-db-model`
- For migration: `/add-migration`
- For frontend: `/add-api-service`
- For full stack: `/add-full-stack-feature`

## Example
```
/add-endpoint notifications POST
```
Creates notification endpoint with POST method and CRUD operations.
