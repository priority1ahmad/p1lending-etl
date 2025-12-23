---
allowed-tools: Bash(npm run:*), Bash(pytest:*), Bash(python -m pytest:*), Bash(git:*), Bash(cd:*), Bash(ruff:*), Bash(python -m ruff:*), Bash(alembic:*), Read, Grep, Glob
description: Execute pre-deployment validation checks with pass/fail results
argument-hint: "[environment]"
---

## Task
Execute all pre-deployment checks and report pass/fail status for each. Block deployment if any critical check fails.

## Supported Arguments
- `staging` - Run checks for staging deployment
- `production` - Run checks with stricter validation
- (none) - Default to staging checks

## Workflow

### Step 1: Code Quality Checks

**Backend Linting:**
```bash
cd backend && python -m ruff check . --output-format=concise 2>&1 | head -20
```
- PASS: No errors
- FAIL: Any linting errors

**Frontend Linting:**
```bash
cd frontend && npm run lint 2>&1 | tail -10
```
- PASS: Exit code 0
- FAIL: Any ESLint errors

**Frontend Build:**
```bash
cd frontend && npm run build 2>&1 | tail -15
```
- PASS: Build succeeds
- FAIL: TypeScript or build errors

### Step 2: Test Execution

**Backend Tests:**
```bash
cd backend && python -m pytest -x -q 2>&1 | tail -20
```
- PASS: All tests pass
- FAIL: Any test failures

**Frontend Tests (if configured):**
```bash
cd frontend && npm test -- --passWithNoTests 2>&1 | tail -10
```
- PASS: Tests pass or none configured
- FAIL: Test failures

### Step 3: Security Checks

**Secrets in Code:**
```bash
grep -rn "password\s*=\s*['\"][^'\"]*['\"]" --include="*.py" backend/app/ | grep -v "example\|test\|#" | head -5
```
- PASS: No matches
- FAIL: Hardcoded secrets found

**Environment Files:**
```bash
git status --porcelain | grep -E "\.env" || echo "No .env files staged"
```
- PASS: No .env files staged
- FAIL: .env files in staging area

### Step 4: Database Checks

**Migration Status:**
```bash
cd backend && alembic current 2>&1
```
- Report current migration head

**Pending Migrations:**
```bash
cd backend && alembic check 2>&1 || echo "Migrations may need review"
```
- PASS: No pending migrations
- WARN: Pending migrations detected

### Step 5: Git Status

**Current Branch:**
```bash
git branch --show-current
```
- INFO: Report branch name

**Uncommitted Changes:**
```bash
git status --porcelain | head -10
```
- PASS: Working directory clean
- WARN: Uncommitted changes present

**Recent Commits:**
```bash
git log --oneline -5
```
- INFO: Show recent commits for review

### Step 6: Docker Validation (if production)

**Docker Compose Config:**
```bash
docker compose -f docker-compose.prod.yml config --quiet 2>&1 && echo "Config valid" || echo "Config invalid"
```
- PASS: Valid configuration
- FAIL: Invalid docker-compose syntax

## Output Format

```
============================================
PRE-DEPLOYMENT CHECK RESULTS
Environment: [staging|production]
Date: [timestamp]
============================================

[PASS] Backend Linting
[PASS] Frontend Linting
[PASS] Frontend Build
[PASS] Backend Tests
[WARN] Frontend Tests - No tests configured
[PASS] No Secrets in Code
[PASS] No .env Files Staged
[INFO] Migration: abc123 (head)
[PASS] No Pending Migrations
[INFO] Branch: staging
[WARN] Uncommitted Changes: 3 files
[PASS] Docker Config Valid

============================================
SUMMARY: 8 PASS | 2 WARN | 0 FAIL
============================================
DEPLOYMENT: APPROVED (no failures)
```

## Error Handling
- If a command fails to run, mark as `[ERROR]` and continue
- If any check returns `[FAIL]`, final status is "BLOCKED"
- Warnings do not block deployment but should be reviewed

## Related Commands
- If all checks pass: `/quick-deploy [environment]`
- If security issues: `/security-review`
- After deployment: `/health-check`
