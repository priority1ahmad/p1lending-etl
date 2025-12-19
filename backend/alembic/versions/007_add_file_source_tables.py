"""Add file_sources and file_uploads tables

Revision ID: 007_file_source_tables
Revises: 006_table_id_blacklist_cache
Create Date: 2025-12-16

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers, used by Alembic.
revision: str = '007_file_source_tables'
down_revision: Union[str, None] = '006_table_id_blacklist_cache'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if tables already exist
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    existing_tables = inspector.get_table_names()

    # Create filesourcestatus enum type if it doesn't exist (idempotent)
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'filesourcestatus') THEN
                CREATE TYPE filesourcestatus AS ENUM ('uploaded', 'processing', 'completed', 'failed');
            END IF;
        END $$;
    """)

    # Create file_sources table only if it doesn't exist
    if 'file_sources' not in existing_tables:
        op.execute("""
            CREATE TABLE file_sources (
                id UUID PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description VARCHAR(1000),
                original_filename VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_size INTEGER NOT NULL,
                file_type VARCHAR(20) NOT NULL,
                status filesourcestatus NOT NULL DEFAULT 'uploaded',
                column_mapping JSONB,
                total_rows INTEGER,
                valid_rows INTEGER,
                error_rows INTEGER,
                uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                processed_at TIMESTAMP WITH TIME ZONE
            )
        """)
        op.create_index('ix_file_sources_name', 'file_sources', ['name'])
        op.create_index('ix_file_sources_status', 'file_sources', ['status'])
        op.create_index('ix_file_sources_uploaded_by', 'file_sources', ['uploaded_by'])

    # Create file_uploads table only if it doesn't exist
    if 'file_uploads' not in existing_tables:
        op.execute("""
            CREATE TABLE file_uploads (
                id UUID PRIMARY KEY,
                file_source_id UUID NOT NULL REFERENCES file_sources(id) ON DELETE CASCADE,
                job_id UUID REFERENCES etl_jobs(id) ON DELETE SET NULL,
                rows_uploaded INTEGER NOT NULL DEFAULT 0,
                rows_skipped INTEGER NOT NULL DEFAULT 0,
                error_message TEXT,
                validation_errors JSONB,
                uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                completed_at TIMESTAMP WITH TIME ZONE
            )
        """)
        op.create_index('ix_file_uploads_file_source_id', 'file_uploads', ['file_source_id'])
        op.create_index('ix_file_uploads_job_id', 'file_uploads', ['job_id'])


def downgrade() -> None:
    # Drop file_uploads table
    op.drop_index('ix_file_uploads_job_id')
    op.drop_index('ix_file_uploads_file_source_id')
    op.drop_table('file_uploads')

    # Drop file_sources table
    op.drop_index('ix_file_sources_uploaded_by')
    op.drop_index('ix_file_sources_status')
    op.drop_index('ix_file_sources_name')
    op.drop_table('file_sources')

    # Drop filesourcestatus enum type if it exists
    op.execute("DROP TYPE IF EXISTS filesourcestatus")
