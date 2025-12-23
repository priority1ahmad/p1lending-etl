"""Add login_audit_logs table

Revision ID: 004_add_login_audit
Revises: 003_add_preview_data
Create Date: 2024-12-07 12:00:00.000000

"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "004_add_login_audit"
down_revision: Union[str, None] = "003_add_preview_data"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create login_audit_logs table
    op.create_table(
        "login_audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("login_status", sa.String(50), nullable=False),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column(
            "timestamp", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )

    # Create indexes
    op.create_index("ix_login_audit_email", "login_audit_logs", ["email"])
    op.create_index("ix_login_audit_timestamp", "login_audit_logs", ["timestamp"])
    op.create_index("ix_login_audit_ip", "login_audit_logs", ["ip_address"])
    op.create_index("ix_login_audit_status", "login_audit_logs", ["login_status"])


def downgrade() -> None:
    # Drop indexes
    op.drop_index("ix_login_audit_status", table_name="login_audit_logs")
    op.drop_index("ix_login_audit_ip", table_name="login_audit_logs")
    op.drop_index("ix_login_audit_timestamp", table_name="login_audit_logs")
    op.drop_index("ix_login_audit_email", table_name="login_audit_logs")

    # Drop table
    op.drop_table("login_audit_logs")
