"""Add file_source_id and file_upload_id to etl_jobs

Revision ID: 008_file_source_to_jobs
Revises: 007_file_source_tables
Create Date: 2025-12-16

"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = "008_file_source_to_jobs"
down_revision: Union[str, None] = "007_file_source_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add file_source_id column to etl_jobs
    op.add_column(
        "etl_jobs",
        sa.Column(
            "file_source_id",
            UUID(as_uuid=True),
            sa.ForeignKey("file_sources.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )

    # Add file_upload_id column to etl_jobs
    op.add_column(
        "etl_jobs",
        sa.Column(
            "file_upload_id",
            UUID(as_uuid=True),
            sa.ForeignKey("file_uploads.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )

    # Create indexes for better query performance
    op.create_index("ix_etl_jobs_file_source_id", "etl_jobs", ["file_source_id"])
    op.create_index("ix_etl_jobs_file_upload_id", "etl_jobs", ["file_upload_id"])


def downgrade() -> None:
    # Drop indexes
    op.drop_index("ix_etl_jobs_file_upload_id")
    op.drop_index("ix_etl_jobs_file_source_id")

    # Drop columns
    op.drop_column("etl_jobs", "file_upload_id")
    op.drop_column("etl_jobs", "file_source_id")
