# Debug ETL Job

Analyze and debug an ETL job failure or unexpected behavior.

## Problem Description
$ARGUMENTS

---

## Pre-Flight Checks

1. **Verify Docker is running** (if in production):
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

2. **Check job exists** (if job ID provided):
   ```sql
   SELECT * FROM etl_jobs WHERE id = '{job_id}';
   ```

3. **Verify services are healthy**:
   ```bash
   curl http://localhost:8000/health
   ```

**If services down:**
```
❌ ERROR: Backend service not responding.
Check: docker-compose -f docker-compose.prod.yml logs backend
Common issues:
- Database connection failed
- Redis not available
- Missing environment variables
```

---

## Required File References

### Core ETL Files
| File | Purpose | Common Issues |
|------|---------|---------------|
| `backend/app/services/etl/engine.py` | Main orchestrator | DataFrame errors, batch failures |
| `backend/app/workers/etl_tasks.py` | Celery task | Job state issues, event emissions |
| `backend/app/workers/db_helper.py` | DB updates | Connection issues in Celery |

### External Service Files
| File | Service | Common Issues |
|------|---------|---------------|
| `backend/app/services/etl/snowflake_service.py` | Snowflake | Key loading, connection timeout |
| `backend/app/services/etl/idicore_service.py` | idiCORE API | Auth failure, rate limits |
| `backend/app/services/etl/ccc_service.py` | CCC/Litigator | API key, phone format |
| `backend/app/services/etl/dnc_service.py` | DNC Database | File path, SQLite errors |
| `backend/app/services/etl/google_sheets_service.py` | Google Sheets | Credentials, quota |
| `backend/app/services/etl/cache_service.py` | Caching | Snowflake table issues |

### Configuration
| File | Purpose |
|------|---------|
| `backend/app/core/config.py` | All settings |
| `.env` | Environment variables |
| `backend/secrets/rsa_key.p8` | Snowflake key |
| `backend/secrets/google_credentials.json` | Google auth |

---

## Diagnostic Flowchart

```
START
  │
  ├─► Job stuck at 0%?
  │     └─► Check Celery: Is worker running?
  │           ├─► No: `docker-compose logs celery-worker`
  │           └─► Yes: Check Redis connection
  │
  ├─► Fails during Snowflake query?
  │     └─► Check: snowflake_service.py
  │           ├─► "Private key" error: rsa_key.p8 missing/invalid
  │           ├─► "Connection timeout": Network/firewall issue
  │           └─► "Query failed": SQL syntax error in script
  │
  ├─► Fails during idiCORE lookup?
  │     └─► Check: idicore_service.py
  │           ├─► 401 error: Client ID/Secret wrong
  │           ├─► Empty results: Person not found (normal)
  │           └─► Timeout: API rate limiting
  │
  ├─► Fails during Litigator check?
  │     └─► Check: ccc_service.py
  │           ├─► 401/403: CCC_API_KEY invalid
  │           └─► Malformed response: Phone format issue
  │
  ├─► Fails during DNC check?
  │     └─► Check: dnc_service.py
  │           ├─► "Database not found": Path incorrect
  │           │     Production: /home/ubuntu/etl_app/dnc_database.db
  │           │     Docker: Check volume mount
  │           └─► "Database locked": Concurrent access issue
  │
  ├─► Fails during Google Sheets upload?
  │     └─► Check: google_sheets_service.py
  │           ├─► 401: Credentials expired/invalid
  │           ├─► 403: No write permission on sheet
  │           └─► 429: Rate limit exceeded
  │
  └─► KeyError / DataFrame error?
        └─► Check: engine.py data processing
              ├─► "KeyError: 'column'": Case sensitivity
              └─► "unhashable type": Phone normalization
```

---

## Debugging Steps

### Step 1: Get Job Details

```python
# In Python shell or script
from app.db.session import SessionLocal
from app.db.models.job import ETLJob

async def get_job_info(job_id: str):
    async with SessionLocal() as db:
        job = await db.get(ETLJob, job_id)
        print(f"Status: {job.status}")
        print(f"Progress: {job.progress}%")
        print(f"Message: {job.message}")
        print(f"Error: {job.error_message}")

        # Get logs
        for log in job.logs:
            print(f"[{log.level}] {log.message}")
```

### Step 2: Check Logs

```bash
# Docker logs
docker-compose -f docker-compose.prod.yml logs --tail=200 celery-worker | grep -i error
docker-compose -f docker-compose.prod.yml logs --tail=200 backend | grep "{job_id}"

# File logs (if configured)
tail -100 backend/logs/etl.log | grep -i error
```

### Step 3: Test External Services

**Snowflake:**
```bash
docker-compose -f docker-compose.prod.yml exec backend python -c "
from app.services.etl.snowflake_service import SnowflakeConnection
sf = SnowflakeConnection()
if sf.connect():
    print('✅ Snowflake OK')
    info = sf.get_session_info()
    print(f'Connected as: {info}')
else:
    print('❌ Snowflake FAILED')
"
```

**idiCORE:**
```bash
docker-compose -f docker-compose.prod.yml exec backend python -c "
from app.services.etl.idicore_service import IdiCOREAPIService
idi = IdiCOREAPIService()
token = idi._get_auth_token()
print('✅ idiCORE OK' if token else '❌ idiCORE FAILED')
"
```

**DNC Database:**
```bash
docker-compose -f docker-compose.prod.yml exec backend python -c "
from app.services.etl.dnc_service import DNCService
dnc = DNCService()
result = dnc.check_phone('5551234567')
print(f'DNC check result: {result}')
"
```

**Google Sheets:**
```bash
docker-compose -f docker-compose.prod.yml exec backend python -c "
from app.services.etl.google_sheets_service import GoogleSheetsConnection
gs = GoogleSheetsConnection()
if gs.connect():
    print('✅ Google Sheets OK')
else:
    print('❌ Google Sheets FAILED')
"
```

### Step 4: Common Error Patterns

| Log Message | Root Cause | Fix |
|-------------|------------|-----|
| `Failed to connect to Snowflake` | Key file missing or invalid | Check `backend/secrets/rsa_key.p8` |
| `idiCORE auth failed` | Wrong credentials | Verify `IDICORE_CLIENT_ID/SECRET` |
| `KeyError: 'cached_address'` | Column name case mismatch | Use `.str.upper()` on column lookup |
| `unhashable type: 'float'` | NaN in phone column | Clean with `fillna('')` |
| `DNC database not found` | Wrong path in config | Check `DNC_DATABASE_PATH` env var |
| `Google Sheets quota exceeded` | Too many API calls | Wait or increase batch size |
| `Task was rejected` | Celery queue full | Check Redis memory |

---

## Output Format

```markdown
# ETL Debug Report

## Problem Summary
**Job ID**: {id or "N/A"}
**Error Type**: {category}
**Severity**: 🔴 Critical / 🟡 Warning / 🟢 Info

## Root Cause Analysis

### What Happened
{Description of the failure}

### Where It Failed
- **Stage**: {Snowflake Query | idiCORE Lookup | Litigator Check | DNC Check | Google Upload}
- **File**: `{file_path}:{line_number}`
- **Function**: `{function_name}`

### Evidence
```
{Relevant log messages or error traces}
```

## Resolution

### Immediate Fix
```python
{Code fix or configuration change}
```

### Verification
```bash
{Command to verify fix works}
```

### Prevention
{How to prevent this in the future}

## Validation Checklist

- [ ] Root cause identified
- [ ] Fix applied
- [ ] Job re-run successfully
- [ ] No regression in other jobs
```

---

## Error Handling

| Situation | Action |
|-----------|--------|
| Can't access logs | Check Docker/file permissions |
| Job ID not found | Search by time range in etl_jobs table |
| Multiple errors | Address in dependency order (Snowflake first) |
| Intermittent failure | Check rate limits, add retry logic |

---

## Validation Steps

After applying fix:

1. **Re-run the job**:
   ```bash
   # Via API
   curl -X POST http://localhost:8000/api/v1/jobs/ \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{"script_id": "{script_id}", "row_limit": 10}'
   ```

2. **Monitor progress**:
   ```bash
   watch -n 2 'curl -s http://localhost:8000/api/v1/jobs/{job_id} | jq'
   ```

3. **Verify completion**:
   - Job status is "completed"
   - No error_message
   - Expected row counts in stats

4. **Check output**:
   - Google Sheets has new rows
   - Snowflake cache updated
