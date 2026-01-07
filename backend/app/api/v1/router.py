"""
API v1 router
"""

from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    sql_scripts,
    health,
    jobs,
    results,
    blacklist,
    users,
    # file_sources,
    # file_uploads,
    dev,
    crm_import,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(sql_scripts.router, tags=["scripts"])
api_router.include_router(health.router, tags=["health"])
api_router.include_router(jobs.router, tags=["jobs"])
api_router.include_router(results.router, tags=["results"])
api_router.include_router(blacklist.router, tags=["blacklist"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
# File Sources feature disabled - uncomment to re-enable
# api_router.include_router(file_sources.router, tags=["file-sources"])
# api_router.include_router(file_uploads.router, tags=["file-uploads"])
api_router.include_router(dev.router, tags=["dev"])
api_router.include_router(crm_import.router, tags=["crm"])
