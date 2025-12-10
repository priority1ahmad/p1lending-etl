"""
Health check endpoints
"""

from fastapi import APIRouter, Depends
from typing import Dict, Any
from datetime import datetime
from app.core.config import settings
from app.api.v1.deps import get_current_user
from app.db.models.user import User

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Basic health check - public endpoint for load balancer"""
    return {"status": "healthy"}


@router.get("/health/services")
async def services_health(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """External services health check with timestamps"""
    now = datetime.utcnow().isoformat() + "Z"

    services_status = {
        "snowflake": {"status": "unknown", "last_checked": now},
        "redis": {"status": "unknown", "last_checked": now},
        "postgresql": {"status": "unknown", "last_checked": now},
        "celery": {"status": "unknown", "last_checked": now},
        "ntfy": {"status": "unknown", "last_checked": now},
    }

    # Test Snowflake
    try:
        from app.services.etl.snowflake_service import SnowflakeConnection
        conn = SnowflakeConnection()
        if conn.connect():
            conn.disconnect()
            services_status["snowflake"] = {"status": "connected", "last_checked": now}
        else:
            services_status["snowflake"] = {"status": "disconnected", "last_checked": now}
    except Exception as e:
        services_status["snowflake"] = {"status": "error", "error": str(e)[:100], "last_checked": now}

    # Test Redis
    try:
        import redis
        r = redis.from_url(settings.redis_url)
        r.ping()
        services_status["redis"] = {"status": "connected", "last_checked": now}
    except Exception as e:
        services_status["redis"] = {"status": "error", "error": str(e)[:100], "last_checked": now}

    # Test PostgreSQL
    try:
        from sqlalchemy import create_engine, text
        # Use sync engine for simple health check
        sync_url = settings.database_url.replace("+asyncpg", "")
        engine = create_engine(sync_url)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine.dispose()
        services_status["postgresql"] = {"status": "connected", "last_checked": now}
    except Exception as e:
        services_status["postgresql"] = {"status": "error", "error": str(e)[:100], "last_checked": now}

    # Test Celery
    try:
        from app.workers.celery_app import celery_app
        inspect = celery_app.control.inspect(timeout=2.0)
        active_workers = inspect.ping()
        if active_workers:
            worker_count = len(active_workers)
            services_status["celery"] = {
                "status": "connected",
                "workers": worker_count,
                "last_checked": now
            }
        else:
            services_status["celery"] = {"status": "disconnected", "error": "No active workers", "last_checked": now}
    except Exception as e:
        services_status["celery"] = {"status": "error", "error": str(e)[:100], "last_checked": now}

    # Test NTFY
    try:
        if settings.ntfy.enabled:
            import httpx
            ntfy_url = settings.ntfy.base_url.rstrip("/")
            # Just check if the NTFY server is reachable
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{ntfy_url}/")
                if response.status_code in (200, 301, 302, 404):
                    services_status["ntfy"] = {"status": "connected", "last_checked": now}
                else:
                    services_status["ntfy"] = {
                        "status": "error",
                        "error": f"HTTP {response.status_code}",
                        "last_checked": now
                    }
        else:
            services_status["ntfy"] = {"status": "disconnected", "error": "Disabled", "last_checked": now}
    except Exception as e:
        services_status["ntfy"] = {"status": "error", "error": str(e)[:100], "last_checked": now}

    return services_status

