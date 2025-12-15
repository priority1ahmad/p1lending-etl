"""
Account lockout mechanism to prevent brute-force attacks.

Locks accounts after MAX_ATTEMPTS failed login attempts for LOCKOUT_DURATION seconds.
Sends NTFY notification to admin when an account is locked.
"""

import redis.asyncio as aioredis
from typing import Optional
from app.core.config import settings
from app.core.logger import etl_logger


class AccountLockout:
    """Manages account lockout state in Redis."""

    MAX_ATTEMPTS: int = 5
    LOCKOUT_DURATION: int = 900  # 15 minutes in seconds

    _instance: Optional["AccountLockout"] = None
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

    async def record_failed_attempt(self, email: str, ip_address: str) -> int:
        """
        Record a failed login attempt.

        Args:
            email: The email address that failed to login
            ip_address: The IP address of the failed attempt

        Returns:
            The current number of failed attempts
        """
        redis = await self._get_redis()
        key = f"login_failures:{email.lower()}"

        # Increment failure count
        count = await redis.incr(key)

        # Set expiry on first failure
        if count == 1:
            await redis.expire(key, self.LOCKOUT_DURATION)

        etl_logger.warning(
            f"Failed login attempt {count}/{self.MAX_ATTEMPTS} for {email} from {ip_address}"
        )

        # Lock account if max attempts reached
        if count >= self.MAX_ATTEMPTS:
            await self._lock_account(email, ip_address)

        return count

    async def _lock_account(self, email: str, ip_address: str) -> None:
        """Lock an account and send notification."""
        redis = await self._get_redis()
        lock_key = f"account_locked:{email.lower()}"
        await redis.setex(lock_key, self.LOCKOUT_DURATION, "1")

        etl_logger.warning(
            f"Account LOCKED: {email} after {self.MAX_ATTEMPTS} failed attempts from {ip_address}"
        )

        # Send NTFY notification
        await self._send_lockout_notification(email, ip_address)

    async def _send_lockout_notification(self, email: str, ip_address: str) -> None:
        """Send NTFY notification about account lockout."""
        try:
            from app.services.ntfy_service import get_ntfy_events, NtfyPriority

            ntfy_events = get_ntfy_events()
            await ntfy_events.ntfy.send(
                topic=ntfy_events.topics.topic_auth,
                title="Account Locked - Security Alert",
                message=(
                    f"Account locked due to repeated failed login attempts.\n\n"
                    f"Email: {email}\n"
                    f"IP Address: {ip_address}\n"
                    f"Failed Attempts: {self.MAX_ATTEMPTS}\n"
                    f"Lockout Duration: {self.LOCKOUT_DURATION // 60} minutes"
                ),
                priority=NtfyPriority.HIGH,
                tags=["warning", "lock", "security"],
            )
        except Exception as e:
            # Don't fail the login flow if notification fails
            etl_logger.error(f"Failed to send lockout notification: {e}")

    async def is_locked(self, email: str) -> bool:
        """
        Check if an account is locked.

        Args:
            email: The email address to check

        Returns:
            True if the account is locked, False otherwise
        """
        redis = await self._get_redis()
        key = f"account_locked:{email.lower()}"
        result = await redis.exists(key)
        return result > 0

    async def get_remaining_lockout_time(self, email: str) -> int:
        """
        Get remaining lockout time in seconds.

        Args:
            email: The email address to check

        Returns:
            Remaining seconds, or 0 if not locked
        """
        redis = await self._get_redis()
        key = f"account_locked:{email.lower()}"
        ttl = await redis.ttl(key)
        return max(0, ttl)

    async def clear_failures(self, email: str) -> None:
        """
        Clear failure count on successful login.

        Args:
            email: The email address to clear
        """
        redis = await self._get_redis()
        key = f"login_failures:{email.lower()}"
        await redis.delete(key)
        etl_logger.debug(f"Cleared login failures for {email}")

    async def close(self) -> None:
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
            self._redis = None


# Singleton instance
account_lockout = AccountLockout()


async def get_account_lockout() -> AccountLockout:
    """Dependency injection helper for FastAPI."""
    return account_lockout
