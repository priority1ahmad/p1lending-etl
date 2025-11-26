@echo off
echo Starting Celery Worker...
cd backend
call venv\Scripts\activate

echo Checking Redis connection...
python -c "from app.workers.celery_app import validate_redis_connection; validate_redis_connection()"
if errorlevel 1 (
    echo ERROR: Redis connection failed. Please ensure Redis is running.
    pause
    exit /b 1
)

echo Redis connection OK. Starting Celery worker...
rem Use solo pool for Windows compatibility
celery -A app.workers.celery_app worker --loglevel=info --pool=solo --concurrency=1
pause


