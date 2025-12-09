# Deployment Scripts Guide

This document explains how to use the automated deployment scripts for the P1Lending ETL staging server.

---

## Available Scripts

| Script | Purpose | Speed | Use Case |
|--------|---------|-------|----------|
| `deploy-staging-auto.sh` | Full deployment with verification | Slower | Production-like deployments |
| `quick-deploy.sh` | Fast deployment, minimal checks | Faster | Rapid development iteration |

---

## 1. Full Auto-Deployment Script

### File: `deploy-staging-auto.sh`

**Features:**
- ✅ SSH connection verification
- ✅ Code pull with change summary
- ✅ .env backup (timestamped)
- ✅ Database migrations
- ✅ Full rebuild of Docker images
- ✅ Health checks
- ✅ Log preview
- ✅ Deployment summary

### Usage

```bash
# Basic usage (uses defaults)
./deploy-staging-auto.sh

# Specify server IP
./deploy-staging-auto.sh 13.218.65.240

# Specify server and SSH key
./deploy-staging-auto.sh 13.218.65.240 ~/.ssh/staging_key.pem

# Use domain name
./deploy-staging-auto.sh staging.etl.p1lending.io ~/.ssh/id_rsa
```

### Default Values

```bash
SERVER: 13.218.65.240
SSH_KEY: ~/.ssh/staging_key.pem
SSH_USER: ubuntu
REMOTE_DIR: ~/etl_app
BRANCH: staging
```

### What It Does

1. **Tests SSH connection** - Verifies access to server
2. **Checks app directory** - Ensures git repo exists
3. **Pulls latest code** - Shows commits being deployed
4. **Backs up .env** - Creates timestamped backup
5. **Runs migrations** - Applies database schema changes
6. **Rebuilds images** - Full Docker image rebuild (no cache)
7. **Restarts services** - Brings up all containers
8. **Verifies health** - Checks backend and frontend
9. **Shows logs** - Displays recent logs from all services
10. **Provides summary** - Shows deployed commit and access URLs

### Example Output

```
========================================
P1Lending ETL - Auto Deploy to Staging
========================================

Server: 13.218.65.240
SSH Key: ~/.ssh/staging_key.pem
Branch: staging
Remote Dir: ~/etl_app

This will deploy the latest staging code to the server.
Continue? (y/N): y

========================================
Step 1: Testing SSH Connection
========================================

▶ Connecting to ubuntu@13.218.65.240...
✓ SSH connection verified

========================================
Step 2: Verifying Application Directory
========================================

▶ Checking if ~/etl_app exists...
✓ Application directory exists

[... continues through all steps ...]

========================================
Deployment Summary
========================================

✓ Deployment completed successfully!

Deployed Commit:
  c37211c - Fix staging: restructure sidebar, enhance UI, add documentation

Access URLs:
  Frontend: http://13.218.65.240:3000
  Backend API: http://13.218.65.240:8000
  API Docs: http://13.218.65.240:8000/docs
  Health: http://13.218.65.240:8000/health
```

---

## 2. Quick Deploy Script

### File: `quick-deploy.sh`

**Features:**
- ⚡ Fast execution (no prompts)
- ⚡ Minimal output
- ⚡ Perfect for rapid iteration

### Usage

```bash
# Deploy with defaults
./quick-deploy.sh

# Specify server
./quick-deploy.sh 13.218.65.240
```

### What It Does

1. Pulls latest code from staging branch
2. Rebuilds and restarts Docker containers
3. Done!

### Example Output

```
🚀 Quick Deploy to 13.218.65.240

⬇️  Pulling latest code...
🔄 Restarting services...
✓ Done!

✓ Deployment complete!
Frontend: http://13.218.65.240:3000
Backend: http://13.218.65.240:8000/docs
```

**Use this when:**
- Making small code changes
- Testing frontend updates
- Rapid development cycle
- Already verified server is working

**Don't use this when:**
- Database migrations needed
- Major infrastructure changes
- First deployment
- Need to verify health

---

## Prerequisites

### On Your Local Machine

1. **SSH Key** - Access to staging server
   ```bash
   # Ensure correct permissions
   chmod 400 ~/.ssh/staging_key.pem
   ```

2. **Network Access** - Can reach staging server
   ```bash
   # Test connection
   ssh -i ~/.ssh/staging_key.pem ubuntu@13.218.65.240
   ```

### On Staging Server

1. **Git Repository Cloned**
   ```bash
   ssh -i ~/.ssh/staging_key.pem ubuntu@13.218.65.240
   git clone -b staging https://github.com/priority1ahmad/p1lending-etl.git ~/etl_app
   cd ~/etl_app
   ```

2. **Docker & Docker Compose Installed**
   ```bash
   docker --version
   docker-compose --version
   ```

3. **Environment File (.env)**
   ```bash
   cd ~/etl_app
   cp env.example .env
   nano .env  # Configure your settings
   ```

4. **Initial Setup Complete**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

---

## Workflow Examples

### Scenario 1: Making a Code Change

```bash
# 1. Make your changes locally
vim frontend/src/pages/Dashboard.tsx

# 2. Commit to staging
git add -A
git commit -m "Update dashboard UI"
git push origin staging

# 3. Deploy
./quick-deploy.sh
```

### Scenario 2: Database Schema Change

```bash
# 1. Create migration locally
docker-compose -f docker-compose.prod.yml exec backend alembic revision --autogenerate -m "Add new field"

# 2. Commit migration
git add backend/alembic/versions/
git commit -m "Add new field migration"
git push origin staging

# 3. Deploy with migration
./deploy-staging-auto.sh
```

### Scenario 3: Major Feature Deployment

```bash
# 1. Ensure all code is committed and pushed
git status
git push origin staging

# 2. Use full deployment script
./deploy-staging-auto.sh

# 3. Monitor logs
ssh -i ~/.ssh/staging_key.pem ubuntu@13.218.65.240
cd ~/etl_app
docker-compose -f docker-compose.prod.yml logs -f

# 4. Test thoroughly
# - Open frontend
# - Test login
# - Run ETL job
# - Check real-time updates
```

---

## Troubleshooting

### "Permission denied (publickey)"

```bash
# Check SSH key permissions
ls -la ~/.ssh/staging_key.pem
# Should be: -r-------- (chmod 400)

# Fix permissions
chmod 400 ~/.ssh/staging_key.pem

# Test SSH
ssh -i ~/.ssh/staging_key.pem ubuntu@13.218.65.240 "echo 'Connected!'"
```

### "Application directory not found"

```bash
# Clone repository on server
ssh -i ~/.ssh/staging_key.pem ubuntu@13.218.65.240
git clone -b staging https://github.com/priority1ahmad/p1lending-etl.git ~/etl_app
exit

# Try deployment again
./deploy-staging-auto.sh
```

### "Migration failed"

```bash
# SSH into server
ssh -i ~/.ssh/staging_key.pem ubuntu@13.218.65.240
cd ~/etl_app

# Check migration status
docker-compose -f docker-compose.prod.yml exec backend alembic current

# View migration history
docker-compose -f docker-compose.prod.yml exec backend alembic history

# Manually run migration
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### "Container won't start"

```bash
# SSH into server
ssh -i ~/.ssh/staging_key.pem ubuntu@13.218.65.240
cd ~/etl_app

# Check container status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### "Health check fails"

```bash
# Wait a bit longer (containers may still be starting)
sleep 30

# Check manually
curl http://localhost:8000/health
curl http://localhost:3000

# Check if ports are listening
ss -tulpn | grep -E ':(3000|8000)'
```

---

## Advanced Usage

### Deploy from a Specific Branch

Edit the script and change:
```bash
BRANCH="staging"
# to
BRANCH="feature-branch"
```

Or modify on-the-fly:
```bash
ssh -i ~/.ssh/staging_key.pem ubuntu@13.218.65.240 bash << 'EOF'
cd ~/etl_app
git fetch origin
git checkout feature-branch
git pull origin feature-branch
docker-compose -f docker-compose.prod.yml up -d --build
EOF
```

### Skip Rebuild (Faster)

Modify `quick-deploy.sh` to skip rebuild:
```bash
docker-compose -f docker-compose.prod.yml up -d
# Instead of:
docker-compose -f docker-compose.prod.yml up -d --build
```

### Deploy with Rollback Option

```bash
# Before deploying, save current commit
CURRENT=$(ssh -i ~/.ssh/staging_key.pem ubuntu@13.218.65.240 "cd ~/etl_app && git rev-parse HEAD")

# Deploy
./deploy-staging-auto.sh

# If something goes wrong, rollback
ssh -i ~/.ssh/staging_key.pem ubuntu@13.218.65.240 bash << EOF
cd ~/etl_app
git checkout $CURRENT
docker-compose -f docker-compose.prod.yml up -d --build
EOF
```

---

## Best Practices

### 1. Always Test Locally First
```bash
# Test frontend
cd frontend && npm run build

# Test backend (if you have Python env)
cd backend && python -m pytest
```

### 2. Check Git Status Before Deploy
```bash
git status
git log --oneline -5
```

### 3. Monitor After Deployment
```bash
# Watch logs for errors
ssh -i ~/.ssh/staging_key.pem ubuntu@13.218.65.240 \
  "cd ~/etl_app && docker-compose -f docker-compose.prod.yml logs -f --tail=50"
```

### 4. Keep .env Backups
The full deployment script automatically creates backups:
```
.env.backup.20241208_143022
.env.backup.20241208_151533
```

To restore:
```bash
ssh -i ~/.ssh/staging_key.pem ubuntu@13.218.65.240
cd ~/etl_app
cp .env.backup.YYYYMMDD_HHMMSS .env
docker-compose -f docker-compose.prod.yml restart
```

### 5. Use Quick Deploy for Frontend, Full Deploy for Backend

**Frontend changes** (UI, styling, components):
```bash
./quick-deploy.sh
```

**Backend changes** (API, database, migrations):
```bash
./deploy-staging-auto.sh
```

---

## Automation Ideas

### Cron Job for Auto-Deploy

```bash
# Deploy every night at 2 AM
0 2 * * * /home/user/projects/LodasoftETL/new_app/quick-deploy.sh >> /var/log/auto-deploy.log 2>&1
```

### GitHub Actions Webhook

Set up auto-deploy on push to staging branch:

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging
on:
  push:
    branches: [staging]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy
        run: ./deploy-staging-auto.sh ${{ secrets.STAGING_SERVER }} ${{ secrets.SSH_KEY }}
```

---

## Summary

| When to Use | Script | Command |
|-------------|--------|---------|
| First deployment | Full script | `./deploy-staging-auto.sh` |
| Database changes | Full script | `./deploy-staging-auto.sh` |
| Major features | Full script | `./deploy-staging-auto.sh` |
| Bug fixes | Quick script | `./quick-deploy.sh` |
| UI tweaks | Quick script | `./quick-deploy.sh` |
| Frontend changes | Quick script | `./quick-deploy.sh` |
| Testing iteration | Quick script | `./quick-deploy.sh` |

---

**Remember**: Always commit and push to staging branch before running deployment scripts!

---

*Last Updated: December 8, 2024*
