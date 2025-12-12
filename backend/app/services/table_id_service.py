"""
Table ID Service

Generates human-readable table IDs for ETL job results.
Format: {ScriptName}_{RowCount}_{DDMMYYYY} with sequence numbers for duplicates.
"""

import re
from datetime import datetime
from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.job import ETLJob
from app.core.logger import etl_logger


class TableIDService:
    """
    Service for generating unique table IDs for ETL job results.

    Table IDs follow the format: {ScriptName}_{RowCount}_{DDMMYYYY}
    If the same combination exists, a sequence number is added: {ScriptName}_{RowCount}_{DDMMYYYY}_2
    """

    def __init__(self):
        self.logger = etl_logger.logger.getChild("TableIDService")

    def _sanitize_name(self, name: str) -> str:
        """
        Sanitize script name for use in table ID.

        Removes spaces, special characters, and limits length.
        """
        if name.endswith('.sql'):
            name = name[:-4]

        sanitized = re.sub(r'[^a-zA-Z0-9]', '_', name)
        sanitized = re.sub(r'_+', '_', sanitized)
        sanitized = sanitized.strip('_')

        if len(sanitized) > 50:
            sanitized = sanitized[:50]

        return sanitized

    def _get_date_suffix(self) -> str:
        """Get current date in DDMMYYYY format."""
        return datetime.now().strftime('%d%m%Y')

    async def generate_table_id(
        self,
        script_name: str,
        row_count: int,
        db: AsyncSession
    ) -> str:
        """
        Generate a unique table ID for an ETL job.

        Args:
            script_name: Name of the SQL script being executed
            row_count: Number of rows to process (from row_limit)
            db: Async database session

        Returns:
            Unique table ID in format: ScriptName_RowCount_DDMMYYYY or
            ScriptName_RowCount_DDMMYYYY_N for duplicates
        """
        sanitized_name = self._sanitize_name(script_name)
        date_suffix = self._get_date_suffix()
        base_id = f"{sanitized_name}_{row_count}_{date_suffix}"

        sequence_count = await self._count_existing_with_base(base_id, db)

        if sequence_count == 0:
            table_id = base_id
        else:
            table_id = f"{base_id}_{sequence_count + 1}"

        self.logger.info(f"Generated table_id: {table_id}")
        return table_id

    async def _count_existing_with_base(
        self,
        base_id: str,
        db: AsyncSession
    ) -> int:
        """Count existing table_ids that match the base pattern."""
        pattern = f"{base_id}%"

        result = await db.execute(
            select(func.count(ETLJob.id)).where(
                ETLJob.table_id.like(pattern)
            )
        )
        count = result.scalar() or 0
        return count

    def generate_table_id_sync(
        self,
        script_name: str,
        row_count: int,
        existing_count: int = 0
    ) -> str:
        """
        Synchronous version for use in Celery tasks.

        Args:
            script_name: Name of the SQL script
            row_count: Number of rows to process
            existing_count: Number of existing table_ids with same base (pre-fetched)

        Returns:
            Unique table ID
        """
        sanitized_name = self._sanitize_name(script_name)
        date_suffix = self._get_date_suffix()
        base_id = f"{sanitized_name}_{row_count}_{date_suffix}"

        if existing_count == 0:
            return base_id
        else:
            return f"{base_id}_{existing_count + 1}"


_table_id_service: Optional[TableIDService] = None


def get_table_id_service() -> TableIDService:
    """Get or create TableIDService instance."""
    global _table_id_service
    if _table_id_service is None:
        _table_id_service = TableIDService()
    return _table_id_service
