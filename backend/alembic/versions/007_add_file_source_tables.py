"""Add file_sources and file_uploads tables

Revision ID: 007_file_source_tables
Revises: 006_table_id_blacklist_cache
Create Date: 2025-12-16

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers, used by Alembic.
revision: str = '007_file_source_tables'
down_revision: Union[str, None] = '006_table_id_blacklist_cache'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create filesourcestatus enum type (use IF NOT EXISTS for safety)
    op.execute("DO $$ BEGIN CREATE TYPE filesourcestatus AS ENUM ('uploaded', 'processing', 'completed', 'failed'); EXCEPTION WHEN duplicate_object THEN null; END $$;")

    # Create file_sources table
    op.create_table(
        'file_sources',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.String(1000), nullable=True),
        sa.Column('original_filename', sa.String(255), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('file_size', sa.Integer, nullable=False),
        sa.Column('file_type', sa.String(20), nullable=False),
        sa.Column('status', sa.Enum('uploaded', 'processing', 'completed', 'failed', name='filesourcestatus', create_type=False), nullable=False, server_default='uploaded'),
        sa.Column('column_mapping', JSONB, nullable=True),
        sa.Column('total_rows', sa.Integer, nullable=True),
        sa.Column('valid_rows', sa.Integer, nullable=True),
        sa.Column('error_rows', sa.Integer, nullable=True),
        sa.Column('uploaded_by', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True)
    )
    op.create_index('ix_file_sources_name', 'file_sources', ['name'])
    op.create_index('ix_file_sources_status', 'file_sources', ['status'])
    op.create_index('ix_file_sources_uploaded_by', 'file_sources', ['uploaded_by'])

    # Create file_uploads table
    op.create_table(
        'file_uploads',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('file_source_id', UUID(as_uuid=True), sa.ForeignKey('file_sources.id', ondelete='CASCADE'), nullable=False),
        sa.Column('job_id', UUID(as_uuid=True), sa.ForeignKey('etl_jobs.id', ondelete='SET NULL'), nullable=True),
        sa.Column('rows_uploaded', sa.Integer, nullable=False, server_default='0'),
        sa.Column('rows_skipped', sa.Integer, nullable=False, server_default='0'),
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('validation_errors', JSONB, nullable=True),
        sa.Column('uploaded_by', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True)
    )
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

    # Drop filesourcestatus enum type
    op.execute("DROP TYPE filesourcestatus")
