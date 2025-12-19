"""Add preview_data to etl_jobs

Revision ID: 003_add_preview_data
Revises: 002_add_preview
Create Date: 2024-11-25 20:00:00.000000

"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "003_add_preview_data"
down_revision: Union[str, None] = "002_add_preview"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add preview_data JSONB column to etl_jobs table
    op.add_column(
        "etl_jobs",
        sa.Column("preview_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    # Remove preview_data column
    op.drop_column("etl_jobs", "preview_data")
