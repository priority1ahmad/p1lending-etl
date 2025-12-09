# Investigate Issue

**Composite Agent**: Chains debugging, tracing, and analysis for comprehensive issue investigation.

## Issue Description
$ARGUMENTS

---

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   INVESTIGATION WORKFLOW                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phase 1: GATHER INFORMATION                                │
│  ├── Collect error messages                                 │
│  ├── Check logs                                             │
│  └── Reproduce the issue                                    │
│                                                             │
│  Phase 2: ANALYZE                                           │
│  ├── /trace-job - Trace execution flow                      │
│  ├── /debug-etl - Debug ETL specific issues                 │
│  └── Identify root cause                                    │
│                                                             │
│  Phase 3: FIX                                               │
│  ├── Implement fix                                          │
│  ├── /review-endpoint - Review changes                      │
│  └── /generate-tests - Add regression test                  │
│                                                             │
│  Phase 4: VERIFY                                            │
│  ├── Test fix locally                                       │
│  ├── Confirm issue resolved                                 │
│  └── No regressions                                         │
│                                                             │
│  Phase 5: DOCUMENT                                          │
│  ├── Update error handling if needed                        │
│  └── Add to known issues if recurring                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Gather Information

### Classify the Issue

| Type | Indicators | Primary Tool |
|------|------------|--------------|
| ETL Failure | Job status=FAILED, error_message set | `/debug-etl` |
| Performance | Slow response, timeouts | `/trace-job` |
| API Error | 4xx/5xx responses | `/review-endpoint` |
| Frontend Bug | UI not working, console errors | Browser DevTools |
| Auth Issue | 401/403 errors | `/review-security` |

### Collect Error Information

**For ETL Issues:**
```sql
-- Get job details
SELECT id, status, progress, message, error_message,
       created_at, started_at, completed_at
FROM etl_jobs
WHERE id = '{job_id}'
   OR created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Get job logs
SELECT level, message, created_at
FROM job_logs
WHERE job_id = '{job_id}'
ORDER BY created_at;
```

**For API Issues:**
```bash
# Check backend logs
docker-compose -f docker-compose.prod.yml logs --tail=100 backend | grep -i error

# Check specific endpoint
curl -v http://localhost:8000/api/v1/{endpoint}
```

**For Frontend Issues:**
- Check browser console (F12 → Console)
- Check Network tab for failed requests
- Check React DevTools for state

### Reproduce the Issue

**Questions to answer:**
1. What exactly happens?
2. What should happen instead?
3. Steps to reproduce?
4. Does it always happen or intermittent?
5. When did it start?

---

## Phase 2: Analyze

### For ETL Issues

Execute: `/debug-etl {issue description}`

**Follow the diagnostic flowchart:**
```
Error at which stage?
├── Snowflake → Check connection, credentials, SQL
├── idiCORE → Check auth, rate limits
├── Litigator/DNC → Check API key, database path
├── Google Sheets → Check credentials, permissions
└── Data Processing → Check DataFrame operations
```

### For API Issues

Execute: `/trace-job {if related to job}`

**Check the request flow:**
```
Frontend Request
  └── API Endpoint (check auth, validation)
      └── Service Layer (check business logic)
          └── Database (check queries, connections)
              └── External APIs (check responses)
```

### Root Cause Analysis

**Use the 5 Whys:**
1. Why did the error occur? → {immediate cause}
2. Why did that happen? → {underlying cause}
3. Why? → {deeper cause}
4. Why? → {systemic cause}
5. Why? → {root cause}

---

## Phase 3: Fix

### Implement the Fix

**Guidelines:**
- Fix the root cause, not just symptoms
- Keep changes minimal and focused
- Don't introduce new patterns
- Follow project conventions

### Review the Fix

Execute: `/review-endpoint {affected endpoints}`

**Verify:**
- [ ] Fix addresses root cause
- [ ] No new security issues
- [ ] No regressions introduced
- [ ] Proper error handling

### Add Regression Test

Execute: `/generate-tests {fixed module}`

**Test should:**
- Reproduce the original issue
- Verify fix works
- Prevent future regressions

---

## Phase 4: Verify

### Local Testing

```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# Reproduce original issue
{commands to reproduce}

# Should now be fixed
{expected behavior}
```

### Run Full Test Suite

```bash
# Backend tests
cd backend
pytest -v

# Specific test for this fix
pytest tests/test_{module}.py -v
```

### Check for Regressions

- [ ] All existing tests pass
- [ ] Related functionality works
- [ ] No new errors in logs

---

## Phase 5: Document

### Update Error Handling (if applicable)

If error wasn't caught properly:
```python
try:
    # operation
except SpecificException as e:
    logger.error(f"Descriptive message: {e}")
    raise HTTPException(status_code=..., detail="User-friendly message")
```

### Add to Known Issues (if recurring)

Update CLAUDE.md "Known Issues" section:
```markdown
### {Issue Title}

**Symptoms**: {what user sees}
**Cause**: {root cause}
**Solution**: {how to fix}
**Prevention**: {how to prevent}
```

---

## Output Format

```markdown
# Investigation Report

## Issue Summary

**Type**: {ETL/API/Frontend/Auth/Performance}
**Severity**: 🔴 Critical / 🟡 High / 🟢 Low
**Status**: ✅ Resolved / 🔄 In Progress / ❌ Blocked

## Symptoms

{What was observed}

## Timeline

| Time | Event |
|------|-------|
| {time} | Issue first reported |
| {time} | Investigation started |
| {time} | Root cause identified |
| {time} | Fix implemented |
| {time} | Fix verified |

## Root Cause Analysis

### Immediate Cause
{What directly caused the error}

### Root Cause
{The underlying issue}

### Why It Wasn't Caught
{Gap in testing/monitoring/validation}

## Resolution

### Fix Applied

**File**: `{file_path}:{line}`

**Before**:
```python
{original code}
```

**After**:
```python
{fixed code}
```

### Why This Fixes It
{Explanation of how fix addresses root cause}

## Verification

- [ ] Issue no longer reproducible
- [ ] All tests pass
- [ ] No regressions
- [ ] Fix deployed and monitored

## Prevention

### Short Term
- {immediate actions}

### Long Term
- {systemic improvements}

## Related Files

| File | Role in Issue |
|------|---------------|
| `{path}` | {how it was involved} |

## Lessons Learned

{What can be learned from this issue}
```

---

## Error Handling

| Situation | Action |
|-----------|--------|
| Can't reproduce | Get more details from reporter |
| Multiple causes | Address most critical first |
| Fix introduces new issue | Revert and investigate more |
| Root cause unclear | Add more logging, monitor |

---

## Validation Checklist

Before closing investigation:

- [ ] Root cause identified and documented
- [ ] Fix implemented and reviewed
- [ ] Regression test added
- [ ] Issue no longer reproducible
- [ ] No new issues introduced
- [ ] Documentation updated
- [ ] Team informed of resolution
