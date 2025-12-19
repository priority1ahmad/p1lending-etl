"""
File Uploads endpoints
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import logging
from datetime import datetime

from app.db.session import get_db
from app.db.models.file_source import FileSource, FileSourceStatus
from app.db.models.file_upload import FileUpload
from app.db.models.user import User
from app.schemas.file_upload import (
    FileUploadResponse,
    ProcessFileRequest,
    ProcessFileResponse,
)
from app.api.v1.deps import get_current_user
from app.services.file_processor import FileProcessor

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/file-uploads", tags=["file-uploads"])


@router.get("", response_model=List[FileUploadResponse])
async def list_file_uploads(
    file_source_id: UUID = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all file uploads with optional filtering by file source"""
    query = select(FileUpload).order_by(FileUpload.created_at.desc())

    if file_source_id:
        query = query.where(FileUpload.file_source_id == file_source_id)

    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    file_uploads = result.scalars().all()
    return file_uploads


@router.get("/{file_upload_id}", response_model=FileUploadResponse)
async def get_file_upload(
    file_upload_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific file upload by ID"""
    result = await db.execute(select(FileUpload).where(FileUpload.id == file_upload_id))
    file_upload = result.scalar_one_or_none()

    if not file_upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File upload not found",
        )

    return file_upload


@router.post("/process", response_model=ProcessFileResponse, status_code=status.HTTP_201_CREATED)
async def process_file(
    process_request: ProcessFileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Process an uploaded file and prepare data for ETL.
    This endpoint reads the file, applies column mapping, normalizes data,
    and creates a FileUpload record tracking the process.

    NOTE: This endpoint does not directly trigger an ETL job. It prepares
    the data and returns validation results. A separate endpoint should be
    created to integrate with the ETL pipeline.
    """
    # Get file source
    result = await db.execute(
        select(FileSource).where(FileSource.id == process_request.file_source_id)
    )
    file_source = result.scalar_one_or_none()

    if not file_source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File source not found",
        )

    # Update file source status
    file_source.status = FileSourceStatus.PROCESSING
    await db.commit()

    try:
        # Read and process file
        processor = FileProcessor(file_source.file_path, file_source.file_type)
        processor.read_file(max_rows=process_request.row_limit)

        # Apply column mapping
        mapped_df = processor.apply_mapping(process_request.column_mapping)

        # Normalize data
        normalized_df, validation_errors = processor.normalize_data(mapped_df)

        # Calculate statistics
        total_rows = len(normalized_df)
        error_rows = len(validation_errors)
        valid_rows = total_rows - error_rows

        # Determine rows to upload based on skip_validation_errors flag
        if process_request.skip_validation_errors:
            # Remove rows with errors
            error_row_indices = [
                err["row"] - 2 for err in validation_errors
            ]  # -2 to adjust for header
            rows_to_upload = normalized_df.drop(error_row_indices, errors="ignore")
            rows_uploaded = len(rows_to_upload)
            rows_skipped = error_rows
        else:
            if error_rows > 0:
                # Fail if there are validation errors and skip is False
                file_source.status = FileSourceStatus.FAILED
                file_source.error_rows = error_rows
                file_source.valid_rows = valid_rows
                file_source.total_rows = total_rows
                await db.commit()

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File has {error_rows} validation errors. Fix errors or set skip_validation_errors=true",
                )
            rows_uploaded = total_rows
            rows_skipped = 0

        # Create FileUpload record
        file_upload = FileUpload(
            file_source_id=file_source.id,
            rows_uploaded=rows_uploaded,
            rows_skipped=rows_skipped,
            validation_errors=validation_errors if validation_errors else None,
            uploaded_by=current_user.id,
            completed_at=datetime.utcnow(),
        )

        db.add(file_upload)

        # Update file source
        file_source.status = FileSourceStatus.COMPLETED
        file_source.total_rows = total_rows
        file_source.valid_rows = valid_rows
        file_source.error_rows = error_rows
        file_source.column_mapping = process_request.column_mapping
        file_source.processed_at = datetime.utcnow()

        await db.commit()
        await db.refresh(file_upload)

        logger.info(
            f"File processed: {file_source.id} - "
            f"{rows_uploaded} uploaded, {rows_skipped} skipped by user {current_user.id}"
        )

        return {
            "upload_id": file_upload.id,
            "job_id": None,  # No ETL job created yet
            "rows_uploaded": rows_uploaded,
            "rows_skipped": rows_skipped,
            "validation_errors": (
                validation_errors[:10] if validation_errors else None
            ),  # First 10 errors
            "message": f"File processed successfully. {rows_uploaded} rows ready for ETL.",
        }

    except HTTPException:
        # Update status to failed
        file_source.status = FileSourceStatus.FAILED
        await db.commit()
        raise

    except Exception as e:
        logger.error(f"Error processing file {file_source.id}: {str(e)}")

        # Update status to failed
        file_source.status = FileSourceStatus.FAILED
        await db.commit()

        # Create failed upload record
        file_upload = FileUpload(
            file_source_id=file_source.id,
            rows_uploaded=0,
            rows_skipped=0,
            error_message=str(e),
            uploaded_by=current_user.id,
        )
        db.add(file_upload)
        await db.commit()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}",
        )


@router.delete("/{file_upload_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file_upload(
    file_upload_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a file upload record"""
    result = await db.execute(select(FileUpload).where(FileUpload.id == file_upload_id))
    file_upload = result.scalar_one_or_none()

    if not file_upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File upload not found",
        )

    await db.delete(file_upload)
    await db.commit()

    logger.info(f"File upload deleted: {file_upload_id} by user {current_user.id}")
    return None
