"""
Health check endpoints
"""

from fastapi import APIRouter
from typing import Dict, Any
from app.core.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Basic health check"""
    return {"status": "healthy"}


@router.get("/health/services")
async def services_health() -> Dict[str, Any]:
    """External services health check"""
    services_status = {
        "snowflake": {"status": "unknown"},
        "google_sheets": {"status": "unknown"},
        "redis": {"status": "unknown"},
    }
    
    # Test Snowflake
    try:
        from app.services.etl.snowflake_service import SnowflakeConnection
        conn = SnowflakeConnection()
        if conn.connect():
            conn.disconnect()
            services_status["snowflake"] = {"status": "connected"}
        else:
            services_status["snowflake"] = {"status": "disconnected"}
    except Exception as e:
        services_status["snowflake"] = {"status": "error", "error": str(e)}
    
    # Test Google Sheets
    try:
        from app.services.etl.google_sheets_service import GoogleSheetsConnection
        conn = GoogleSheetsConnection()
        if conn.connect():
            services_status["google_sheets"] = {"status": "connected"}
        else:
            services_status["google_sheets"] = {"status": "disconnected"}
    except Exception as e:
        services_status["google_sheets"] = {"status": "error", "error": str(e)}
    
    # Test Redis
    try:
        import redis
        r = redis.from_url(settings.redis_url)
        r.ping()
        services_status["redis"] = {"status": "connected"}
    except Exception as e:
        services_status["redis"] = {"status": "error", "error": str(e)}
    
    return services_status

