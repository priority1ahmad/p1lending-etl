"""
Results Cache Service

Caches ETL job results in PostgreSQL for fast retrieval.
Maintains only the last 3 runs to manage storage.
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert

from app.db.models.results_cache import ResultsCache, ResultsCacheMetadata
from app.core.logger import etl_logger


class ResultsCacheService:
    """
    Service for caching ETL results in PostgreSQL.

    Caches results from Snowflake MASTER_PROCESSED_DB for fast retrieval.
    Only keeps the last 3 runs; older caches are evicted automatically.
    """

    MAX_CACHED_RUNS = 3
    CACHE_EXPIRY_HOURS = 24
    CHUNK_SIZE = 1000  # Records per cache entry

    def __init__(self):
        self.logger = etl_logger.logger.getChild("ResultsCacheService")

    async def cache_results(
        self,
        table_id: str,
        job_id: str,
        records: List[Dict[str, Any]],
        total_records: int,
        litigator_count: int,
        db: AsyncSession,
    ) -> bool:
        """
        Cache results for a completed job.

        Args:
            table_id: The table_id for this run
            job_id: The ETL job UUID
            records: List of result records to cache
            total_records: Total record count
            litigator_count: Count of litigator records
            db: Async database session

        Returns:
            True if caching successful
        """
        try:
            # First, evict old caches if needed
            await self._evict_old_caches(db)

            # Calculate expiry
            expires_at = datetime.utcnow() + timedelta(hours=self.CACHE_EXPIRY_HOURS)

            # Store records in chunks
            for i in range(0, len(records), self.CHUNK_SIZE):
                chunk = records[i : i + self.CHUNK_SIZE]
                offset = i
                cache_key = f"{table_id}_{offset}_{self.CHUNK_SIZE}"

                # Use upsert to handle re-caching
                stmt = (
                    insert(ResultsCache)
                    .values(
                        table_id=table_id,
                        job_id=job_id,
                        cache_key=cache_key,
                        data=chunk,
                        record_count=len(chunk),
                        expires_at=expires_at,
                    )
                    .on_conflict_do_update(
                        index_elements=["cache_key"],
                        set_={
                            "data": chunk,
                            "record_count": len(chunk),
                            "expires_at": expires_at,
                            "created_at": func.now(),
                        },
                    )
                )
                await db.execute(stmt)

            # Update metadata
            stmt = (
                insert(ResultsCacheMetadata)
                .values(
                    table_id=table_id,
                    job_id=job_id,
                    total_records=total_records,
                    litigator_count=litigator_count,
                )
                .on_conflict_do_update(
                    index_elements=["table_id"],
                    set_={
                        "total_records": total_records,
                        "litigator_count": litigator_count,
                        "cached_at": func.now(),
                    },
                )
            )
            await db.execute(stmt)

            await db.commit()
            self.logger.info(f"Cached {len(records)} records for table_id: {table_id}")
            return True

        except Exception as e:
            self.logger.error(f"Error caching results: {e}")
            await db.rollback()
            return False

    async def get_cached_results(
        self, table_id: str, offset: int, limit: int, db: AsyncSession
    ) -> Optional[Dict[str, Any]]:
        """
        Get cached results for a table_id.

        Args:
            table_id: The table_id to retrieve
            offset: Pagination offset
            limit: Maximum records to return
            db: Async database session

        Returns:
            Dict with records, total, offset, limit or None if not cached
        """
        try:
            # Check if this table_id is cached
            meta_result = await db.execute(
                select(ResultsCacheMetadata).where(ResultsCacheMetadata.table_id == table_id)
            )
            metadata = meta_result.scalar_one_or_none()

            if not metadata:
                return None

            # Calculate which cache chunks we need
            (offset // self.CHUNK_SIZE) * self.CHUNK_SIZE
            offset + limit

            # Fetch relevant cache entries
            result = await db.execute(
                select(ResultsCache)
                .where(
                    ResultsCache.table_id == table_id, ResultsCache.expires_at > datetime.utcnow()
                )
                .order_by(ResultsCache.cache_key)
            )
            cache_entries = result.scalars().all()

            if not cache_entries:
                # Cache expired
                return None

            # Combine all records and apply pagination
            all_records = []
            for entry in cache_entries:
                all_records.extend(entry.data)

            # Apply offset and limit
            paginated = all_records[offset : offset + limit]

            return {
                "records": paginated,
                "total": metadata.total_records,
                "offset": offset,
                "limit": limit,
                "litigator_count": metadata.litigator_count,
                "cached": True,
                "cached_at": metadata.cached_at.isoformat() if metadata.cached_at else None,
            }

        except Exception as e:
            self.logger.error(f"Error retrieving cached results: {e}")
            return None

    async def is_cached(self, table_id: str, db: AsyncSession) -> bool:
        """Check if a table_id is cached and not expired."""
        result = await db.execute(
            select(ResultsCacheMetadata.id).where(ResultsCacheMetadata.table_id == table_id)
        )
        if not result.scalar():
            return False

        # Check if any cache entries are still valid
        cache_result = await db.execute(
            select(func.count(ResultsCache.id)).where(
                ResultsCache.table_id == table_id, ResultsCache.expires_at > datetime.utcnow()
            )
        )
        return (cache_result.scalar() or 0) > 0

    async def invalidate_cache(self, table_id: str, db: AsyncSession) -> bool:
        """Invalidate cache for a specific table_id."""
        try:
            await db.execute(delete(ResultsCache).where(ResultsCache.table_id == table_id))
            await db.execute(
                delete(ResultsCacheMetadata).where(ResultsCacheMetadata.table_id == table_id)
            )
            await db.commit()
            self.logger.info(f"Invalidated cache for table_id: {table_id}")
            return True
        except Exception as e:
            self.logger.error(f"Error invalidating cache: {e}")
            await db.rollback()
            return False

    async def _evict_old_caches(self, db: AsyncSession) -> None:
        """Evict oldest caches if more than MAX_CACHED_RUNS exist."""
        try:
            # Count current cached runs
            count_result = await db.execute(select(func.count(ResultsCacheMetadata.id)))
            current_count = count_result.scalar() or 0

            if current_count >= self.MAX_CACHED_RUNS:
                # Get oldest cached runs to evict
                evict_count = current_count - self.MAX_CACHED_RUNS + 1
                oldest_result = await db.execute(
                    select(ResultsCacheMetadata.table_id)
                    .order_by(ResultsCacheMetadata.cached_at.asc())
                    .limit(evict_count)
                )
                oldest_table_ids = [row[0] for row in oldest_result.fetchall()]

                for table_id in oldest_table_ids:
                    await db.execute(delete(ResultsCache).where(ResultsCache.table_id == table_id))
                    await db.execute(
                        delete(ResultsCacheMetadata).where(
                            ResultsCacheMetadata.table_id == table_id
                        )
                    )

                self.logger.info(f"Evicted {len(oldest_table_ids)} old cache entries")

            # Also clean up expired entries
            await db.execute(
                delete(ResultsCache).where(ResultsCache.expires_at < datetime.utcnow())
            )

        except Exception as e:
            self.logger.error(f"Error evicting old caches: {e}")

    async def get_cached_table_ids(self, db: AsyncSession) -> List[Dict[str, Any]]:
        """Get list of currently cached table_ids with metadata."""
        result = await db.execute(
            select(ResultsCacheMetadata).order_by(ResultsCacheMetadata.cached_at.desc())
        )
        entries = result.scalars().all()

        return [
            {
                "table_id": e.table_id,
                "job_id": str(e.job_id),
                "total_records": e.total_records,
                "litigator_count": e.litigator_count,
                "cached_at": e.cached_at.isoformat() if e.cached_at else None,
            }
            for e in entries
        ]


_results_cache_service: Optional[ResultsCacheService] = None


def get_results_cache_service() -> ResultsCacheService:
    """Get or create ResultsCacheService instance."""
    global _results_cache_service
    if _results_cache_service is None:
        _results_cache_service = ResultsCacheService()
    return _results_cache_service
