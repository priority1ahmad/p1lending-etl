"""Add preview to jobtype enum

Revision ID: 002_add_preview
Revises: 001_initial
Create Date: 2024-11-25 18:50:00.000000

"""

from typing import Sequence, Union
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "002_add_preview"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add 'preview' value to the jobtype enum
    # Check if the value already exists to make the migration idempotent
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_enum
                WHERE enumlabel = 'preview'
                AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'jobtype')
            ) THEN
                ALTER TYPE jobtype ADD VALUE 'preview';
            END IF;
        END $$;
    """
    )


def downgrade() -> None:
    # Note: PostgreSQL does not support removing enum values.
    # To remove 'preview' from the enum, you would need to:
    # 1. Create a new enum without 'preview'
    # 2. Alter the column to use the new enum
    # 3. Drop the old enum
    # This is a complex operation and is not implemented here.
    # If you need to downgrade, you'll need to manually handle this.
    pass
