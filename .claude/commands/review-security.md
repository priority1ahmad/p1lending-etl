# Security Review

Perform a comprehensive security audit of the specified component or the entire application.

## Target
$ARGUMENTS

(If empty, perform full application security audit)

---

## Pre-Flight Checks

1. Read `CLAUDE.md` for project context
2. Verify target exists (if specified)
3. Check for `.env` file (should NOT be committed)

**If .env is in git:**
```
🔴 CRITICAL: .env file is tracked in git!
   Run: git rm --cached .env
   Add to .gitignore if not present
   Rotate ALL credentials immediately!
```

---

## Required File References

### Core Security Files
| File | Check For |
|------|-----------|
| `backend/app/core/security.py` | JWT implementation, password hashing |
| `backend/app/core/config.py` | Hardcoded secrets, secure defaults |
| `backend/app/api/v1/deps.py` | Auth dependency implementation |
| `backend/app/main.py` | CORS configuration |
| `.env` / `env.example` | Secret management |
| `.gitignore` | Secrets exclusion |

### Endpoint Files
| File | Check For |
|------|-----------|
| `backend/app/api/v1/endpoints/auth.py` | Login security, token handling |
| `backend/app/api/v1/endpoints/jobs.py` | Auth on job operations |
| `backend/app/api/v1/endpoints/sql_scripts.py` | SQL injection, auth |
| `backend/app/api/v1/endpoints/config.py` | Admin-only access |

### ETL Service Files
| File | Check For |
|------|-----------|
| `backend/app/services/etl/snowflake_service.py` | Credential handling |
| `backend/app/services/etl/idicore_service.py` | API key exposure |
| `backend/app/services/etl/ccc_service.py` | API key in logs |
| `backend/app/services/etl/google_sheets_service.py` | Credential file handling |

### Docker Files
| File | Check For |
|------|-----------|
| `backend/Dockerfile` | Non-root user, secrets in image |
| `docker-compose.prod.yml` | Exposed ports, env handling |

---

## Security Audit Checklist

### 1. Authentication & Authorization (CRITICAL)

**Check `backend/app/core/security.py`:**
```python
# Verify these patterns:
- SECRET_KEY is from environment, not hardcoded
- JWT algorithm is HS256 or RS256 (not "none")
- Token expiry is reasonable (15-60 min for access)
- Password hashing uses bcrypt with proper rounds
```

**Check `backend/app/api/v1/deps.py`:**
```python
# Verify:
- get_current_user properly validates JWT
- Token expiry is checked
- User is verified as active
- Superuser check exists for admin routes
```

**Red Flags:**
```
🔴 SECRET_KEY has default value in config.py
🔴 JWT token never expires
🔴 Password stored in plaintext
🔴 No token validation
```

### 2. Injection Vulnerabilities

**SQL Injection - Check these files:**
- `backend/app/services/etl/engine.py` - Dynamic SQL
- `backend/app/services/etl/snowflake_service.py` - Query execution
- `backend/app/services/etl/dnc_service.py` - SQLite queries

**Dangerous patterns:**
```python
# BAD - SQL Injection vulnerable:
query = f"SELECT * FROM users WHERE id = {user_id}"
cursor.execute(f"SELECT * FROM {table_name}")

# GOOD - Parameterized:
query = "SELECT * FROM users WHERE id = :id"
cursor.execute(query, {"id": user_id})
```

**Command Injection - Check for:**
```python
# BAD:
os.system(f"process {user_input}")
subprocess.call(user_input, shell=True)
```

### 3. Secrets Management

**Check `backend/app/core/config.py`:**
```python
# Flag any hardcoded values that should be secrets:
- API keys
- Passwords
- Private key passwords
- Client secrets
```

**Verify `.gitignore` includes:**
```
.env
*.p8
*credentials*.json
backend/secrets/
```

**Check for secrets in logs:**
```python
# BAD - Logging secrets:
logger.info(f"Using API key: {api_key}")
logger.debug(f"Password: {password}")
```

### 4. CORS Configuration

**Check `backend/app/main.py`:**
```python
# Verify CORS is not wide open in production:
allow_origins=["*"]  # 🔴 BAD for production
allow_origins=settings.cors_origins  # ✅ Good - from config
```

### 5. Data Protection

**PII in Logs - Check `backend/app/core/logger.py` and ETL services:**
- Phone numbers should be masked
- Addresses should be truncated
- Full names should not be logged

**Data in Transit:**
- Verify HTTPS is enforced (nginx config or load balancer)

### 6. Docker Security

**Check `backend/Dockerfile`:**
```dockerfile
# Should have:
USER appuser  # Non-root user
# Should NOT have:
COPY .env .  # Secrets baked into image
```

**Check `docker-compose.prod.yml`:**
```yaml
# Verify:
- Passwords from environment, not hardcoded
- Ports only exposed as needed
- Volumes don't expose sensitive directories
```

### 7. Dependency Security

```bash
# Check for known vulnerabilities:
pip install safety
safety check -r backend/requirements.txt

npm audit  # In frontend/
```

---

## Output Format

```markdown
# Security Audit Report

**Scope**: {Full Application | Component: path}
**Date**: {current_date}
**Risk Level**: 🔴 Critical | 🟡 High | 🟢 Low

---

## Executive Summary

{2-3 sentence overview of findings}

---

## Findings by Severity

### 🔴 CRITICAL (Fix Immediately)

#### Finding 1: {Title}
- **Location**: `{file}:{line}`
- **Description**: {What is the vulnerability}
- **Impact**: {What could an attacker do}
- **Evidence**:
  ```python
  {code snippet showing issue}
  ```
- **Remediation**:
  ```python
  {fixed code}
  ```
- **Verification**: {How to verify the fix}

---

### 🟡 HIGH (Fix Before Production)

{Same format as critical}

---

### 🟢 LOW (Improvements)

{Same format but shorter}

---

## Passed Checks ✅

| Category | Check | Status |
|----------|-------|--------|
| Auth | JWT properly validated | ✅ |
| Auth | Passwords hashed with bcrypt | ✅ |
| Injection | No SQL injection in endpoints | ✅ |
| ... | ... | ... |

---

## Recommendations Summary

| Priority | Action | Effort |
|----------|--------|--------|
| 1 | {action} | {Low/Med/High} |
| 2 | {action} | {Low/Med/High} |

---

## Verification Commands

```bash
# Test auth bypass:
curl http://localhost:8000/api/v1/jobs/ -H "Authorization: Bearer invalid"
# Expected: 401

# Test SQL injection:
curl http://localhost:8000/api/v1/scripts/ -d '{"name": "'; DROP TABLE--"}'
# Expected: 422 (validation error)
```
```

---

## Error Handling

| Situation | Action |
|-----------|--------|
| Can't read file | Note as "Unable to audit" with reason |
| Ambiguous finding | Flag as "Needs Manual Review" |
| External dependency issue | Document and recommend audit |

---

## Validation Steps

After fixes are applied:

1. [ ] Re-run this security audit
2. [ ] Run `safety check` for Python deps
3. [ ] Run `npm audit` for frontend deps
4. [ ] Test auth with invalid tokens
5. [ ] Test input validation with malicious payloads
6. [ ] Verify secrets are not in git history: `git log -p | grep -i password`
