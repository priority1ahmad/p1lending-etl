# Production Deployment Fix - Logs Permission Error

## Problem
The application was receiving `[Errno 13] Permission denied: 'backend/logs/jobs'` error in production.

## Solution Applied
1. ✅ Fixed path calculation to use absolute paths instead of relative paths
2. ✅ Added error handling with fallback to temp directory
3. ✅ Fixed Docker volume mounts (changed from `./backend/backend/logs` to `./backend/logs`)
4. ✅ Updated Dockerfile to create logs directory with proper permissions

## Quick Deployment (Recommended)

**On your production server, run:**

```bash
# 1. Navigate to your app directory
cd ~/new_app  # or your app path

# 2. Pull latest code (if using git)
git pull origin main

# OR transfer these files manually:
# - backend/app/core/logger.py
# - backend/app/api/v1/endpoints/jobs.py
# - docker-compose.prod.yml
# - backend/Dockerfile

# 3. Run the quick fix script
chmod +x quick-fix-deploy.sh
bash quick-fix-deploy.sh
```

That's it! The script will:
- Create the logs directory
- Rebuild containers
- Restart services

## Manual Deployment Instructions

### Option 1: Quick Update (Recommended)

If you have SSH access to your production server:

```bash
# 1. SSH into your EC2 instance
ssh ubuntu@YOUR_EC2_IP

# 2. Navigate to your app directory
cd ~/new_app  # or wherever your app is located

# 3. Pull latest code (if using git)
git pull origin main  # or your branch name

# OR if not using git, transfer the updated files:
# - backend/app/core/logger.py
# - backend/app/api/v1/endpoints/jobs.py
# - docker-compose.prod.yml
# - backend/Dockerfile

# 4. Create the logs directory on the host (if it doesn't exist)
mkdir -p backend/logs/jobs
chmod -R 755 backend/logs

# 5. Stop existing containers
docker compose -f docker-compose.prod.yml down

# 6. Rebuild containers with the fixes
docker compose -f docker-compose.prod.yml build --no-cache

# 7. Start services
docker compose -f docker-compose.prod.yml up -d

# 8. Verify the fix
docker compose -f docker-compose.prod.yml logs backend | grep -i "log\|error" | tail -20
```

### Option 2: Complete Redeployment

If you prefer a fresh deployment:

```bash
# 1. SSH into your EC2 instance
ssh ubuntu@YOUR_EC2_IP

# 2. Navigate to your app directory
cd ~/new_app

# 3. Backup your .env file (important!)
cp .env .env.backup

# 4. Pull/transfer latest code
git pull origin main  # or transfer files manually

# 5. Ensure logs directory exists
mkdir -p backend/logs/jobs
chmod -R 755 backend/logs

# 6. Run the deployment script
bash deploy-on-server.sh

# OR manually:
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# 7. Wait for services to start, then run migrations
sleep 15
docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head
```

### Option 3: Manual File Transfer (Windows to EC2)

If you need to transfer files manually from Windows:

```powershell
# 1. Use SCP to transfer updated files
scp backend/app/core/logger.py ubuntu@YOUR_EC2_IP:~/new_app/backend/app/core/
scp backend/app/api/v1/endpoints/jobs.py ubuntu@YOUR_EC2_IP:~/new_app/backend/app/api/v1/endpoints/
scp docker-compose.prod.yml ubuntu@YOUR_EC2_IP:~/new_app/
scp backend/Dockerfile ubuntu@YOUR_EC2_IP:~/new_app/backend/

# 2. Then SSH and rebuild
ssh ubuntu@YOUR_EC2_IP
cd ~/new_app
mkdir -p backend/logs/jobs
chmod -R 755 backend/logs
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

## Verification

After deployment, verify the fix:

```bash
# Check if logs directory exists and is writable
docker compose -f docker-compose.prod.yml exec backend ls -la /app/backend/logs/jobs

# Check container logs for errors
docker compose -f docker-compose.prod.yml logs backend | tail -50
docker compose -f docker-compose.prod.yml logs celery-worker | tail -50

# Test by creating a job (if you have access to the UI)
# The job should complete without permission errors
```

## Files Changed

The following files were updated:

1. **backend/app/core/logger.py**
   - Added `get_logs_dir()` function for absolute path resolution
   - Updated `JobLogger` to use absolute paths
   - Added permission error handling with fallback

2. **backend/app/api/v1/endpoints/jobs.py**
   - Updated to use `get_logs_dir()` function

3. **docker-compose.prod.yml**
   - Fixed volume mount from `./backend/backend/logs` to `./backend/logs`

4. **backend/Dockerfile**
   - Added creation of logs directory with proper permissions

## Troubleshooting

If you still encounter permission errors:

1. **Check directory permissions on host:**
   ```bash
   ls -la backend/logs
   # Should show drwxr-xr-x permissions
   ```

2. **Check container permissions:**
   ```bash
   docker compose -f docker-compose.prod.yml exec backend ls -la /app/backend/logs
   ```

3. **Manually fix permissions:**
   ```bash
   sudo chown -R $USER:$USER backend/logs
   chmod -R 755 backend/logs
   ```

4. **Check Docker volume mount:**
   ```bash
   docker compose -f docker-compose.prod.yml config | grep -A 5 "volumes:"
   # Should show: ./backend/logs:/app/backend/logs
   ```

5. **If all else fails, the code will fallback to temp directory:**
   - Logs will be written to `/tmp/p1lending_etl/logs/jobs` inside the container
   - This is a temporary solution but will work

## Rollback

If you need to rollback:

```bash
# Stop containers
docker compose -f docker-compose.prod.yml down

# Restore previous code (if using git)
git checkout HEAD~1  # or specific commit

# Rebuild and restart
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

## Notes

- The fix ensures logs directory is created with proper permissions
- Uses absolute paths to avoid working directory issues
- Includes fallback mechanism for permission errors
- No data loss - existing log files will remain accessible

