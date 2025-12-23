---
allowed-tools: Read, Grep, Glob, Bash(docker-compose:* logs), Bash(docker compose:*), Bash(cat:*), Bash(grep:*), Bash(tail:*)
description: Trace an ETL job through the entire system pipeline
argument-hint: <job-id>
---

## Task
Trace ETL job `$1` through the entire pipeline, identifying where it is, what happened, and any issues.

## Workflow

### Step 1: Get Job Overview
```bash
# Check job status in database (via container)
docker compose -f docker-compose.prod.yml exec -T postgres psql -U p1lending -d p1lending_etl -c \
  "SELECT id, name, status, created_at, started_at, completed_at, error_message
   FROM etl_jobs
   WHERE id::text LIKE '%$1%'
   ORDER BY created_at DESC LIMIT 5;"
```

### Step 2: Job Creation Trace
Check how job was created:

**API Endpoint:**
- Read `@backend/app/api/v1/endpoints/jobs.py` - `create_job` function
- Look for validation errors, schema issues

**Search logs:**
```bash
# Backend logs for job creation
docker compose -f docker-compose.prod.yml logs backend 2>&1 | grep -i "$1" | head -20
```

### Step 3: Celery Task Trace
Check task execution:

```bash
# Celery worker logs
docker compose -f docker-compose.prod.yml logs celery-worker 2>&1 | grep -i "$1" | head -30

# Task status
docker compose -f docker-compose.prod.yml logs celery-worker 2>&1 | grep -E "Task.*$1|etl_job.*$1"
```

**Key patterns to look for:**
- `Task received` - Job was queued
- `Task started` - Job began processing
- `Task succeeded` - Job completed
- `Task failed` - Job errored

### Step 4: ETL Engine Trace
Check processing stages in `@backend/app/services/etl/engine.py`:

**Stage 1: Data Fetching (Snowflake)**
```bash
docker compose -f docker-compose.prod.yml logs backend 2>&1 | grep -E "$1.*(Snowflake|snowflake|query)" | head -10
```
- Look for: Query execution time, record count

**Stage 2: Enrichment (idiCORE)**
```bash
docker compose -f docker-compose.prod.yml logs backend 2>&1 | grep -E "$1.*(idiCORE|idicore|enrichment)" | head -10
```
- Look for: API calls, phone numbers found, errors

**Stage 3: Litigator Check (CCC)**
```bash
docker compose -f docker-compose.prod.yml logs backend 2>&1 | grep -E "$1.*(CCC|litigator|Litigator)" | head -10
```
- Look for: Batch processing, matches found

**Stage 4: DNC Check**
```bash
docker compose -f docker-compose.prod.yml logs backend 2>&1 | grep -E "$1.*(DNC|dnc|do.not.call)" | head -10
```
- Look for: Phone lookups, DNC matches

**Stage 5: Results Upload**
```bash
docker compose -f docker-compose.prod.yml logs backend 2>&1 | grep -E "$1.*(upload|Upload|Snowflake.*insert|results)" | head -10
```
- Look for: Record count, upload success

### Step 5: Job Log File
Check dedicated job log:

```bash
# Job-specific log file
docker compose -f docker-compose.prod.yml exec -T backend cat logs/etl_job_$1.log 2>/dev/null | head -100 || echo "No dedicated log file found"
```

### Step 6: WebSocket Events Trace
Check real-time event delivery:

```bash
# WebSocket event logs
docker compose -f docker-compose.prod.yml logs backend 2>&1 | grep -E "$1.*(socket|Socket|emit|progress)" | head -10
```

**Event types:**
- `job_progress` - Progress percentage updates
- `job_log` - Log messages sent to UI
- `job_complete` - Completion notification
- `job_error` - Error notification

### Step 7: Error Analysis
If job failed, deep dive into errors:

```bash
# All error messages for this job
docker compose -f docker-compose.prod.yml logs 2>&1 | grep -E "$1.*(error|Error|ERROR|exception|Exception|failed|Failed)" | head -20

# Python tracebacks
docker compose -f docker-compose.prod.yml logs backend 2>&1 | grep -A 20 "Traceback.*$1"
```

### Step 8: Performance Analysis
Check timing metrics:

```bash
# Look for timing information
docker compose -f docker-compose.prod.yml logs backend 2>&1 | grep -E "$1.*(seconds|ms|took|duration|elapsed)" | head -10
```

**Expected timing by stage:**
| Stage | Typical Time | Concern Threshold |
|-------|--------------|-------------------|
| Snowflake Query | 1-5s | >30s |
| Pre-filtering | 0.5-2s | >10s |
| idiCORE Batch (200 records) | 5-20s | >60s |
| CCC Check (600 phones) | 2-10s | >30s |
| DNC Check (600 phones) | 1-3s | >10s |
| Results Upload | 1-5s | >30s |

## Output Format

```
============================================
ETL JOB TRACE: {job_id}
============================================

Job Info:
  Status: {status}
  Created: {timestamp}
  Started: {timestamp}
  Completed: {timestamp}
  Duration: {duration}

Pipeline Trace:
  [OK] Job Created - API received request
  [OK] Task Queued - Celery task dispatched
  [OK] Task Started - Worker picked up job
  [OK] Snowflake Query - Retrieved 245 records
  [OK] Pre-filtering - Filtered to 198 new records
  [OK] idiCORE Enrichment - Processed 198 records
  [OK] CCC Litigator Check - 594 phones checked, 12 flagged
  [OK] DNC Check - 594 phones checked, 45 in DNC
  [OK] Results Upload - 198 records saved
  [OK] Job Complete - Success

Performance:
  Total Duration: 45.2s
  Snowflake: 3.2s
  idiCORE: 28.5s (bottleneck)
  CCC: 6.1s
  DNC: 2.3s
  Upload: 5.1s

Issues Found:
  None

============================================
```

## Common Issues

| Symptom | Likely Cause | Resolution |
|---------|--------------|------------|
| Job stuck "pending" | Celery worker down | Restart celery-worker |
| No Snowflake data | Invalid SQL script | Check script syntax |
| idiCORE errors | API rate limit | Check circuit breaker |
| DNC timeout | SQLite lock | Restart backend |
| No WebSocket updates | Redis connection | Check Redis |

## Related Commands
- For debugging: `/debug-etl $1`
- For health: `/health-check`
- For logs: `docker compose logs -f backend`

## Example
```
/trace-job abc123
```
Traces job abc123 through all pipeline stages.
