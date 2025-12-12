"""
FastAPI application entry point
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.logger import etl_logger
from app.websockets.job_events import socketio_app, start_redis_subscriber
import asyncio
from typing import List

# Allowed hosts for domain restriction
ALLOWED_HOSTS: List[str] = [
    "staging.etl.p1lending.io",
    "etl.p1lending.io",
    "localhost",
    "127.0.0.1",
]

# Background task for Redis subscriber
_redis_task = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown"""
    global _redis_task
    # Startup
    try:
        _redis_task = asyncio.create_task(start_redis_subscriber())
        etl_logger.info("Redis subscriber task started")
    except Exception as e:
        etl_logger.error(f"Failed to start Redis subscriber: {e}")

    yield

    # Shutdown
    if _redis_task:
        _redis_task.cancel()
        try:
            await _redis_task
        except asyncio.CancelledError:
            pass
        etl_logger.info("Redis subscriber task stopped")

# Initialize FastAPI app
app = FastAPI(
    title="P1Lending ETL API",
    description="ETL system for mortgage lead data enrichment",
    version="1.0.0",
    lifespan=lifespan
)


@app.middleware("http")
async def validate_host(request: Request, call_next):
    """
    Middleware to restrict access by hostname.
    Blocks direct IP access and only allows configured domains.
    """
    host = request.headers.get("host", "").split(":")[0].lower()

    # Allow health checks regardless of host
    if request.url.path in ["/health", "/"]:
        return await call_next(request)

    # Check if host is in allowed list
    is_allowed = False
    for allowed_host in ALLOWED_HOSTS:
        if host == allowed_host or host.endswith(f".{allowed_host}"):
            is_allowed = True
            break

    # Also allow requests from within Docker network (internal)
    if host in ["backend", "api", "app"]:
        is_allowed = True

    if not is_allowed:
        etl_logger.warning(f"Blocked request from unauthorized host: {host}")
        return JSONResponse(
            status_code=403,
            content={
                "detail": "Direct IP access not allowed. Please use the domain name.",
                "host": host
            }
        )

    return await call_next(request)


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Socket.io app
app.mount("/socket.io", socketio_app)

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "P1Lending ETL API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

# Include routers
from app.api.v1.router import api_router
app.include_router(api_router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

