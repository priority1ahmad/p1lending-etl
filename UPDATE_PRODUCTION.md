# Updating Production Instance

This guide shows how to update your existing production deployment with the latest changes.

## Quick Update (Recommended)

If you're already on your EC2 server:

```bash
cd ~/new_app

# Pull latest code (if using git)
git pull
# OR if you need to transfer files manually, see Step 1 below

# Rebuild and restart
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Run migrations if any
docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head
```

---

## Step-by-Step Update Process

### Step 1: Transfer Updated Code

**Option A: Using Git (if code is in a repository)**
```bash
cd ~/new_app
git pull origin main  # or your branch name
```

**Option B: Using SCP (from your local machine)**
```powershell
# Windows PowerShell - transfer only changed files
scp -r C:\Users\AhmadAllouch\Desktop\LodasoftETL\new_app\backend\app ubuntu@YOUR_EC2_IP:~/new_app/backend/
scp C:\Users\AhmadAllouch\Desktop\LodasoftETL\new_app\docker-compose.prod.yml ubuntu@YOUR_EC2_IP:~/new_app/
scp C:\Users\AhmadAllouch\Desktop\LodasoftETL\new_app\env.example ubuntu@YOUR_EC2_IP:~/new_app/
```

**Option C: Transfer entire directory (if many files changed)**
```powershell
# Windows PowerShell
scp -r C:\Users\AhmadAllouch\Desktop\LodasoftETL\new_app ubuntu@YOUR_EC2_IP:~/new_app
```

### Step 2: Update Environment Variables (if needed)

If you need to add the new Google credentials configuration:

```bash
cd ~/new_app

# Backup current .env
cp .env .env.backup

# Check if GOOGLE_CREDENTIALS_JSON is already set
grep GOOGLE_CREDENTIALS .env

# If not set and you want to use it, edit .env
nano .env
```

Add or update in `.env`:
```bash
# Option 1: Use JSON in .env (recommended - no file needed)
GOOGLE_CREDENTIALS_JSON='{"type":"service_account",...}'

# Option 2: Keep using file (backend will auto-find it)
# GOOGLE_CREDENTIALS_FILE=/app/secrets/google_credentials.json
# (Leave unset to auto-search, or set explicit path)
```

**To convert your existing credentials file to JSON format:**
```bash
# On EC2, if you have the file
python3 backend/scripts/convert_google_credentials.py backend/secrets/google_credentials.json
# Copy the output and add to GOOGLE_CREDENTIALS_JSON in .env
```

### Step 3: Update Secrets (if needed)

If you're switching to JSON-based credentials, you can keep the file as backup or remove it:

```bash
# The backend will now find credentials automatically or use .env
# No changes needed to secrets directory if using GOOGLE_CREDENTIALS_JSON
```

### Step 4: Rebuild and Restart Services

```bash
cd ~/new_app

# Stop existing containers (keeps data volumes)
docker compose -f docker-compose.prod.yml down

# Rebuild images with latest code
docker compose -f docker-compose.prod.yml build

# Start services
docker compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
sleep 10
```

### Step 5: Run Database Migrations

```bash
# Check current migration status
docker compose -f docker-compose.prod.yml exec -T backend alembic current

# Run any new migrations
docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head
```

### Step 6: Verify Update

```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# Check logs for errors
docker compose -f docker-compose.prod.yml logs --tail=50 backend

# Test health endpoints
curl http://localhost/health
curl http://localhost:8000/health

# Test Google Sheets connection (check logs)
docker compose -f docker-compose.prod.yml logs backend | grep -i "google"
```

---

## Update Scenarios

### Scenario 1: Code Changes Only (No Config Changes)

```bash
cd ~/new_app
git pull  # or transfer files
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head
```

### Scenario 2: Adding Google Credentials JSON Support

```bash
cd ~/new_app

# 1. Convert credentials file to JSON (if you want to use .env method)
python3 backend/scripts/convert_google_credentials.py backend/secrets/google_credentials.json

# 2. Add GOOGLE_CREDENTIALS_JSON to .env
nano .env
# Paste the JSON output from step 1

# 3. Rebuild and restart
docker compose -f docker-compose.prod.yml build backend celery-worker
docker compose -f docker-compose.prod.yml up -d

# 4. Verify
docker compose -f docker-compose.prod.yml logs backend | grep -i "google"
```

### Scenario 3: Full Update with Config Changes

```bash
cd ~/new_app

# 1. Backup current state
cp .env .env.backup
docker compose -f docker-compose.prod.yml ps > containers_backup.txt

# 2. Update code
git pull  # or transfer files

# 3. Update .env if needed (compare with env.example)
nano .env

# 4. Rebuild everything
docker compose -f docker-compose.prod.yml build --no-cache

# 5. Restart
docker compose -f docker-compose.prod.yml up -d

# 6. Migrations
docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head

# 7. Verify
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=50
```

---

## Zero-Downtime Update (Advanced)

For minimal downtime, update services one at a time:

```bash
cd ~/new_app

# 1. Update backend first
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml up -d backend

# 2. Wait for backend to be healthy
sleep 10
curl http://localhost:8000/health

# 3. Update celery worker
docker compose -f docker-compose.prod.yml build celery-worker
docker compose -f docker-compose.prod.yml up -d celery-worker

# 4. Update frontend last
docker compose -f docker-compose.prod.yml build frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

---

## Rollback if Something Goes Wrong

If the update causes issues:

```bash
cd ~/new_app

# Option 1: Restore previous containers (if you have backups)
docker compose -f docker-compose.prod.yml down
# Restore from backup if you have one

# Option 2: Revert code and rebuild
git checkout HEAD~1  # or previous commit
# OR restore files from backup
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Option 3: Restore .env if config was the issue
cp .env.backup .env
docker compose -f docker-compose.prod.yml restart
```

---

## Verification Checklist

After updating, verify:

- [ ] All containers are running: `docker compose -f docker-compose.prod.yml ps`
- [ ] No errors in logs: `docker compose -f docker-compose.prod.yml logs --tail=50`
- [ ] Frontend loads: `curl http://localhost/health`
- [ ] Backend API works: `curl http://localhost:8000/health`
- [ ] Google credentials load correctly (check logs for "✅ Google Sheets API credentials")
- [ ] Database migrations applied: `docker compose -f docker-compose.prod.yml exec backend alembic current`
- [ ] Can log in to the application
- [ ] ETL jobs can run (test a small job if possible)

---

## Common Update Issues

### Issue: Containers won't start after update

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check for port conflicts
sudo netstat -tulpn | grep -E '80|8000|5433|6380'

# Rebuild with no cache
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

### Issue: Google credentials not found after update

```bash
# Check if credentials are being loaded
docker compose -f docker-compose.prod.yml logs backend | grep -i "google"

# Verify .env has GOOGLE_CREDENTIALS_JSON or file exists
grep GOOGLE_CREDENTIALS .env
ls -la backend/secrets/google_credentials.json

# Restart backend
docker compose -f docker-compose.prod.yml restart backend
```

### Issue: Database migration errors

```bash
# Check migration status
docker compose -f docker-compose.prod.yml exec backend alembic current

# View migration history
docker compose -f docker-compose.prod.yml exec backend alembic history

# If needed, rollback one migration
docker compose -f docker-compose.prod.yml exec backend alembic downgrade -1
```

---

## Quick Reference Commands

```bash
# Update code and restart
cd ~/new_app && git pull && docker compose -f docker-compose.prod.yml build && docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check status
docker compose -f docker-compose.prod.yml ps

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend

# Run migrations
docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head
```

