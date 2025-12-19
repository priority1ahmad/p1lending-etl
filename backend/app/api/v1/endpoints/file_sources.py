"""
File Sources endpoints
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
import os
import uuid as uuid_lib
from pathlib import Path
import logging

from app.db.session import get_db
from app.db.models.file_source import FileSource, FileSourceStatus
from app.db.models.file_upload import FileUpload
from app.db.models.user import User
from app.schemas.file_source import (
    FileSourceCreate,
    FileSourceUpdate,
    FileSourceResponse,
    FileSourceDetail,
    ColumnMappingRequest,
    PreviewRequest,
    PreviewResponse,
    ColumnInfoResponse,
    ColumnInfo,
)
from app.api.v1.deps import get_current_user
from app.services.file_processor import FileProcessor
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/file-sources", tags=["file-sources"])

# Upload directory configuration
UPLOAD_DIR = Path(settings.file_upload_dir)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}


@router.get("", response_model=List[FileSourceResponse])
async def list_file_sources(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all file sources with pagination"""
    result = await db.execute(
        select(FileSource)
        .order_by(FileSource.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    file_sources = result.scalars().all()
    return file_sources


@router.get("/{file_source_id}", response_model=FileSourceDetail)
async def get_file_source(
    file_source_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific file source by ID with upload count"""
    result = await db.execute(select(FileSource).where(FileSource.id == file_source_id))
    file_source = result.scalar_one_or_none()

    if not file_source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File source not found",
        )

    # Get upload count
    upload_count_result = await db.execute(
        select(func.count()).select_from(FileUpload).where(FileUpload.file_source_id == file_source_id)
    )
    upload_count = upload_count_result.scalar() or 0

    # Convert to dict and add upload_count
    file_source_dict = {
        **{c.name: getattr(file_source, c.name) for c in FileSource.__table__.columns},
        "upload_count": upload_count,
    }

    return file_source_dict


@router.post("", response_model=FileSourceResponse, status_code=status.HTTP_201_CREATED)
async def upload_file_source(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a CSV or Excel file.
    The file is saved to disk and a FileSource record is created.
    """
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not supported. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Generate unique filename
    file_id = uuid_lib.uuid4()
    stored_filename = f"{file_id}{file_ext}"
    file_path = UPLOAD_DIR / stored_filename

    try:
        # Read and save file
        contents = await file.read()
        file_size = len(contents)

        # Check file size
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE / 1024 / 1024}MB",
            )

        # Save file to disk
        with open(file_path, "wb") as f:
            f.write(contents)

        # Determine file type
        file_type = "csv" if file_ext == ".csv" else "xlsx"

        # Create FileSource record
        file_source = FileSource(
            name=name,
            description=description,
            original_filename=file.filename,
            file_path=str(file_path),
            file_size=file_size,
            file_type=file_type,
            status=FileSourceStatus.UPLOADED,
            uploaded_by=current_user.id,
        )

        db.add(file_source)
        await db.commit()
        await db.refresh(file_source)

        logger.info(f"File source created: {file_source.id} by user {current_user.id}")
        return file_source

    except HTTPException:
        # Clean up file if it was created
        if file_path.exists():
            file_path.unlink()
        raise
    except Exception as e:
        # Clean up file if it was created
        if file_path.exists():
            file_path.unlink()
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading file: {str(e)}",
        )


@router.put("/{file_source_id}", response_model=FileSourceResponse)
async def update_file_source(
    file_source_id: UUID,
    file_source_data: FileSourceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update file source metadata"""
    result = await db.execute(select(FileSource).where(FileSource.id == file_source_id))
    file_source = result.scalar_one_or_none()

    if not file_source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File source not found",
        )

    # Update fields
    if file_source_data.name is not None:
        file_source.name = file_source_data.name
    if file_source_data.description is not None:
        file_source.description = file_source_data.description
    if file_source_data.column_mapping is not None:
        file_source.column_mapping = file_source_data.column_mapping
    if file_source_data.status is not None:
        file_source.status = file_source_data.status

    await db.commit()
    await db.refresh(file_source)

    logger.info(f"File source updated: {file_source_id} by user {current_user.id}")
    return file_source


@router.delete("/{file_source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file_source(
    file_source_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a file source and its associated file"""
    result = await db.execute(select(FileSource).where(FileSource.id == file_source_id))
    file_source = result.scalar_one_or_none()

    if not file_source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File source not found",
        )

    # Delete the file from disk
    file_path = Path(file_source.file_path)
    if file_path.exists():
        try:
            file_path.unlink()
            logger.info(f"Deleted file: {file_path}")
        except Exception as e:
            logger.error(f"Error deleting file {file_path}: {str(e)}")

    # Delete the database record (cascade will delete related uploads)
    await db.delete(file_source)
    await db.commit()

    logger.info(f"File source deleted: {file_source_id} by user {current_user.id}")
    return None


@router.get("/{file_source_id}/columns", response_model=ColumnInfoResponse)
async def get_column_info(
    file_source_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get column information and auto-matching suggestions"""
    result = await db.execute(select(FileSource).where(FileSource.id == file_source_id))
    file_source = result.scalar_one_or_none()

    if not file_source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File source not found",
        )

    try:
        # Read file and get column info
        processor = FileProcessor(file_source.file_path, file_source.file_type)
        processor.read_file(max_rows=100)  # Read first 100 rows for analysis
        column_info = processor.get_column_info()

        return {
            "columns": column_info,
            "total_columns": len(column_info),
            "total_rows": file_source.total_rows or len(processor._df),
        }

    except Exception as e:
        logger.error(f"Error getting column info for {file_source_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing file: {str(e)}",
        )


@router.post("/{file_source_id}/auto-map", response_model=ColumnMappingRequest)
async def auto_map_columns(
    file_source_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Automatically map columns to standard schema"""
    result = await db.execute(select(FileSource).where(FileSource.id == file_source_id))
    file_source = result.scalar_one_or_none()

    if not file_source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File source not found",
        )

    try:
        # Read file and auto-map columns
        processor = FileProcessor(file_source.file_path, file_source.file_type)
        processor.read_file()
        column_mapping = processor.auto_match_columns()

        # Save the mapping to the file source
        file_source.column_mapping = column_mapping
        await db.commit()

        logger.info(f"Auto-mapped {len(column_mapping)} columns for file source {file_source_id}")
        return {"column_mapping": column_mapping}

    except Exception as e:
        logger.error(f"Error auto-mapping columns for {file_source_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error auto-mapping columns: {str(e)}",
        )


@router.post("/{file_source_id}/preview", response_model=PreviewResponse)
async def preview_file_data(
    file_source_id: UUID,
    preview_request: PreviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Preview file data with optional column mapping"""
    result = await db.execute(select(FileSource).where(FileSource.id == file_source_id))
    file_source = result.scalar_one_or_none()

    if not file_source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File source not found",
        )

    try:
        # Read file
        processor = FileProcessor(file_source.file_path, file_source.file_type)
        processor.read_file()

        # Use provided mapping or saved mapping
        column_mapping = preview_request.column_mapping or file_source.column_mapping

        if not column_mapping:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Column mapping is required. Use auto-map endpoint first or provide mapping.",
            )

        # Preview with mapping
        preview_data = processor.preview_mapped_data(column_mapping, preview_request.num_rows)

        return preview_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error previewing file data for {file_source_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error previewing file: {str(e)}",
        )
