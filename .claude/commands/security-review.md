---
allowed-tools: Read, Grep, Glob, Write, Bash(git status:*), Bash(git log:*)
description: Perform comprehensive security review on codebase
argument-hint: "[output-file]"
---

## Task
Perform a comprehensive security audit of the P1Lending ETL codebase, checking for common vulnerabilities and generating an actionable report.

## Workflow

### Step 1: Secrets Exposure Check
Search for hardcoded secrets:
```bash
# Check for hardcoded credentials
grep -rn "password\s*=\s*['\"]" --include="*.py" backend/
grep -rn "api_key\s*=\s*['\"]" --include="*.py" backend/
grep -rn "secret\s*=\s*['\"]" --include="*.py" backend/

# Check for .env files in git
git status | grep -E "\.env"
```

Flag as **CRITICAL** if found in non-example files.

### Step 2: Authentication Review
Analyze authentication implementation:
- Read `@backend/app/api/v1/deps.py` - Check get_current_user dependency
- Read `@backend/app/core/security.py` - Verify JWT implementation
- Verify: Token expiration < 24 hours, refresh token rotation, password hashing with bcrypt

### Step 3: Authorization Review
Check endpoint protection in `@backend/app/api/v1/endpoints/`:
- All endpoints use `Depends(get_current_user)` or `Depends(get_current_active_superuser)`
- Role-based access implemented where needed
- No unprotected sensitive endpoints

### Step 4: Input Validation
Review Pydantic schemas in `@backend/app/schemas/`:
- All user inputs have validation constraints
- SQL injection prevention (parameterized queries via SQLAlchemy)
- XSS prevention (output encoding)

### Step 5: CORS & Security Headers
Check `@backend/app/main.py`:
- CORS origins NOT set to `*` in production
- Security headers present (X-Content-Type-Options, X-Frame-Options)

### Step 6: WebSocket Security
Review `@backend/app/websockets/job_events.py`:
- Authentication required on connection
- CORS restrictions applied
- Rate limiting implemented

### Step 7: Docker Security
Review Dockerfiles and docker-compose files:
- Non-root user in containers
- No secrets baked into images
- Health checks present
- No privileged mode

### Step 8: Dependency Vulnerabilities
```bash
# Check Python dependencies
cd backend && pip-audit 2>/dev/null || echo "pip-audit not installed"

# Check npm dependencies
cd frontend && npm audit 2>/dev/null || echo "Run npm audit manually"
```

## Output Format
Generate a security report with:

```markdown
# Security Review Report
Date: [YYYY-MM-DD]
Reviewer: Claude Code

## Summary
- Critical Issues: X
- High Issues: X
- Medium Issues: X
- Low Issues: X

## Critical Issues
[List with file:line references and remediation]

## High Issues
[List with file:line references and remediation]

## Recommendations
[Prioritized action items]
```

## Error Handling
- If grep finds no matches, report as "No issues found"
- If file doesn't exist, note as "File not found - verify path"
- Continue review even if individual checks fail

## Related Commands
- After fixing issues: `/pre-deploy` to verify fixes
- For ongoing monitoring: `/health-check`
