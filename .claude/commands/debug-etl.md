---
allowed-tools: Read, Grep, Glob, Bash(docker-compose:* logs)
description: Debug ETL job issues
argument-hint: [job-id]
---

## Task
Debug ETL job issues for job ID: $1

## Investigation Steps
1. Check job logs: `backend/logs/etl_job_$1.log`
2. Review Celery worker logs
3. Check ETL engine: @backend/app/services/etl/engine.py
4. Review relevant service:
   - Snowflake issues: @backend/app/services/etl/snowflake_service.py
   - idiCORE issues: @backend/app/services/etl/idicore_service.py
   - CCC issues: @backend/app/services/etl/ccc_service.py
   - DNC issues: @backend/app/services/etl/dnc_service.py
5. Check WebSocket events: @backend/app/websockets/job_events.py

## Common Issues
- Snowflake connection: Check private key path and password
- idiCORE timeout: Check batch size (currently 200)
- CCC rate limiting: Check batch size (currently 50)
- Memory issues: Check Celery worker memory
