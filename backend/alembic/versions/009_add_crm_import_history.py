"""Add CRM import history table

Revision ID: 009_crm_import_history
Revises: 008_file_source_to_jobs
Create Date: 2026-01-05
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "009_crm_import_history"
down_revision = "008_file_source_to_jobs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "crm_import_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "job_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("etl_jobs.id"), nullable=True
        ),
        sa.Column("job_name", sa.String(255), nullable=True),
        sa.Column("table_id", sa.String(100), nullable=True),
        sa.Column(
            "user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False
        ),
        sa.Column("status", sa.String(50), default="pending"),
        sa.Column("total_records", sa.Integer, default=0),
        sa.Column("successful_records", sa.Integer, default=0),
        sa.Column("failed_records", sa.Integer, default=0),
        sa.Column("merged_records", sa.Integer, default=0),
        sa.Column("duplicate_records", sa.Integer, default=0),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("started_at", sa.DateTime, nullable=True),
        sa.Column("completed_at", sa.DateTime, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index("ix_crm_import_history_user_id", "crm_import_history", ["user_id"])
    op.create_index("ix_crm_import_history_job_id", "crm_import_history", ["job_id"])
    op.create_index("ix_crm_import_history_status", "crm_import_history", ["status"])


def downgrade() -> None:
    op.drop_index("ix_crm_import_history_status")
    op.drop_index("ix_crm_import_history_job_id")
    op.drop_index("ix_crm_import_history_user_id")
    op.drop_table("crm_import_history")
