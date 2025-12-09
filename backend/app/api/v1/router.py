"""
API v1 router
"""

from fastapi import APIRouter
from app.api.v1.endpoints import auth, sql_scripts, config, health, jobs, results

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(sql_scripts.router, tags=["scripts"])
api_router.include_router(config.router, tags=["config"])
api_router.include_router(health.router, tags=["health"])
api_router.include_router(jobs.router, tags=["jobs"])
api_router.include_router(results.router, tags=["results"])

