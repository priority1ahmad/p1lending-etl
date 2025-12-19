"""
Celery application configuration
"""

import sys
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "p1lending_etl",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.workers.etl_tasks"],
)

# Windows compatibility: force solo pool
if sys.platform == "win32":
    worker_pool = "solo"
else:
    worker_pool = "prefork"

celery_app.conf.update(
    # ============================================================
    # SECURITY CRITICAL: JSON-ONLY SERIALIZATION
    # ============================================================
    # DO NOT change these serializers to 'pickle' or any binary format!
    # Binary serialization allows Remote Code Execution (RCE) attacks.
    #
    # Reference vulnerabilities:
    # - CVE-2025-61765: python-socketio deserialization RCE
    # - Celery pickle deserialization attacks
    #
    # JSON is inherently safe as it only supports primitive types.
    # ============================================================
    task_serializer="json",
    accept_content=["json"],  # NEVER add "pickle" to this list!
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600 * 24,  # 24 hours
    worker_prefetch_multiplier=1,
    # Note: worker_pool should be specified at worker startup, not in config
    # Disable prefork on Windows
    worker_disable_rate_limits=True,
)


def validate_redis_connection():
    """
    Validate Redis connection before Celery starts.
    Raises ConnectionError if Redis is not accessible.
    """
    try:
        import redis
        from app.core.logger import etl_logger

        r = redis.from_url(settings.redis_url)
        r.ping()
        etl_logger.info("Redis connection validated successfully")
        return True
    except Exception as e:
        from app.core.logger import etl_logger

        etl_logger.error(f"Failed to connect to Redis: {e}")
        raise ConnectionError(f"Cannot connect to Redis at {settings.redis_url}: {e}")
