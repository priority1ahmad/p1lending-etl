"""
Retry utilities with exponential backoff and circuit breaker pattern.
"""

import time
import random
import functools
import threading
import requests
from typing import Callable, Tuple


class RateLimitExceeded(Exception):
    """Raised when API rate limit is hit (HTTP 429) and max retries exceeded"""

    pass


class CircuitBreakerOpen(Exception):
    """Raised when circuit breaker is open (blocking requests)"""

    pass


def exponential_backoff_retry(
    max_retries: int = 4,
    base_delay: float = 1.0,
    max_delay: float = 30.0,
    exponential_base: float = 2.0,
    jitter: bool = True,
    retry_on: Tuple = (requests.exceptions.HTTPError, requests.exceptions.Timeout),
    logger=None,
):
    """
    Decorator for exponential backoff retry with jitter.

    Delay formula: min(base_delay * (exponential_base ** attempt) + jitter, max_delay)

    Attempts: 0, 1, 2, 3
    Delays:   1s, 2s, 4s, 8s (with jitter: ±20%)

    Args:
        max_retries: Maximum retry attempts (default 4)
        base_delay: Initial delay in seconds (default 1.0)
        max_delay: Maximum delay cap (default 30.0)
        exponential_base: Multiplier for each retry (default 2.0)
        jitter: Add random jitter to prevent thundering herd (default True)
        retry_on: Exception types to retry on
        logger: Logger instance for logging retry attempts
    """

    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except retry_on as e:
                    # Check if this is a rate limit error (HTTP 429)
                    is_rate_limit = False
                    if hasattr(e, "response") and e.response is not None:
                        if e.response.status_code == 429:
                            is_rate_limit = True

                    if attempt >= max_retries:
                        if is_rate_limit:
                            raise RateLimitExceeded(
                                f"Rate limit exceeded after {max_retries} retries"
                            ) from e
                        raise

                    # Calculate delay with exponential backoff
                    delay = min(base_delay * (exponential_base**attempt), max_delay)

                    # Add jitter (±20% randomness)
                    if jitter:
                        jitter_amount = delay * 0.2
                        delay += random.uniform(-jitter_amount, jitter_amount)

                    if logger:
                        logger.warning(
                            f"⚠️ Attempt {attempt + 1}/{max_retries} failed: {e}. "
                            f"Retrying in {delay:.2f}s... "
                            f"{'[RATE LIMIT]' if is_rate_limit else ''}"
                        )

                    time.sleep(delay)

        return wrapper

    return decorator


class CircuitBreaker:
    """
    Circuit breaker to prevent cascading failures.

    States:
    - CLOSED: Normal operation, requests allowed
    - OPEN: Failure threshold exceeded, block all requests
    - HALF_OPEN: Testing if service recovered, allow limited requests

    Transitions:
    - CLOSED → OPEN: When failure_threshold exceeded
    - OPEN → HALF_OPEN: After recovery_timeout seconds
    - HALF_OPEN → CLOSED: When success_threshold met
    - HALF_OPEN → OPEN: When any failure occurs
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: float = 60.0,
        success_threshold: int = 2,
        logger=None,
    ):
        """
        Args:
            failure_threshold: Number of failures before opening circuit
            recovery_timeout: Seconds to wait before trying HALF_OPEN state
            success_threshold: Number of successes to close circuit from HALF_OPEN
            logger: Logger instance
        """
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.success_threshold = success_threshold
        self.logger = logger

        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time = None
        self._state = "CLOSED"
        self._lock = threading.Lock()

    def call(self, func: Callable, *args, **kwargs):
        """Execute function with circuit breaker protection"""
        with self._lock:
            # Check if circuit should transition to HALF_OPEN
            if self._state == "OPEN":
                if (
                    self._last_failure_time
                    and time.time() - self._last_failure_time >= self.recovery_timeout
                ):
                    self._state = "HALF_OPEN"
                    self._success_count = 0
                    if self.logger:
                        self.logger.info("🔄 Circuit breaker entering HALF_OPEN state")
                else:
                    time_remaining = (
                        self.recovery_timeout - (time.time() - self._last_failure_time)
                        if self._last_failure_time
                        else 0
                    )
                    raise CircuitBreakerOpen(
                        f"Circuit breaker is OPEN. Will retry in {time_remaining:.1f}s"
                    )

        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except Exception:
            self._on_failure()
            raise

    def _on_success(self):
        """Handle successful call"""
        with self._lock:
            if self._state == "HALF_OPEN":
                self._success_count += 1
                if self._success_count >= self.success_threshold:
                    self._state = "CLOSED"
                    self._failure_count = 0
                    if self.logger:
                        self.logger.info("✅ Circuit breaker transitioned to CLOSED")
            elif self._state == "CLOSED":
                self._failure_count = 0

    def _on_failure(self):
        """Handle failed call"""
        with self._lock:
            self._last_failure_time = time.time()

            if self._state == "HALF_OPEN":
                self._state = "OPEN"
                if self.logger:
                    self.logger.warning("⚠️ Circuit breaker re-opened from HALF_OPEN")
            else:
                self._failure_count += 1
                if self._failure_count >= self.failure_threshold:
                    self._state = "OPEN"
                    if self.logger:
                        self.logger.error(
                            f"🔴 Circuit breaker OPENED after {self._failure_count} failures"
                        )
