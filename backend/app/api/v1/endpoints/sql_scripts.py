"""
SQL Scripts endpoints
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.db.session import get_db
from app.db.models.sql_script import SQLScript
from app.db.models.user import User
from app.schemas.sql_script import SQLScriptCreate, SQLScriptUpdate, SQLScriptResponse
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/scripts", tags=["scripts"])


@router.get("", response_model=List[SQLScriptResponse])
async def list_scripts(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """List all SQL scripts"""
    result = await db.execute(select(SQLScript).order_by(SQLScript.created_at.desc()))
    scripts = result.scalars().all()
    return scripts


@router.get("/{script_id}", response_model=SQLScriptResponse)
async def get_script(
    script_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific SQL script by ID"""
    result = await db.execute(select(SQLScript).where(SQLScript.id == script_id))
    script = result.scalar_one_or_none()

    if not script:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SQL script not found")

    return script


@router.post("", response_model=SQLScriptResponse, status_code=status.HTTP_201_CREATED)
async def create_script(
    script_data: SQLScriptCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new SQL script"""
    # Check if script name already exists
    result = await db.execute(select(SQLScript).where(SQLScript.name == script_data.name))
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SQL script with this name already exists",
        )

    script = SQLScript(
        name=script_data.name,
        description=script_data.description,
        content=script_data.content,
        created_by=current_user.id,
    )

    db.add(script)
    await db.commit()
    await db.refresh(script)

    return script


@router.put("/{script_id}", response_model=SQLScriptResponse)
async def update_script(
    script_id: UUID,
    script_data: SQLScriptUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing SQL script"""
    result = await db.execute(select(SQLScript).where(SQLScript.id == script_id))
    script = result.scalar_one_or_none()

    if not script:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SQL script not found")

    # Check name uniqueness if name is being updated
    if script_data.name and script_data.name != script.name:
        result = await db.execute(select(SQLScript).where(SQLScript.name == script_data.name))
        existing = result.scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SQL script with this name already exists",
            )

    # Update fields
    if script_data.name is not None:
        script.name = script_data.name
    if script_data.description is not None:
        script.description = script_data.description
    if script_data.content is not None:
        script.content = script_data.content

    await db.commit()
    await db.refresh(script)

    return script


@router.delete("/{script_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_script(
    script_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a SQL script"""
    result = await db.execute(select(SQLScript).where(SQLScript.id == script_id))
    script = result.scalar_one_or_none()

    if not script:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SQL script not found")

    await db.delete(script)
    await db.commit()

    return None
