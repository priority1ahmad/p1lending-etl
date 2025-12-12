---
allowed-tools: Read, Grep, Glob, Bash(docker-compose:* logs)
description: Trace an ETL job through the system
argument-hint: <job-id>
---

## Task
Trace ETL job $1 through the entire pipeline.

## Trace Points

### 1. Job Creation
- Check @backend/app/api/v1/endpoints/jobs.py for job start
- Review JobCreate schema in @backend/app/schemas/job.py

### 2. Celery Task
- Check @backend/app/workers/etl_tasks.py for task execution
- Review celery logs: `docker-compose -f docker-compose.prod.yml logs celery-worker`

### 3. ETL Engine
- Check @backend/app/services/etl/engine.py for processing flow
- Look for job_id in log messages

### 4. External APIs
- Snowflake: @backend/app/services/etl/snowflake_service.py
- idiCORE: @backend/app/services/etl/idicore_service.py
- CCC: @backend/app/services/etl/ccc_service.py
- DNC: @backend/app/services/etl/dnc_service.py

### 5. WebSocket Events
- Check @backend/app/websockets/job_events.py for progress updates

### 6. Job Completion
- Check job log file: `backend/logs/etl_job_$1.log`
- Review database for final status
