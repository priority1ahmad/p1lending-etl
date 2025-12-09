# Trace ETL Job Flow

Trace the complete flow of an ETL job through the system, from API request to completion.

## Job ID or Description
$ARGUMENTS

---

## Pre-Flight Checks

1. **Verify job exists** (if ID provided):
   ```sql
   SELECT id, status, progress, message, created_at
   FROM etl_jobs WHERE id = '{job_id}';
   ```

2. **Get job logs**:
   ```sql
   SELECT level, message, created_at
   FROM job_logs WHERE job_id = '{job_id}'
   ORDER BY created_at;
   ```

**If job not found:**
```
❌ ERROR: Job ID not found in database.

To find recent jobs:
SELECT id, status, script_id, created_at
FROM etl_jobs
ORDER BY created_at DESC
LIMIT 10;
```

---

## Required File References

| Stage | File | Entry Point |
|-------|------|-------------|
| 1. API Request | `backend/app/api/v1/endpoints/jobs.py` | `create_job()` |
| 2. Job Creation | `backend/app/db/models/job.py` | `ETLJob` model |
| 3. Celery Task | `backend/app/workers/etl_tasks.py` | `run_etl_job()` |
| 4. ETL Engine | `backend/app/services/etl/engine.py` | `execute_single_script()` |
| 5. Snowflake | `backend/app/services/etl/snowflake_service.py` | `execute_query()` |
| 6. idiCORE | `backend/app/services/etl/idicore_service.py` | `lookup_multiple_people_*()` |
| 7. Litigator | `backend/app/services/etl/ccc_service.py` | `check_multiple_phones_threaded()` |
| 8. DNC | `backend/app/services/etl/dnc_service.py` | `check_multiple_phones()` |
| 9. Google Sheets | `backend/app/services/etl/google_sheets_service.py` | `upload_dataframe()` |
| 10. WebSocket | `backend/app/websockets/job_events.py` | `emit_*` functions |

---

## Complete Flow Trace

### Stage 1: Frontend Request

**File**: `frontend/src/pages/Dashboard.tsx`

```typescript
// User clicks "Run ETL" button
const handleRunETL = async () => {
  const response = await jobsApi.createJob({
    script_id: selectedScript.id,
    row_limit: rowLimit,
  });
  // WebSocket subscription starts
  socket.emit('join_job', { job_id: response.id });
};
```

**Trace Point**: Check browser Network tab for `POST /api/v1/jobs/`

---

### Stage 2: API Endpoint

**File**: `backend/app/api/v1/endpoints/jobs.py:create_job()`

```python
@router.post("/", response_model=JobResponse)
async def create_job(
    job_data: JobCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Create job record in database
    job = ETLJob(
        job_type=JobType.SINGLE_SCRIPT,
        script_id=job_data.script_id,
        status=JobStatus.PENDING,
        started_by=current_user.id,
    )
    db.add(job)
    await db.commit()

    # 2. Queue Celery task
    run_etl_job.delay(
        job_id=str(job.id),
        script_id=str(job_data.script_id),
        script_content=script.content,
        script_name=script.name,
        limit_rows=job_data.row_limit,
    )

    return job
```

**Trace Point**: Check `etl_jobs` table for new record

---

### Stage 3: Celery Task

**File**: `backend/app/workers/etl_tasks.py:run_etl_job()`

```python
@celery_app.task(bind=True, name="app.workers.etl_tasks.run_etl_job")
def run_etl_job(self, job_id, script_id, script_content, script_name, limit_rows):
    # 1. Initialize stop flag
    job_stop_flags[job_id] = False

    # 2. Emit job started event
    emit_job_event(job_id, "job_progress", {
        "status": "running",
        "progress": 0,
        "message": "ETL job started"
    })

    # 3. Update DB status to RUNNING
    update_job_status(job_id, JobStatus.RUNNING, progress=0)

    # 4. Create ETL engine and execute
    engine = ETLEngine(job_id=job_id, log_callback=log_callback)
    result = engine.execute_single_script(...)
```

**Trace Point**: Check Celery worker logs, Redis for task

---

### Stage 4: ETL Engine Execution

**File**: `backend/app/services/etl/engine.py:execute_single_script()`

```
┌─────────────────────────────────────────────────────────────┐
│ execute_single_script(script_content, script_name, ...)    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: Connect to Snowflake                              │
│  ├── snowflake_service.connect()                           │
│  └── Trace: "Connected to Snowflake" log                   │
│                                                             │
│  Step 2: Connect to Google Sheets                          │
│  ├── google_sheets_service.connect()                       │
│  └── Trace: "Connected to Google Sheets" log               │
│                                                             │
│  Step 3: Execute SQL Query                                 │
│  ├── snowflake_service.execute_query(script_content)       │
│  ├── Returns: DataFrame with raw leads                     │
│  └── Trace: "SQL executed, returned {n} rows" log          │
│                                                             │
│  Step 4: Filter Already Processed                          │
│  ├── _filter_unprocessed_records(df)                       │
│  ├── Queries: PERSON_CACHE table in Snowflake             │
│  └── Trace: "Filtered to {n} unprocessed records"          │
│                                                             │
│  Step 5: Batch Processing Loop                             │
│  └── for batch in batches (200 records each):              │
│        │                                                   │
│        ├── 5a: idiCORE Lookup                             │
│        │   ├── idicore.lookup_multiple_people_*_batch()   │
│        │   └── Returns: phones, emails                     │
│        │                                                   │
│        ├── 5b: Litigator Check (8 threads)                │
│        │   ├── ccc_service.check_multiple_phones_*()      │
│        │   └── Returns: litigator flags                    │
│        │                                                   │
│        ├── 5c: DNC Check                                  │
│        │   ├── dnc_service.check_multiple_phones()        │
│        │   └── Returns: dnc flags                          │
│        │                                                   │
│        ├── 5d: Upload to Google Sheets                    │
│        │   ├── google_sheets.upload_dataframe(batch)      │
│        │   └── Trace: "Uploaded batch to Sheets"           │
│        │                                                   │
│        └── 5e: Progress Callback                          │
│            └── emit_job_event("job_progress", ...)        │
│                                                             │
│  Step 6: Cache Results                                     │
│  ├── _upload_consolidated_data_to_snowflake()             │
│  └── Writes to: UNIQUE_CONSOLIDATED_DATA table            │
│                                                             │
│  Return: {success, rows_processed, counts...}              │
└─────────────────────────────────────────────────────────────┘
```

---

### Stage 5: WebSocket Events

**File**: `backend/app/workers/etl_tasks.py:emit_job_event()`

```python
def emit_job_event(job_id: str, event_type: str, data: dict):
    r = redis.from_url(settings.redis_url)
    message = json.dumps({'event_type': event_type, 'data': data})
    r.publish(f"job_{job_id}", message)
```

**File**: `backend/app/websockets/job_events.py:start_redis_subscriber()`

```python
# Subscribes to Redis channel
await pubsub.psubscribe("job_*")

# Forwards to WebSocket clients
await sio.emit('job_progress', {...}, room=f"job_{job_id}")
```

**Events Emitted**:
| Event | When | Data |
|-------|------|------|
| `job_progress` | Every batch | progress %, message, row counts |
| `job_log` | Any log entry | level, message |
| `batch_progress` | Batch start | batch number, row range |
| `row_processed` | Every 10 rows | row data, batch info |
| `job_complete` | Success | final stats |
| `job_error` | Failure | error message |

---

### Stage 6: Final State

**Database** (`etl_jobs` table):
```sql
SELECT status, progress, total_rows_processed,
       litigator_count, dnc_count, clean_count,
       completed_at
FROM etl_jobs WHERE id = '{job_id}';
```

**Snowflake** (`UNIQUE_CONSOLIDATED_DATA` table):
- New rows with enriched data
- Cached for future runs

**Google Sheets**:
- New rows appended to target sheet
- Includes: names, phones, emails, flags

---

## Output Format

```markdown
# Job Flow Trace: {job_id}

## Timeline

| Time | Stage | File:Line | Event |
|------|-------|-----------|-------|
| T+0.0s | API | jobs.py:45 | Job created, status=PENDING |
| T+0.1s | Celery | etl_tasks.py:20 | Task received |
| T+0.2s | Engine | engine.py:100 | Connecting to Snowflake |
| T+1.5s | Engine | engine.py:120 | SQL query executed, 500 rows |
| T+2.0s | Engine | engine.py:150 | Filtered to 450 unprocessed |
| T+3.0s | idiCORE | idicore.py:200 | Batch 1/3 - API lookup |
| ... | ... | ... | ... |

## Data Flow

```
Snowflake (500 rows)
    │
    ├── Filtered (450 unprocessed)
    │
    ├── Batch 1 (200 rows)
    │   ├── idiCORE: 180 phones found
    │   ├── Litigator: 5 flagged
    │   ├── DNC: 12 flagged
    │   └── Google Sheets: 183 uploaded
    │
    ├── Batch 2 (200 rows)
    │   └── ...
    │
    └── Batch 3 (50 rows)
        └── ...

Total: 450 processed, 398 clean, 52 flagged
```

## WebSocket Events Log

| Event | Data |
|-------|------|
| job_progress | {progress: 0, message: "Started"} |
| job_progress | {progress: 33, current_row: 200} |
| job_progress | {progress: 66, current_row: 400} |
| job_complete | {clean_count: 398, ...} |

## Validation

- [ ] Job status is COMPLETED
- [ ] Row counts match expectations
- [ ] Google Sheets has new data
- [ ] Cache updated in Snowflake
```

---

## Error Handling

| Issue | Resolution |
|-------|------------|
| Job ID not found | Search by time range or script name |
| Missing logs | Check if logging was enabled |
| WebSocket events missing | Check Redis pub/sub connection |
| Incomplete trace | Job may have failed mid-execution |

---

## Validation Steps

1. **Verify database state**:
   ```sql
   SELECT * FROM etl_jobs WHERE id = '{job_id}';
   SELECT COUNT(*) FROM job_logs WHERE job_id = '{job_id}';
   ```

2. **Check external outputs**:
   - Google Sheets row count increased
   - Snowflake cache has new entries

3. **Verify timing**:
   - Compare created_at and completed_at
   - Check for unusual delays between stages

4. **Cross-reference logs**:
   - Celery worker logs
   - Application logs
   - Database logs table
