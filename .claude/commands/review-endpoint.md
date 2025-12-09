# Review FastAPI Endpoint

Review a FastAPI endpoint for security, performance, and adherence to project patterns.

## Target Endpoint
$ARGUMENTS

---

## Pre-Flight Checks

Before starting, verify:
1. The target file exists in `backend/app/api/v1/endpoints/`
2. You have read CLAUDE.md for project context
3. You understand the endpoint's purpose from its docstring

**If target not found:**
```
❌ ERROR: Endpoint file not found at specified path.
Available endpoints:
- backend/app/api/v1/endpoints/auth.py
- backend/app/api/v1/endpoints/jobs.py
- backend/app/api/v1/endpoints/sql_scripts.py
- backend/app/api/v1/endpoints/config.py
- backend/app/api/v1/endpoints/health.py

Please specify a valid endpoint path or name.
```

---

## Required File References

Read these files for context:
1. **Target endpoint file** - The file being reviewed
2. `backend/app/api/v1/deps.py` - Dependency injection patterns
3. `backend/app/core/security.py` - Auth implementation
4. `backend/app/schemas/` - Related Pydantic schemas
5. `backend/app/services/` - Related service layer code
6. `backend/app/db/models/` - Related database models

---

## Review Checklist

### 1. Security Review (CRITICAL)

Check against `backend/app/api/v1/deps.py`:

| Check | How to Verify | Severity |
|-------|---------------|----------|
| Auth enforced | `Depends(get_current_user)` or `get_current_active_superuser` present | 🔴 Critical |
| Input validation | Request body uses Pydantic schema from `schemas/` | 🔴 Critical |
| SQL injection | No f-strings or `.format()` in SQL queries | 🔴 Critical |
| Path traversal | File paths validated if accepting file inputs | 🔴 Critical |
| Sensitive data | Passwords/tokens not logged or returned | 🟡 High |

**Error if any CRITICAL check fails:**
```
🔴 SECURITY VIOLATION: {description}
   File: {file_path}:{line_number}
   Fix: {recommended_fix}

   ⚠️  DO NOT DEPLOY until this is resolved.
```

### 2. Async Pattern Review

Reference: `backend/app/db/session.py`

| Check | Correct Pattern | Anti-Pattern |
|-------|-----------------|--------------|
| DB session | `db: AsyncSession = Depends(get_db)` | Creating session manually |
| Queries | `await db.execute(select(...))` | `db.query(...)` (sync) |
| Commits | `await db.commit()` | `db.commit()` (sync) |
| External calls | `await` or run in executor | Blocking `requests.get()` |

### 3. Pydantic Schema Review

Reference: `backend/app/schemas/`

- [ ] Request body has dedicated `Create` schema
- [ ] Response has `Response` schema with `model_config = {"from_attributes": True}`
- [ ] `response_model` parameter set on route decorator
- [ ] Optional fields use `Optional[Type] = None` pattern
- [ ] Validation constraints present (`Field(min_length=1, max_length=255)`)

### 4. Project Pattern Compliance

Reference: CLAUDE.md "Patterns & Conventions"

- [ ] Business logic in `services/`, not in endpoint
- [ ] HTTPException for errors (not bare `raise`)
- [ ] Logging via `from app.core.logger import etl_logger`
- [ ] Docstring with parameter descriptions

### 5. Performance Review

| Check | Issue | Fix |
|-------|-------|-----|
| N+1 queries | Multiple DB calls in loop | Use `selectinload()` |
| Missing pagination | List endpoint returns all records | Add `skip` and `limit` params |
| Large responses | Returning entire objects | Use `response_model` to filter |
| Missing indexes | Filtering on non-indexed column | Add index in model |

---

## Output Format

Generate a structured report:

```markdown
# Endpoint Review: {endpoint_path}

## Summary
- **Endpoint**: `{METHOD} {path}`
- **Auth Required**: Yes/No
- **Overall Assessment**: ✅ Approved / ⚠️ Needs Changes / 🔴 Critical Issues

## Security Findings

### 🔴 Critical
{List critical issues or "None found"}

### 🟡 Warnings
{List warnings or "None found"}

### 🟢 Passed
{List security checks that passed}

## Pattern Compliance

| Pattern | Status | Notes |
|---------|--------|-------|
| Service Layer | ✅/❌ | {notes} |
| Async/Await | ✅/❌ | {notes} |
| Pydantic Schemas | ✅/❌ | {notes} |
| Error Handling | ✅/❌ | {notes} |

## Performance

{List any performance concerns}

## Recommended Changes

1. **{Priority}**: {Change description}
   - File: `{path}:{line}`
   - Current: `{current_code}`
   - Suggested: `{suggested_code}`

## Validation Checklist

After applying fixes, verify:
- [ ] All tests pass (when tests exist)
- [ ] Endpoint responds correctly: `curl -X {METHOD} http://localhost:8000{path}`
- [ ] Auth works: returns 401 without token
- [ ] Validation works: returns 422 with invalid input
```

---

## Error Handling

If you encounter issues during review:

| Error | Action |
|-------|--------|
| File not found | List available endpoints, ask for clarification |
| Circular import | Note in report, suggest fix |
| Missing dependency | Note which schema/model is missing |
| Can't determine auth | Flag as potential security issue |

---

## Validation Steps

After review is complete:

1. **Verify findings are accurate** - Re-read flagged code sections
2. **Test critical issues** - Provide curl commands to demonstrate
3. **Confirm fixes work** - If suggesting code, verify syntax
4. **Cross-reference** - Check if issue exists in similar endpoints
