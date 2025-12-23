---
allowed-tools: Bash, Read, AskUserQuestion, TodoWrite, SlashCommand
description: Streamlined deployment workflow with safety checks
argument-hint: <environment> [--skip-checks]
---

## Task
Deploy to **$1** environment $2

## Supported Environments

- `staging` - Deploy to staging server (ubuntu@13.218.65.240)
- `production` - Deploy to production server (TBD)
- `rollback` - Rollback last deployment
- `status` - Show deployment status

---

## Pre-Flight Safety Checks

Before ANY deployment, run these checks (unless `--skip-checks` flag provided):

### 1. Run Pre-Deploy Checklist
Execute `/pre-deploy` command to verify:
- [ ] Code quality (linting, type checking)
- [ ] Tests passing
- [ ] No secrets in code
- [ ] Database migrations ready
- [ ] Git status clean

### 2. Environment Confirmation
Use AskUserQuestion to confirm:
- **Environment**: staging or production
- **Current branch**: Show with `git branch --show-current`
- **Last commit**: Show with `git log --oneline -1`
- **Uncommitted changes**: Show with `git status --short`

**Warning message if production**:
```
⚠️  PRODUCTION DEPLOYMENT
You are about to deploy to PRODUCTION environment.
- All changes will affect live users
- Ensure staging tests passed
- Have rollback plan ready
```

### 3. Show Deployment Preview
Display what will be deployed:
- Environment: {staging|production}
- Branch: {current-branch}
- Commit: {commit-hash} {commit-message}
- Changed files: `git diff --name-only origin/{branch}..HEAD`
- Migration changes: Check if new migrations exist

---

## Deployment Workflow: STAGING

### Step 1: Pre-Deployment Validation
```bash
# Verify we're on staging branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "staging" ]; then
  echo "ERROR: Not on staging branch (current: $CURRENT_BRANCH)"
  exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "WARNING: Uncommitted changes detected"
  git status --short
fi
```

### Step 2: Local Build Test (Optional)
Ask user if they want to test build locally first:
```bash
# Backend
cd backend && pip install -r requirements.txt
cd backend && ruff check .
cd backend && pytest

# Frontend
cd frontend && npm install
cd frontend && npm run build
```

### Step 3: Deploy to Staging Server
**Server**: ubuntu@13.218.65.240
**App Directory**: /home/ubuntu/etl-staging

```bash
# SSH to staging server and execute deployment
ssh ubuntu@13.218.65.240 << 'ENDSSH'
  cd /home/ubuntu/etl-staging

  # Show current status
  echo "=== Current Status ==="
  git log --oneline -1
  docker compose -f docker-compose.prod.yml ps

  # Pull latest changes
  echo "=== Pulling Latest Code ==="
  git fetch origin staging
  git reset --hard origin/staging

  # Show what changed
  git log --oneline -5

  # Rebuild containers
  echo "=== Building Containers ==="
  docker compose -f docker-compose.prod.yml build --no-cache

  # Stop services
  echo "=== Stopping Services ==="
  docker compose -f docker-compose.prod.yml down

  # Run migrations
  echo "=== Running Migrations ==="
  docker compose -f docker-compose.prod.yml run --rm backend alembic upgrade head

  # Start services
  echo "=== Starting Services ==="
  docker compose -f docker-compose.prod.yml up -d

  # Wait for services to be healthy
  echo "=== Waiting for Services ==="
  sleep 10

  # Show running containers
  docker compose -f docker-compose.prod.yml ps
ENDSSH
```

### Step 4: Health Checks
Verify deployment succeeded:
```bash
# Test backend health
curl -f http://13.218.65.240:8000/health || echo "Backend health check FAILED"

# Test frontend
curl -f http://13.218.65.240/ || echo "Frontend health check FAILED"

# Show recent logs
ssh ubuntu@13.218.65.240 "cd /home/ubuntu/etl-staging && docker compose -f docker-compose.prod.yml logs --tail=50"
```

### Step 5: Smoke Tests
Run basic functionality tests:
```bash
# Test authentication endpoint
curl -X POST http://13.218.65.240:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@p1lending.com","password":"admin123"}' \
  | jq .

# Test database connectivity
ssh ubuntu@13.218.65.240 "cd /home/ubuntu/etl-staging && docker compose -f docker-compose.prod.yml exec -T backend python scripts/test_both_lists.py"
```

### Step 6: Deployment Summary
Create TodoWrite checklist for manual verification:
```
Deployment to STAGING completed at {timestamp}

Manual Verification Checklist:
- [ ] Login to UI: http://13.218.65.240
- [ ] Test ETL job creation
- [ ] Verify SQL scripts page loads
- [ ] Check WebSocket connection (real-time logs)
- [ ] Test results page
- [ ] Verify NTFY notifications working
- [ ] Check system health page

Rollback command (if needed):
/quick-deploy rollback
```

---

## Deployment Workflow: PRODUCTION

**NOT YET CONFIGURED**

Ask user to provide:
- Production server IP/hostname
- SSH credentials location
- Application directory
- Any production-specific environment variables

Show message:
```
Production deployment is not yet configured.
Please update CLAUDE.md with:
- Production server details
- Production database credentials
- Production-specific environment variables
```

---

## Rollback Procedure

### What Rollback Does
- Reverts to previous Git commit
- Rebuilds containers with old code
- Does NOT rollback database migrations (manual step)

### Rollback Steps
1. **Identify last known good commit**:
   ```bash
   ssh ubuntu@13.218.65.240 "cd /home/ubuntu/etl-staging && git log --oneline -10"
   ```

2. **Ask user which commit to rollback to** via AskUserQuestion

3. **Execute rollback**:
   ```bash
   ssh ubuntu@13.218.65.240 << 'ENDSSH'
     cd /home/ubuntu/etl-staging

     # Checkout specific commit
     git fetch origin
     git checkout {commit-hash}

     # Rebuild and restart
     docker compose -f docker-compose.prod.yml build --no-cache
     docker compose -f docker-compose.prod.yml down
     docker compose -f docker-compose.prod.yml up -d

     # Show status
     docker compose -f docker-compose.prod.yml ps
   ENDSSH
   ```

4. **Database migration rollback** (if needed):
   - Ask user if database migrations need rollback
   - Run `/db-manage migrate-down` if confirmed
   - **WARNING**: This can cause data loss

5. **Verify rollback**:
   - Run health checks
   - Test critical functionality
   - Show logs

---

## Deployment Status

### What It Shows
- Current deployed commit on staging/production
- Services running status
- Recent logs
- Last deployment timestamp

### Commands
```bash
# Staging status
ssh ubuntu@13.218.65.240 << 'ENDSSH'
  cd /home/ubuntu/etl-staging

  echo "=== Git Status ==="
  git log --oneline -1
  git branch --show-current

  echo "=== Container Status ==="
  docker compose -f docker-compose.prod.yml ps

  echo "=== Recent Logs ==="
  docker compose -f docker-compose.prod.yml logs --tail=20 backend

  echo "=== Disk Usage ==="
  df -h | grep -E "Filesystem|/home"

  echo "=== Docker Images ==="
  docker images | grep -E "REPOSITORY|etl-staging"
ENDSSH
```

---

## Environment Detection

Automatically detect environment based on:
1. Git branch (`staging` branch → staging environment)
2. Server in SSH config
3. User confirmation

**Branch → Environment mapping**:
- `staging` → Staging server
- `main` → Production server (when configured)
- `develop` → Development (local)

---

## Flags & Options

### --skip-checks
Skip pre-flight validation (NOT RECOMMENDED)

**Use case**: Emergency hotfix deployment

**Example**:
```bash
/quick-deploy staging --skip-checks
```

**WARNING**: Bypasses:
- Pre-deploy checklist
- Build tests
- Linting

### --build-only
Build containers without deploying

**Example**:
```bash
/quick-deploy staging --build-only
```

### --migrate-only
Run migrations only (no code deployment)

**Example**:
```bash
/quick-deploy staging --migrate-only
```

---

## Error Handling

### Common Issues

**1. SSH Connection Failed**
```
Error: ssh: connect to host 13.218.65.240 port 22: Connection refused

Solution:
- Check VPN connection
- Verify SSH key: ssh-add -l
- Test connection: ssh ubuntu@13.218.65.240 echo "OK"
```

**2. Docker Build Failed**
```
Error: failed to solve: process "/bin/sh -c pip install..." did not complete

Solution:
- Check requirements.txt syntax
- Verify base image available
- Review build logs: docker compose -f docker-compose.prod.yml logs --tail=100
```

**3. Migration Failed**
```
Error: alembic.util.exc.CommandError: Target database is not up to date

Solution:
- Check migration conflicts
- Verify database connectivity
- Run: /db-manage migrations
- Manual intervention may be required
```

**4. Health Check Failed**
```
Error: curl: (7) Failed to connect to 13.218.65.240 port 8000

Solution:
- Check container status: docker compose ps
- View logs: docker compose logs backend
- Verify port mapping in docker-compose.prod.yml
```

---

## Deployment Checklist Template

Every deployment creates a TodoWrite checklist:

```
Deployment to {environment} - {timestamp}

Pre-Deployment:
- [ ] Pre-deploy checks passed (/pre-deploy)
- [ ] Environment confirmed: {environment}
- [ ] Branch verified: {branch}
- [ ] Uncommitted changes: {yes/no}

Deployment:
- [ ] Code pulled from origin
- [ ] Containers rebuilt
- [ ] Migrations executed
- [ ] Services restarted
- [ ] Health checks passed

Post-Deployment:
- [ ] UI accessible
- [ ] Authentication working
- [ ] Core features tested
- [ ] Logs reviewed
- [ ] Team notified

Rollback Plan:
- Previous commit: {commit-hash}
- Rollback command: /quick-deploy rollback
```

---

## Integration with Other Commands

### Before Deployment
1. Run `/pre-deploy` - Code quality checks
2. Run `/security-review` - Security audit
3. Run `/db-manage migrations` - Check migrations

### After Deployment
1. Run `/health-check` - System health verification
2. Run `/debug-etl` - Test ETL job functionality
3. Update CHANGELOG.md

---

## Best Practices

1. **Always deploy to staging first** - Never skip staging
2. **Test critical user journeys** - Manual testing after deployment
3. **Monitor logs for 5-10 minutes** - Watch for errors
4. **Keep rollback plan ready** - Know the last good commit
5. **Notify team** - Communication is key
6. **Document issues** - Use `/feedback` command

---

## Example Usage

```bash
# Standard staging deployment with all checks
/quick-deploy staging

# Emergency hotfix (skip checks)
/quick-deploy staging --skip-checks

# Check deployment status
/quick-deploy status

# Rollback last deployment
/quick-deploy rollback

# Production deployment (when configured)
/quick-deploy production
```

---

## Output Format

**Successful Deployment**:
```
✅ Deployment to STAGING completed successfully

Environment: staging
Server: ubuntu@13.218.65.240
Branch: staging
Commit: abc1234 Add new feature

Services Status:
✅ backend       - healthy
✅ celery-worker - healthy
✅ frontend      - healthy
✅ postgres      - healthy
✅ redis         - healthy

Health Checks:
✅ Backend API:   http://13.218.65.240:8000/health
✅ Frontend:      http://13.218.65.240/

Next Steps:
- Manual testing checklist added to TodoWrite
- Monitor logs for 5-10 minutes
- Test critical user journeys
```

**Failed Deployment**:
```
❌ Deployment to STAGING failed

Error: Docker build failed
Location: Backend container build
Details: [error message]

Troubleshooting:
1. Review build logs: [command]
2. Check requirements.txt
3. Verify base image

Rollback recommended:
/quick-deploy rollback
```
