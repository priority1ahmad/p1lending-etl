# Production Deployment Guide

This guide walks you through deploying the P1Lending ETL app to production on an EC2 instance.

## Quick Start

If you're already on your EC2 server and have the code ready:

```bash
cd ~/new_app
bash deploy-on-server.sh
```

This automated script will handle most of the setup. Continue reading for manual steps or troubleshooting.

---

## Prerequisites

### 1. EC2 Instance Setup

Ensure your EC2 instance has:
- Ubuntu 20.04+ or similar Linux distribution
- Docker and Docker Compose installed
- At least 4GB RAM, 20GB disk space
- Ports 22 (SSH), 80 (HTTP), and optionally 8000 (API) open in security group

### 2. Install Docker (if not already installed)

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y docker.io docker-compose-plugin

# Add your user to docker group (logout/login required)
sudo usermod -aG docker $USER
newgrp docker  # Or logout and login again

# Verify installation
docker --version
docker compose version
```

---

## Step-by-Step Deployment

### Step 1: Transfer Code to EC2

**Option A: Using Git (Recommended)**
```bash
# On EC2
cd ~
git clone YOUR_REPO_URL new_app
cd new_app
```

**Option B: Using SCP (from your local machine)**
```powershell
# Windows PowerShell
scp -r C:\Users\AhmadAllouch\Desktop\LodasoftETL\new_app ubuntu@YOUR_EC2_IP:~/new_app
```

**Option C: Using WinSCP or similar GUI tool**
- Connect to your EC2 instance
- Upload the entire `new_app` folder to `~/new_app`

### Step 2: Configure Environment Variables

```bash
cd ~/new_app

# Create .env from template
cp env.example .env

# Edit .env file
nano .env
```

**Critical `.env` settings to configure:**

```bash
# Database
POSTGRES_PASSWORD=your_strong_password_here

# Application Security
SECRET_KEY=generate-with-python-secrets-token_urlsafe-32

# CORS - Replace with your EC2 IP
CORS_ORIGINS=["http://localhost:3000","http://YOUR_EC2_IP","http://YOUR_EC2_IP:80"]

# Frontend - Leave empty for production (uses relative URLs)
VITE_API_URL=

# Snowflake
SNOWFLAKE_PRIVATE_KEY_PASSWORD=your_snowflake_key_password

# Google Sheets - Option 1 (Recommended): Store JSON in .env
GOOGLE_CREDENTIALS_JSON='{"type":"service_account",...}'
# Use helper script: python backend/scripts/convert_google_credentials.py

# Google Sheets - Option 2: Use file path
# GOOGLE_CREDENTIALS_FILE=/app/secrets/google_credentials.json

# CCC API
CCC_API_KEY=your_ccc_api_key

# idiCORE API
IDICORE_CLIENT_ID=your_idicore_client_id
IDICORE_CLIENT_SECRET=your_idicore_client_secret
```

**Generate SECRET_KEY:**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 3: Set Up Secrets Directory

```bash
# Create secrets directory
mkdir -p backend/secrets

# Copy Snowflake private key
cp ~/.snowflake/rsa_key.p8 backend/secrets/ 2>/dev/null || \
  echo "⚠ Copy your Snowflake key: cp /path/to/rsa_key.p8 backend/secrets/"

# Copy Google credentials (if using file-based method)
cp /path/to/google_credentials.json backend/secrets/ 2>/dev/null || \
  echo "⚠ Or set GOOGLE_CREDENTIALS_JSON in .env instead"

# Set proper permissions
chmod 600 backend/secrets/* 2>/dev/null || true
```

**Note:** If you're using `GOOGLE_CREDENTIALS_JSON` in `.env`, you don't need the file in `backend/secrets/`.

### Step 4: Deploy with Docker Compose

**Option A: Use Automated Script**
```bash
cd ~/new_app
chmod +x deploy-on-server.sh
bash deploy-on-server.sh
```

**Option B: Manual Deployment**
```bash
cd ~/new_app

# Stop any existing containers
docker compose -f docker-compose.prod.yml down

# Build images
docker compose -f docker-compose.prod.yml build --no-cache

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
sleep 15

# Run database migrations
docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head

# Create initial admin user
docker compose -f docker-compose.prod.yml exec -T backend python scripts/create_initial_user.py
```

### Step 5: Verify Deployment

```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs --tail=50

# Test health endpoints
curl http://localhost/health
curl http://localhost:8000/health
```

### Step 6: Access the Application

Open in your browser:
```
http://YOUR_EC2_IP
```

**Default Login Credentials:**
- Email: `admin@p1lending.com`
- Password: `admin123`
- ⚠️ **Change this immediately after first login!**

---

## Managing the Deployment

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f celery-worker
```

### Restart Services

```bash
# Restart all services
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend
```

### Stop the Application

```bash
docker compose -f docker-compose.prod.yml down
```

### Update the Application

```bash
cd ~/new_app

# Pull latest code (if using git)
git pull

# Rebuild and restart
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Run new migrations if any
docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head
```

### Access Container Shell

```bash
# Backend container
docker compose -f docker-compose.prod.yml exec backend bash

# Run Python scripts
docker compose -f docker-compose.prod.yml exec backend python scripts/create_initial_user.py
```

---

## Troubleshooting

### Port 80 Already in Use

```bash
# Check what's using port 80
sudo lsof -i :80
# OR
sudo netstat -tulpn | grep :80

# If it's your old app, you may need to:
# 1. Stop the old app temporarily
# 2. Or change the frontend port in docker-compose.prod.yml (e.g., 8080:80)
```

### Containers Won't Start

```bash
# Check logs for errors
docker compose -f docker-compose.prod.yml logs

# Check specific service
docker compose -f docker-compose.prod.yml logs backend

# Verify .env file is correct
cat .env | grep -v PASSWORD  # Show non-sensitive values
```

### Database Connection Errors

```bash
# Check if postgres container is healthy
docker compose -f docker-compose.prod.yml ps postgres

# Check postgres logs
docker compose -f docker-compose.prod.yml logs postgres

# Connect to database directly
docker compose -f docker-compose.prod.yml exec postgres psql -U p1lending -d p1lending_etl
```

### Google Credentials Not Found

The backend automatically searches for credentials in multiple locations:
- `/app/secrets/google_credentials.json` (Docker)
- `backend/secrets/google_credentials.json` (local)
- Or from `GOOGLE_CREDENTIALS_JSON` in `.env`

**Solution:**
```bash
# Option 1: Add to .env (recommended)
python backend/scripts/convert_google_credentials.py /path/to/google_credentials.json
# Copy the output to GOOGLE_CREDENTIALS_JSON in .env

# Option 2: Place file in secrets directory
cp /path/to/google_credentials.json backend/secrets/
```

### Migration Errors

```bash
# Check migration status
docker compose -f docker-compose.prod.yml exec backend alembic current

# View migration history
docker compose -f docker-compose.prod.yml exec backend alembic history

# Rollback if needed (be careful!)
docker compose -f docker-compose.prod.yml exec backend alembic downgrade -1
```

### Frontend Not Loading

```bash
# Check frontend logs
docker compose -f docker-compose.prod.yml logs frontend

# Rebuild frontend
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend

# Check if port 80 is accessible
curl http://localhost/health
```

---

## Security Checklist

Before going live, ensure:

- [ ] Changed default admin password
- [ ] Set strong `POSTGRES_PASSWORD` in `.env`
- [ ] Generated secure `SECRET_KEY`
- [ ] Secrets directory has restricted permissions (`chmod 600 backend/secrets/*`)
- [ ] EC2 security group only allows necessary ports (22, 80, optionally 8000)
- [ ] `.env` file is not committed to git (check `.gitignore`)
- [ ] Consider setting up HTTPS with Let's Encrypt
- [ ] Regular backups of PostgreSQL data volume

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         EC2 Instance                    │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │ Frontend │  │ Backend  │            │
│  │ :80      │  │ :8000    │            │
│  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐            │
│  │ Postgres │  │  Redis   │            │
│  │ :5433    │  │  :6380   │            │
│  └──────────┘  └──────────┘            │
│  ┌──────────┐                          │
│  │  Celery  │                          │
│  └──────────┘                          │
│                                         │
└─────────────────────────────────────────┘
```

**Ports:**
- `80`: Frontend (Nginx) - Main access point
- `8000`: Backend API (optional external access)
- `5433`: PostgreSQL (internal, mapped from 5432)
- `6380`: Redis (internal, mapped from 6379)

---

## Next Steps

1. **Set up domain name** (optional)
   - Point your domain to EC2 IP
   - Update `CORS_ORIGINS` in `.env` to include your domain

2. **Enable HTTPS** (recommended)
   - Use Let's Encrypt with Certbot
   - Update Nginx configuration

3. **Set up monitoring**
   - CloudWatch or similar
   - Set up alerts for container failures

4. **Backup strategy**
   - Regular PostgreSQL backups
   - Backup `.env` and secrets securely

---

## Support

For issues or questions:
- Check logs: `docker compose -f docker-compose.prod.yml logs`
- Review `DEPLOYMENT.md` for detailed architecture
- Check `README.md` for general information

