# Deployment Scripts Guide

This document explains how to use the automated deployment scripts for the P1Lending ETL staging server.

**IMPORTANT:** These scripts are designed to run **directly on the staging server**, not from your local machine via SSH.

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
- ✅ Code pull with change summary
- ✅ .env backup (timestamped)
- ✅ Database migrations
- ✅ Full rebuild of Docker images
- ✅ Health checks
- ✅ Log preview
- ✅ Deployment summary

### Usage (On Staging Server)

```bash
# SSH into staging server
ssh -i ~/.ssh/staging_key.pem ubuntu@13.218.65.240

# Navigate to app directory
cd ~/etl_app

# Run deployment script
./deploy-staging-auto.sh
```

### Configuration

```bash
APP_DIR: Current directory (pwd)
BRANCH: staging
```

### What It Does

1. **Validates directory** - Ensures running from ~/etl_app
2. **Pulls latest code** - Shows commits being deployed
3. **Backs up .env** - Creates timestamped backup
4. **Runs migrations** - Applies database schema changes
5. **Rebuilds images** - Full Docker image rebuild (no cache)
6. **Restarts services** - Brings up all containers
7. **Verifies health** - Checks backend and frontend
8. **Shows logs** - Displays recent logs from all services
9. **Provides summary** - Shows deployed commit

### Example Output

```
========================================
P1Lending ETL - Auto Deploy Staging
========================================

Directory: /home/ubuntu/etl_app
Branch: staging

This will deploy the latest staging code.
Continue? (y/N): y

========================================
Step 1: Pulling Latest Code
========================================

▶ Fetching updates from GitHub...
Fetching from origin...

Changes to be deployed:
  b89531a - Add automated deployment scripts for staging
  c37211c - Fix staging: restructure sidebar, enhance UI, add documentation

Pulling latest staging code...
✓ Latest code pulled successfully

========================================
Step 2: Backing Up Configuration
========================================

▶ Creating backup of .env file...
✓ Backup created: .env.backup.20241208_143022
✓ Configuration backed up

[... continues through all steps ...]

========================================
Deployment Summary
========================================

✓ Deployment completed successfully!

Deployed Commit:
  b89531a - Add automated deployment scripts for staging

Useful Commands:
  View logs: docker-compose -f docker-compose.prod.yml logs -f
  Restart: docker-compose -f docker-compose.prod.yml restart
  Status: docker-compose -f docker-compose.prod.yml ps
```

---

## 2. Quick Deploy Script

### File: `quick-deploy.sh`

**Features:**
- ⚡ Fast execution (no prompts)
- ⚡ Minimal output
- ⚡ Perfect for rapid iteration

### Usage (On Staging Server)

```bash
# SSH into staging server
ssh -i ~/.ssh/staging_key.pem ubuntu@13.218.65.240

# Navigate to app directory
cd ~/etl_app

# Run quick deployment
./quick-deploy.sh
```

### What It Does

1. Pulls latest code from staging branch
2. Rebuilds and restarts Docker containers
3. Done!

### Example Output

```
🚀 Quick Deploy

⬇️  Pulling latest code...
🔄 Restarting services...
✓ Done!

✓ Deployment complete!
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

### On Staging Server

1. **Git Repository Cloned**
   ```bash
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

5. **Scripts Executable**
   ```bash
   chmod +x deploy-staging-auto.sh quick-deploy.sh
   ```

### On Your Local Machine

1. **SSH Key** - Access to staging server
   ```bash
   # Ensure correct permissions
   chmod 400 ~/.ssh/staging_key.pem

   # Test connection
   ssh -i ~/.ssh/staging_key.pem ubuntu@13.218.65.240
   ```

---

## Workflow Examples

### Scenario 1: Making a Code Change

```bash
# 1. Make your changes locally (on your dev machine)
vim frontend/src/pages/Dashboard.tsx

# 2. Commit to staging
git add -A
git commit -m "Update dashboard UI"
git push origin staging

# 3. SSH into staging server and deploy
ssh -i ~/.ssh/staging_key.pem ubuntu@13.218.65.240
cd ~/etl_app
./quick-deploy.sh
```

### Scenario 2: Database Schema Change

```bash
# 1. Create migration locally (on your dev machine)
docker-compose -f docker-compose.prod.yml exec backend alembic revision --autogenerate -m "Add new field"

# 2. Commit migration
git add backend/alembic/versions/
git commit -m "Add new field migration"
git push origin staging

# 3. SSH into staging server and deploy with migration
ssh -i ~/.ssh/staging_key.pem ubuntu@13.218.65.240
cd ~/etl_app
./deploy-staging-auto.sh
```

### Scenario 3: Major Feature Deployment

```bash
# 1. Ensure all code is committed and pushed (on your dev machine)
git status
git push origin staging

# 2. SSH into staging server
ssh -i ~/.ssh/staging_key.pem ubuntu@13.218.65.240
cd ~/etl_app

# 3. Use full deployment script
./deploy-staging-auto.sh

# 4. Monitor logs (already on the server)
docker-compose -f docker-compose.prod.yml logs -f

# 5. Test thoroughly
# - Open frontend in browser
# - Test login
# - Run ETL job
# - Check real-time updates
```

---

## Troubleshooting

### "docker-compose.prod.yml not found"

**Error:** Script exits saying docker-compose.prod.yml not found
**Solution:**
```bash
# Make sure you're in the correct directory
cd ~/etl_app
pwd  # Should show /home/ubuntu/etl_app

# Now run the script
./deploy-staging-auto.sh
```

### "Permission denied (publickey)"

**Error:** Can't SSH into staging server
**Solution:**
```bash
# Check SSH key permissions on your local machine
ls -la ~/.ssh/staging_key.pem
# Should be: -r-------- (chmod 400)

# Fix permissions
chmod 400 ~/.ssh/staging_key.pem

# Test SSH
ssh -i ~/.ssh/staging_key.pem ubuntu@13.218.65.240 "echo 'Connected!'"
```

### "Permission denied" when running scripts

**Error:** `./deploy-staging-auto.sh: Permission denied`
**Solution:**
```bash
# Make scripts executable
chmod +x deploy-staging-auto.sh quick-deploy.sh

# Now run the script
./deploy-staging-auto.sh
```

### "Migration failed"

**Error:** Database migration fails during deployment
**Solution:**
```bash
# Check migration status
docker-compose -f docker-compose.prod.yml exec backend alembic current

# View migration history
docker-compose -f docker-compose.prod.yml exec backend alembic history

# Manually run migration
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### "Container won't start"

**Error:** Docker container fails to start
**Solution:**
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### "Health check fails"

**Error:** Health check fails during deployment verification
**Solution:**
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

Temporarily switch to a different branch:
```bash
# SSH into server
ssh -i ~/.ssh/staging_key.pem ubuntu@13.218.65.240
cd ~/etl_app

# Switch to different branch
git fetch origin
git checkout feature-branch
git pull origin feature-branch

# Deploy
docker-compose -f docker-compose.prod.yml up -d --build
```

### Skip Rebuild (Faster)

For very fast restarts without rebuilding images:
```bash
# Pull code
git pull origin staging

# Just restart (no rebuild)
docker-compose -f docker-compose.prod.yml up -d
```

### Deploy with Rollback Option

```bash
# SSH into server
ssh -i ~/.ssh/staging_key.pem ubuntu@13.218.65.240
cd ~/etl_app

# Before deploying, save current commit
CURRENT=$(git rev-parse HEAD)
echo "Current commit: $CURRENT"

# Deploy
./deploy-staging-auto.sh

# If something goes wrong, rollback
git checkout $CURRENT
docker-compose -f docker-compose.prod.yml up -d --build
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
# SSH into server
ssh -i ~/.ssh/staging_key.pem ubuntu@13.218.65.240
cd ~/etl_app

# Watch logs for errors
docker-compose -f docker-compose.prod.yml logs -f --tail=50
```

### 4. Keep .env Backups
The full deployment script automatically creates backups:
```
.env.backup.20241208_143022
.env.backup.20241208_151533
```

To restore (on staging server):
```bash
cd ~/etl_app
cp .env.backup.YYYYMMDD_HHMMSS .env
docker-compose -f docker-compose.prod.yml restart
```

### 5. Use Quick Deploy for Frontend, Full Deploy for Backend

**Frontend changes** (UI, styling, components):
```bash
ssh -i ~/.ssh/staging_key.pem ubuntu@13.218.65.240
cd ~/etl_app
./quick-deploy.sh
```

**Backend changes** (API, database, migrations):
```bash
ssh -i ~/.ssh/staging_key.pem ubuntu@13.218.65.240
cd ~/etl_app
./deploy-staging-auto.sh
```

---

## Automation Ideas

### Cron Job for Auto-Deploy

Set up automatic nightly deployments on the staging server:

```bash
# SSH into staging server
ssh -i ~/.ssh/staging_key.pem ubuntu@13.218.65.240

# Edit crontab
crontab -e

# Add this line (deploy every night at 2 AM)
0 2 * * * cd /home/ubuntu/etl_app && ./quick-deploy.sh >> /var/log/auto-deploy.log 2>&1
```

### GitHub Actions Webhook

Set up auto-deploy on push to staging branch (requires webhook on server):

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
      - name: Trigger Deploy
        run: |
          ssh -i ${{ secrets.SSH_KEY }} ubuntu@${{ secrets.STAGING_SERVER }} \
            'cd ~/etl_app && ./quick-deploy.sh'
```

---

## Summary

| When to Use | Script | On Staging Server |
|-------------|--------|-------------------|
| First deployment | Full script | `cd ~/etl_app && ./deploy-staging-auto.sh` |
| Database changes | Full script | `cd ~/etl_app && ./deploy-staging-auto.sh` |
| Major features | Full script | `cd ~/etl_app && ./deploy-staging-auto.sh` |
| Bug fixes | Quick script | `cd ~/etl_app && ./quick-deploy.sh` |
| UI tweaks | Quick script | `cd ~/etl_app && ./quick-deploy.sh` |
| Frontend changes | Quick script | `cd ~/etl_app && ./quick-deploy.sh` |
| Testing iteration | Quick script | `cd ~/etl_app && ./quick-deploy.sh` |

---

**Remember**:
1. Always commit and push to staging branch before deploying
2. SSH into the staging server first
3. Run the script from ~/etl_app directory
4. Make sure scripts are executable (`chmod +x *.sh`)

---

*Last Updated: December 8, 2024*
