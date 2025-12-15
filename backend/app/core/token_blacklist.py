"""
Redis-backed JWT token blacklist for secure logout.

When a user logs out, their token JTI (JWT ID) is added to Redis with a TTL
matching the token's remaining lifetime. On each authenticated request,
the token is checked against the blacklist.
"""

import redis.asyncio as aioredis
from typing import Optional
from app.core.config import settings
from app.core.logger import etl_logger


class TokenBlacklist:
    """Manages blacklisted JWT tokens in Redis."""

    _instance: Optional["TokenBlacklist"] = None
    _redis: Optional[aioredis.Redis] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    async def _get_redis(self) -> aioredis.Redis:
        """Get or create Redis connection."""
        if self._redis is None:
            self._redis = aioredis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
        return self._redis

    async def blacklist_token(self, jti: str, expires_in: int) -> None:
        """
        Add a token JTI to the blacklist.

        Args:
            jti: The JWT ID (unique identifier) from the token
            expires_in: Seconds until the token would naturally expire
        """
        if expires_in <= 0:
            return  # Token already expired, no need to blacklist

        redis = await self._get_redis()
        key = f"token_blacklist:{jti}"
        await redis.setex(key, expires_in, "1")
        etl_logger.debug(f"Token blacklisted: {jti[:8]}... (expires in {expires_in}s)")

    async def is_blacklisted(self, jti: str) -> bool:
        """
        Check if a token JTI is blacklisted.

        Args:
            jti: The JWT ID to check

        Returns:
            True if the token is blacklisted, False otherwise
        """
        redis = await self._get_redis()
        key = f"token_blacklist:{jti}"
        result = await redis.exists(key)
        return result > 0

    async def close(self) -> None:
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
            self._redis = None


# Singleton instance
token_blacklist = TokenBlacklist()


async def get_token_blacklist() -> TokenBlacklist:
    """Dependency injection helper for FastAPI."""
    return token_blacklist
