# Ship It - Complete Deployment Workflow

**Composite Agent**: Chains pre-deployment checks, PR creation, and deployment verification.

## Deployment Target
$ARGUMENTS

(e.g., "production", "staging", or leave empty for full check)

---

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     SHIP IT WORKFLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phase 1: PRE-FLIGHT CHECKS                                 │
│  ├── Git status clean?                                      │
│  ├── All changes committed?                                 │
│  └── Branch up to date with main?                           │
│                                                             │
│  Phase 2: CODE QUALITY                                      │
│  ├── /review-security - Security audit                      │
│  ├── Lint check (backend + frontend)                        │
│  └── Build verification                                     │
│                                                             │
│  Phase 3: TESTING                                           │
│  ├── Run all tests                                          │
│  └── Manual smoke test                                      │
│                                                             │
│  Phase 4: PRE-DEPLOY CHECKS                                 │
│  └── /pre-deploy - Full checklist                           │
│                                                             │
│  Phase 5: CREATE PR                                         │
│  └── /create-pr - Generate PR                               │
│                                                             │
│  Phase 6: POST-MERGE DEPLOYMENT                             │
│  ├── Deploy to target environment                           │
│  └── Verify deployment                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Pre-Flight Checks

### Git Status Check

```bash
# Must be clean
git status

# Expected output:
# On branch feature/...
# nothing to commit, working tree clean
```

**If dirty:**
```
❌ STOP: Uncommitted changes detected.

Either:
1. Commit changes: git add . && git commit -m "..."
2. Stash changes: git stash
3. Discard changes: git checkout -- .
```

### Branch Sync Check

```bash
# Fetch latest
git fetch origin

# Check if behind main
git log HEAD..origin/main --oneline
```

**If behind:**
```
⚠️  WARNING: Branch is behind main.

Recommended:
git pull origin main --rebase
# Resolve any conflicts
```

---

## Phase 2: Code Quality

### Security Audit

Execute: `/review-security`

**Must pass these checks:**
- [ ] No hardcoded credentials
- [ ] Auth enforced on endpoints
- [ ] No SQL injection vulnerabilities
- [ ] Secrets not in git

**If fails:**
```
🔴 STOP: Security issues found.
Resolve all CRITICAL and HIGH severity issues before proceeding.
```

### Lint Check

```bash
# Backend
cd backend
pip install flake8 black isort
flake8 app/ --max-line-length=120 --exclude=__pycache__
black app/ --check
isort app/ --check-only

# Frontend
cd frontend
npm run lint
```

**If lint fails:**
```
⚠️  WARNING: Lint errors found.

Auto-fix with:
black app/ && isort app/  # Backend
npm run lint -- --fix      # Frontend
```

### Build Verification

```bash
# Frontend build
cd frontend
npm run build

# Backend syntax check
cd backend
python -m py_compile app/main.py
```

**If build fails:**
```
🔴 STOP: Build failed.
Fix build errors before proceeding.
```

---

## Phase 3: Testing

### Automated Tests

```bash
# Backend
cd backend
pytest -v

# Frontend (if configured)
cd frontend
npm test
```

**Test Results:**
- [ ] All tests pass
- [ ] No skipped tests without reason
- [ ] Coverage acceptable

**If tests fail:**
```
🔴 STOP: Tests failing.

Options:
1. Fix the failing tests
2. Fix the code that tests are catching
3. If test is obsolete, update or remove it
```

### Manual Smoke Test

Verify these manually:
- [ ] App starts without errors
- [ ] Can login with test credentials
- [ ] Main features work (run an ETL job preview)
- [ ] No console errors in browser

---

## Phase 4: Pre-Deploy Checks

Execute: `/pre-deploy {target}`

**Must verify:**
- [ ] Environment variables configured
- [ ] Secrets files present
- [ ] Database migrations ready
- [ ] Docker builds successfully

---

## Phase 5: Create PR

Execute: `/create-pr`

### PR Checklist

Before creating:
- [ ] Meaningful commit messages
- [ ] No debug code left in
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] CHANGELOG updated (if applicable)

### Create the PR

```bash
gh pr create \
  --title "{type}: {description}" \
  --body "$(cat <<'EOF'
## Summary
{what this PR does}

## Changes
- {change 1}
- {change 2}

## Testing
- [ ] All tests pass
- [ ] Manual testing completed
- [ ] Security review passed

## Pre-Deploy Checklist
- [ ] Environment vars documented
- [ ] Database migrations included
- [ ] No breaking changes (or documented)

---
🚀 Ready to ship!
EOF
)"
```

---

## Phase 6: Post-Merge Deployment

### Deployment Commands

```bash
# SSH to production
ssh ubuntu@{production-ip}

# Navigate to app
cd /home/ubuntu/etl_app/new_app

# Pull latest
git pull origin main

# Deploy
./deploy.sh
# OR for hot reload:
docker-compose -f docker-compose.prod.yml up -d --build
```

### Deployment Verification

```bash
# Check containers running
docker-compose -f docker-compose.prod.yml ps

# Check health endpoints
curl http://localhost:8000/health
curl http://localhost/health

# Check logs for errors
docker-compose -f docker-compose.prod.yml logs --tail=50 backend
docker-compose -f docker-compose.prod.yml logs --tail=50 celery-worker

# Run a quick test
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@p1lending.com&password=..."
```

---

## Output Format

```markdown
# Ship It Report

## Status: ✅ Ready to Ship / ⚠️ Issues Found / 🔴 Blocked

## Pre-Flight Summary

| Check | Status | Notes |
|-------|--------|-------|
| Git Clean | ✅/❌ | {notes} |
| Branch Synced | ✅/❌ | {notes} |
| Security | ✅/❌ | {notes} |
| Lint | ✅/❌ | {notes} |
| Build | ✅/❌ | {notes} |
| Tests | ✅/❌ | {notes} |
| Pre-Deploy | ✅/❌ | {notes} |

## Blockers (if any)

1. {blocker description}
   - **Fix**: {how to fix}

## PR Information

- **Title**: {pr title}
- **Branch**: {branch name}
- **URL**: {pr url after creation}

## Deployment Steps

1. Merge PR
2. SSH to production
3. `cd /home/ubuntu/etl_app/new_app`
4. `git pull origin main`
5. `./deploy.sh`
6. Verify with health checks

## Rollback Plan

If issues after deployment:

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or rollback database
docker-compose -f docker-compose.prod.yml exec backend alembic downgrade -1

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

## Post-Deploy Verification

- [ ] Health endpoints return 200
- [ ] No errors in logs
- [ ] Can login to app
- [ ] ETL jobs can be started
- [ ] WebSocket updates working
```

---

## Error Handling

| Phase | Error | Action |
|-------|-------|--------|
| Pre-Flight | Uncommitted changes | Commit or stash |
| Security | Critical issues | Fix before proceeding |
| Testing | Tests fail | Fix code or tests |
| Build | Build error | Debug and fix |
| Deploy | Container fails | Check logs, rollback |

---

## Abort Conditions

**STOP and do not proceed if:**

1. 🔴 Security vulnerabilities found (CRITICAL/HIGH)
2. 🔴 Tests failing
3. 🔴 Build broken
4. 🔴 Missing required secrets
5. 🔴 Database migration has issues

---

## Validation Checklist

Final validation before marking as shipped:

- [ ] PR merged to main
- [ ] Deployed to production
- [ ] All health checks passing
- [ ] No errors in logs (last 15 minutes)
- [ ] Tested main user flows
- [ ] Team notified of deployment
