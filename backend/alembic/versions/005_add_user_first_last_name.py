"""Add first_name and last_name columns to users table

Revision ID: 005_add_user_names
Revises: 004_add_login_audit
Create Date: 2024-12-10 12:00:00.000000

"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "005_add_user_names"
down_revision: Union[str, None] = "004_add_login_audit"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add first_name and last_name columns
    op.add_column("users", sa.Column("first_name", sa.String(100), nullable=True))
    op.add_column("users", sa.Column("last_name", sa.String(100), nullable=True))

    # Migrate data from full_name to first_name/last_name
    # This attempts to split full_name on the first space
    connection = op.get_bind()
    connection.execute(
        sa.text(
            """
        UPDATE users
        SET first_name = CASE
            WHEN full_name IS NOT NULL AND full_name != '' THEN
                CASE
                    WHEN POSITION(' ' IN full_name) > 0 THEN SUBSTRING(full_name FROM 1 FOR POSITION(' ' IN full_name) - 1)
                    ELSE full_name
                END
            ELSE NULL
        END,
        last_name = CASE
            WHEN full_name IS NOT NULL AND full_name != '' AND POSITION(' ' IN full_name) > 0 THEN
                SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
            ELSE NULL
        END
    """
        )
    )


def downgrade() -> None:
    # Remove first_name and last_name columns
    op.drop_column("users", "last_name")
    op.drop_column("users", "first_name")
