"""Add table_id, phone_blacklist, and results_cache tables

Revision ID: 006_table_id_blacklist_cache
Revises: 005_add_user_names
Create Date: 2025-12-11

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers, used by Alembic.
revision: str = '006_table_id_blacklist_cache'
down_revision: Union[str, None] = '005_add_user_names'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add table_id and table_title columns to etl_jobs
    op.add_column('etl_jobs', sa.Column('table_id', sa.String(255), nullable=True))
    op.add_column('etl_jobs', sa.Column('table_title', sa.String(255), nullable=True))
    op.create_index('ix_etl_jobs_table_id', 'etl_jobs', ['table_id'])

    # Create phone_blacklist table
    op.create_table(
        'phone_blacklist',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('phone_number', sa.String(20), nullable=False, unique=True),
        sa.Column('reason', sa.String(50), nullable=False),
        sa.Column('source_table_id', sa.String(255), nullable=True),
        sa.Column('source_job_id', UUID(as_uuid=True), sa.ForeignKey('etl_jobs.id', ondelete='SET NULL'), nullable=True),
        sa.Column('added_by', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )
    op.create_index('ix_phone_blacklist_phone_number', 'phone_blacklist', ['phone_number'])

    # Create results_cache table
    op.create_table(
        'results_cache',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('table_id', sa.String(255), nullable=False),
        sa.Column('job_id', UUID(as_uuid=True), sa.ForeignKey('etl_jobs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('cache_key', sa.String(255), nullable=False, unique=True),
        sa.Column('data', JSONB, nullable=False),
        sa.Column('record_count', sa.Integer, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False)
    )
    op.create_index('ix_results_cache_table_id', 'results_cache', ['table_id'])
    op.create_index('ix_results_cache_cache_key', 'results_cache', ['cache_key'])

    # Create results_cache_metadata table
    op.create_table(
        'results_cache_metadata',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('table_id', sa.String(255), nullable=False, unique=True),
        sa.Column('job_id', UUID(as_uuid=True), sa.ForeignKey('etl_jobs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('total_records', sa.Integer, nullable=False),
        sa.Column('litigator_count', sa.Integer, default=0, nullable=False),
        sa.Column('cached_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )
    op.create_index('ix_results_cache_metadata_table_id', 'results_cache_metadata', ['table_id'])


def downgrade() -> None:
    # Drop results_cache_metadata table
    op.drop_index('ix_results_cache_metadata_table_id')
    op.drop_table('results_cache_metadata')

    # Drop results_cache table
    op.drop_index('ix_results_cache_cache_key')
    op.drop_index('ix_results_cache_table_id')
    op.drop_table('results_cache')

    # Drop phone_blacklist table
    op.drop_index('ix_phone_blacklist_phone_number')
    op.drop_table('phone_blacklist')

    # Remove table_id and table_title from etl_jobs
    op.drop_index('ix_etl_jobs_table_id')
    op.drop_column('etl_jobs', 'table_title')
    op.drop_column('etl_jobs', 'table_id')
