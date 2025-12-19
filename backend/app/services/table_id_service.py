"""
Table ID Service

Generates human-readable table IDs for ETL job results.
Format: {LoanType}_{MMDDYYYY}_{XXXXXX} where XXXXXX is 6 random digits.
"""

import re
import random
from datetime import datetime
from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.job import ETLJob
from app.core.logger import etl_logger


class TableIDService:
    """
    Service for generating unique table IDs for ETL job results.

    Table IDs follow the format: {LoanType}_{MMDDYYYY}_{XXXXXX}
    where XXXXXX is 6 random digits
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
        """Get current date in MMDDYYYY format."""
        return datetime.now().strftime('%m%d%Y')

    def _get_random_digits(self) -> str:
        """Generate 6 random digits."""
        return ''.join([str(random.randint(0, 9)) for _ in range(6)])

    async def generate_table_id(
        self,
        script_name: str,
        row_count: int,
        db: AsyncSession
    ) -> str:
        """
        Generate a unique table ID for an ETL job.

        Args:
            script_name: Name of the SQL script being executed (e.g., "FHA", "Conventional")
            row_count: Number of rows to process (not used in new format)
            db: Async database session

        Returns:
            Unique table ID in format: LoanType_MMDDYYYY_XXXXXX
            Example: FHA_12182024_847392
        """
        sanitized_name = self._sanitize_name(script_name)
        date_suffix = self._get_date_suffix()
        random_digits = self._get_random_digits()
        table_id = f"{sanitized_name}_{date_suffix}_{random_digits}"

        # Ensure uniqueness (very unlikely to collide with 6 random digits)
        existing = await self._check_table_id_exists(table_id, db)
        max_attempts = 10
        attempts = 0
        while existing and attempts < max_attempts:
            random_digits = self._get_random_digits()
            table_id = f"{sanitized_name}_{date_suffix}_{random_digits}"
            existing = await self._check_table_id_exists(table_id, db)
            attempts += 1

        self.logger.info(f"Generated table_id: {table_id}")
        return table_id

    async def _check_table_id_exists(
        self,
        table_id: str,
        db: AsyncSession
    ) -> bool:
        """Check if a table_id already exists."""
        result = await db.execute(
            select(func.count(ETLJob.id)).where(
                ETLJob.table_id == table_id
            )
        )
        count = result.scalar() or 0
        return count > 0

    def generate_table_id_sync(
        self,
        script_name: str,
        row_count: int,
        existing_count: int = 0
    ) -> str:
        """
        Synchronous version for use in Celery tasks.

        Args:
            script_name: Name of the SQL script (e.g., "FHA", "Conventional")
            row_count: Number of rows to process (not used in new format)
            existing_count: Not used in new format

        Returns:
            Unique table ID in format: LoanType_MMDDYYYY_XXXXXX
            Example: FHA_12182024_847392
        """
        sanitized_name = self._sanitize_name(script_name)
        date_suffix = self._get_date_suffix()
        random_digits = self._get_random_digits()
        return f"{sanitized_name}_{date_suffix}_{random_digits}"


_table_id_service: Optional[TableIDService] = None


def get_table_id_service() -> TableIDService:
    """Get or create TableIDService instance."""
    global _table_id_service
    if _table_id_service is None:
        _table_id_service = TableIDService()
    return _table_id_service
