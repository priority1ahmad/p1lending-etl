"""Initial migration

Revision ID: 001_initial
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_superuser", sa.Boolean(), nullable=False, default=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
    )

    # Create sql_scripts table
    op.create_table(
        "sql_scripts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["users.id"],
        ),
    )

    # Create etl_jobs table
    op.create_table(
        "etl_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "job_type", sa.Enum("single_script", "all_scripts", name="jobtype"), nullable=False
        ),
        sa.Column("script_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "status",
            sa.Enum("pending", "running", "completed", "failed", "cancelled", name="jobstatus"),
            nullable=False,
            default="pending",
        ),
        sa.Column("progress", sa.Integer(), nullable=False, default=0),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("row_limit", sa.Integer(), nullable=True),
        sa.Column("total_rows_processed", sa.Integer(), nullable=False, default=0),
        sa.Column("litigator_count", sa.Integer(), nullable=False, default=0),
        sa.Column("dnc_count", sa.Integer(), nullable=False, default=0),
        sa.Column("both_count", sa.Integer(), nullable=False, default=0),
        sa.Column("clean_count", sa.Integer(), nullable=False, default=0),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(
            ["script_id"],
            ["sql_scripts.id"],
        ),
        sa.ForeignKeyConstraint(
            ["started_by"],
            ["users.id"],
        ),
    )

    # Create job_logs table
    op.create_table(
        "job_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("level", sa.String(20), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["job_id"], ["etl_jobs.id"], ondelete="CASCADE"),
    )

    # Create app_config table
    op.create_table(
        "app_config",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("key", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("value", sa.Text(), nullable=True),
        sa.Column("is_encrypted", sa.Boolean(), nullable=False, default=False),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["updated_by"],
            ["users.id"],
        ),
    )


def downgrade() -> None:
    op.drop_table("app_config")
    op.drop_table("job_logs")
    op.drop_table("etl_jobs")
    op.drop_table("sql_scripts")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS jobstatus")
    op.execute("DROP TYPE IF EXISTS jobtype")
