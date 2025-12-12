"""
Phone Blacklist Service

Manages the phone blacklist for filtering out known litigators before ETL processing.
"""

import re
from typing import List, Dict, Any, Optional, Set
from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert

from app.db.models.phone_blacklist import PhoneBlacklist
from app.core.logger import etl_logger


class PhoneBlacklistService:
    """
    Service for managing phone blacklist operations.

    Provides methods to add/remove phones from blacklist and filter
    phone lists against the blacklist before ETL processing.
    """

    def __init__(self):
        self.logger = etl_logger.logger.getChild("BlacklistService")

    def _normalize_phone(self, phone: str) -> Optional[str]:
        """Normalize phone number to 10-digit format."""
        if not phone:
            return None

        if isinstance(phone, (list, tuple)):
            phone = str(phone[1] if len(phone) > 1 else phone[0])
        else:
            phone = str(phone)

        digits = re.sub(r'\D', '', phone)

        if len(digits) == 11 and digits.startswith('1'):
            digits = digits[1:]

        if len(digits) == 10:
            return digits

        return None

    async def add_phones_to_blacklist(
        self,
        phone_numbers: List[str],
        reason: str,
        db: AsyncSession,
        source_table_id: Optional[str] = None,
        source_job_id: Optional[str] = None,
        added_by: Optional[str] = None
    ) -> int:
        """
        Add multiple phones to the blacklist.

        Uses INSERT ON CONFLICT to handle duplicates gracefully.
        """
        added_count = 0

        for phone in phone_numbers:
            normalized = self._normalize_phone(phone)
            if not normalized:
                continue

            try:
                stmt = insert(PhoneBlacklist).values(
                    phone_number=normalized,
                    reason=reason,
                    source_table_id=source_table_id,
                    source_job_id=source_job_id,
                    added_by=added_by
                ).on_conflict_do_nothing(index_elements=['phone_number'])

                result = await db.execute(stmt)
                if result.rowcount > 0:
                    added_count += 1

            except Exception as e:
                self.logger.warning(f"Error adding phone {normalized} to blacklist: {e}")
                continue

        await db.commit()
        self.logger.info(f"Added {added_count} phones to blacklist (reason: {reason})")
        return added_count

    async def is_phone_blacklisted(self, phone: str, db: AsyncSession) -> bool:
        """Check if a single phone is in the blacklist."""
        normalized = self._normalize_phone(phone)
        if not normalized:
            return False

        result = await db.execute(
            select(PhoneBlacklist.id).where(
                PhoneBlacklist.phone_number == normalized
            ).limit(1)
        )
        return result.scalar() is not None

    async def get_blacklisted_phones(
        self,
        phones: List[str],
        db: AsyncSession
    ) -> Set[str]:
        """Get set of phones that are blacklisted from the given list."""
        normalized_phones = []
        for phone in phones:
            normalized = self._normalize_phone(phone)
            if normalized:
                normalized_phones.append(normalized)

        if not normalized_phones:
            return set()

        result = await db.execute(
            select(PhoneBlacklist.phone_number).where(
                PhoneBlacklist.phone_number.in_(normalized_phones)
            )
        )

        return set(row[0] for row in result.fetchall())

    async def filter_blacklisted_phones(
        self,
        phones: List[str],
        db: AsyncSession
    ) -> List[str]:
        """Filter out blacklisted phones from a list."""
        blacklisted = await self.get_blacklisted_phones(phones, db)

        clean_phones = []
        for phone in phones:
            normalized = self._normalize_phone(phone)
            if normalized and normalized not in blacklisted:
                clean_phones.append(phone)

        filtered_count = len(phones) - len(clean_phones)
        if filtered_count > 0:
            self.logger.info(f"Filtered {filtered_count} blacklisted phones from {len(phones)} total")

        return clean_phones

    async def remove_from_blacklist(
        self,
        phone_numbers: List[str],
        db: AsyncSession
    ) -> int:
        """Remove phones from the blacklist."""
        normalized_phones = []
        for phone in phone_numbers:
            normalized = self._normalize_phone(phone)
            if normalized:
                normalized_phones.append(normalized)

        if not normalized_phones:
            return 0

        result = await db.execute(
            delete(PhoneBlacklist).where(
                PhoneBlacklist.phone_number.in_(normalized_phones)
            )
        )

        await db.commit()
        removed = result.rowcount
        self.logger.info(f"Removed {removed} phones from blacklist")
        return removed

    async def get_blacklist_stats(self, db: AsyncSession) -> Dict[str, Any]:
        """Get statistics about the phone blacklist."""
        total_result = await db.execute(
            select(func.count(PhoneBlacklist.id))
        )
        total = total_result.scalar() or 0

        reason_result = await db.execute(
            select(
                PhoneBlacklist.reason,
                func.count(PhoneBlacklist.id)
            ).group_by(PhoneBlacklist.reason)
        )
        by_reason = {row[0]: row[1] for row in reason_result.fetchall()}

        return {
            "total": total,
            "by_reason": by_reason,
            "litigator_count": by_reason.get("litigator", 0),
            "manual_count": by_reason.get("manual", 0),
            "dnc_count": by_reason.get("dnc", 0)
        }

    async def get_blacklist_entries(
        self,
        db: AsyncSession,
        offset: int = 0,
        limit: int = 100,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get paginated blacklist entries."""
        query = select(PhoneBlacklist).order_by(PhoneBlacklist.created_at.desc())

        if reason:
            query = query.where(PhoneBlacklist.reason == reason)

        count_query = select(func.count(PhoneBlacklist.id))
        if reason:
            count_query = count_query.where(PhoneBlacklist.reason == reason)
        count_result = await db.execute(count_query)
        total = count_result.scalar() or 0

        query = query.offset(offset).limit(limit)
        result = await db.execute(query)
        entries = result.scalars().all()

        return {
            "entries": [
                {
                    "id": str(e.id),
                    "phone_number": e.phone_number,
                    "reason": e.reason,
                    "source_table_id": e.source_table_id,
                    "created_at": e.created_at.isoformat() if e.created_at else None
                }
                for e in entries
            ],
            "total": total,
            "offset": offset,
            "limit": limit
        }


class PhoneBlacklistServiceSync:
    """Synchronous wrapper for use in Celery tasks."""

    def __init__(self):
        self.logger = etl_logger.logger.getChild("BlacklistServiceSync")

    def _normalize_phone(self, phone: str) -> Optional[str]:
        """Normalize phone to 10-digit format."""
        if not phone:
            return None

        if isinstance(phone, (list, tuple)):
            phone = str(phone[1] if len(phone) > 1 else phone[0])
        else:
            phone = str(phone)

        digits = re.sub(r'\D', '', phone)

        if len(digits) == 11 and digits.startswith('1'):
            digits = digits[1:]

        if len(digits) == 10:
            return digits

        return None

    def get_blacklisted_phones_sync(
        self,
        phones: List[str],
        db_session
    ) -> Set[str]:
        """Synchronous version to get blacklisted phones."""
        from sqlalchemy import select as sync_select

        normalized_phones = []
        for phone in phones:
            normalized = self._normalize_phone(phone)
            if normalized:
                normalized_phones.append(normalized)

        if not normalized_phones:
            return set()

        result = db_session.execute(
            sync_select(PhoneBlacklist.phone_number).where(
                PhoneBlacklist.phone_number.in_(normalized_phones)
            )
        )

        return set(row[0] for row in result.fetchall())

    def load_all_blacklisted_phones_sync(self, db_session) -> Set[str]:
        """Load ALL blacklisted phone numbers from database."""
        from sqlalchemy import select as sync_select

        result = db_session.execute(
            sync_select(PhoneBlacklist.phone_number)
        )

        return set(row[0] for row in result.fetchall())


_blacklist_service: Optional[PhoneBlacklistService] = None
_blacklist_service_sync: Optional[PhoneBlacklistServiceSync] = None


def get_blacklist_service() -> PhoneBlacklistService:
    """Get or create async PhoneBlacklistService instance."""
    global _blacklist_service
    if _blacklist_service is None:
        _blacklist_service = PhoneBlacklistService()
    return _blacklist_service


def get_blacklist_service_sync() -> PhoneBlacklistServiceSync:
    """Get or create sync PhoneBlacklistService instance."""
    global _blacklist_service_sync
    if _blacklist_service_sync is None:
        _blacklist_service_sync = PhoneBlacklistServiceSync()
    return _blacklist_service_sync
