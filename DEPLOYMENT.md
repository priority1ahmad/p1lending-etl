# P1Lending ETL - EC2 Deployment Guide

This guide explains how to deploy the **new app** alongside your **existing old app** on the same EC2 instance.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         EC2 Instance                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐    ┌────────────────────────────────┐│
│  │     OLD APP          │    │         NEW APP (Docker)       ││
│  │  (Flask - existing)  │    │                                ││
│  │                      │    │  ┌──────────┐  ┌──────────┐   ││
│  │  Port: 5000          │    │  │ Frontend │  │ Backend  │   ││
│  │                      │    │  │ :8080    │  │ :8000    │   ││
│  │                      │    │  └──────────┘  └──────────┘   ││
│  │                      │    │  ┌──────────┐  ┌──────────┐   ││
│  │                      │    │  │ Postgres │  │  Redis   │   ││
│  │                      │    │  │ :5433    │  │  :6380   │   ││
│  │                      │    │  └──────────┘  └──────────┘   ││
│  │                      │    │  ┌──────────┐                 ││
│  │                      │    │  │  Celery  │                 ││
│  │                      │    │  └──────────┘                 ││
│  └──────────────────────┘    └────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Port Mapping

| Service         | Old App | New App | Notes                          |
|-----------------|---------|---------|--------------------------------|
| Frontend        | -       | 8080    | Access new app here            |
| Backend API     | 5000?   | 8000    | FastAPI                        |
| PostgreSQL      | 5432?   | 5433    | Separate database              |
| Redis           | 6379?   | 6380    | Separate instance              |

## Prerequisites

On your EC2 instance, ensure you have:

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y docker.io docker-compose-plugin

# Add your user to docker group (logout/login required)
sudo usermod -aG docker $USER

# Verify Docker works
docker --version
docker compose version
```

## Deployment Steps

### Step 1: Transfer Files to EC2

From your local machine (Windows):

```powershell
# Option A: Using SCP (if you have OpenSSH)
scp -r C:\Users\AhmadAllouch\Desktop\LodasoftETL\new_app ubuntu@YOUR_EC2_IP:~/

# Option B: Using Git (recommended)
# First, push to a git repo, then on EC2:
git clone YOUR_REPO_URL ~/new_app
```

### Step 2: Configure Environment

SSH into your EC2 instance:

```bash
ssh ubuntu@YOUR_EC2_IP
cd ~/new_app

# Create environment file from example
cp env.example .env

# Edit with your credentials
nano .env
```

**Important `.env` settings:**
- `POSTGRES_PASSWORD`: Set a strong password
- `SECRET_KEY`: Generate with `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`
- `SNOWFLAKE_PRIVATE_KEY_PASSWORD`: Your Snowflake key password
- API keys for CCC, idiCORE, etc.

### Step 3: Set Up Secrets

```bash
# Create secrets directory
mkdir -p ~/new_app/backend/secrets

# Copy Snowflake private key
cp ~/.snowflake/rsa_key.p8 ~/new_app/backend/secrets/

# Copy Google credentials (if not already in backend folder)
cp /path/to/google_credentials.json ~/new_app/backend/secrets/
```

### Step 4: Run Deployment Script

```bash
cd ~/new_app
chmod +x deploy.sh
./deploy.sh
```

The script will:
1. Check prerequisites
2. Verify configuration
3. Build Docker images
4. Start all containers
5. Run database migrations
6. Create initial admin user

### Step 5: Verify Deployment

```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Test endpoints
curl http://localhost:8000/health
curl http://localhost:8080/health
```

### Step 6: Access the New App

Open in your browser:
```
http://YOUR_EC2_IP:8080
```

**Default credentials:**
- Email: `admin@p1lending.com`
- Password: `admin123`
- ⚠️ **Change immediately after first login!**

## Managing the Deployment

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f celery-worker
```

### Restart Services

```bash
# Restart all
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend
```

### Stop the New App

```bash
docker compose -f docker-compose.prod.yml down
```

### Update the New App

```bash
cd ~/new_app
git pull  # if using git

# Rebuild and restart
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Run new migrations if any
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### Access Container Shell

```bash
# Backend container
docker compose -f docker-compose.prod.yml exec backend bash

# Run Python scripts
docker compose -f docker-compose.prod.yml exec backend python scripts/create_initial_user.py
```

## Security Checklist

- [ ] Changed default admin password
- [ ] Set strong `POSTGRES_PASSWORD` in `.env`
- [ ] Generated secure `SECRET_KEY`
- [ ] Secrets directory has restricted permissions (`chmod 600`)
- [ ] EC2 security group only allows necessary ports (8080, 22)
- [ ] Consider setting up HTTPS with Let's Encrypt

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs backend

# Check if ports are in use
sudo netstat -tulpn | grep -E '8000|8080|5433|6380'
```

### Database connection errors

```bash
# Check if postgres is healthy
docker compose -f docker-compose.prod.yml ps postgres

# Connect to database directly
docker compose -f docker-compose.prod.yml exec postgres psql -U p1lending -d p1lending_etl
```

### Migration errors

```bash
# Check migration status
docker compose -f docker-compose.prod.yml exec backend alembic current

# View migration history
docker compose -f docker-compose.prod.yml exec backend alembic history
```

### Old app stops working

The new app uses different ports and Docker networks, so it should not affect the old app. If issues occur:

1. Check old app's ports aren't conflicting
2. Verify old app's database isn't on port 5433
3. Check system resources (RAM, CPU)

## Switching to New App Permanently

Once you're confident the new app works:

1. Update DNS or load balancer to point to port 8080
2. Or set up Nginx reverse proxy (see `nginx-host.conf`)
3. Stop the old app
4. Optionally migrate data from old database

## Files Created for Deployment

```
new_app/
├── deploy.sh                 # Main deployment script
├── docker-compose.prod.yml   # Production Docker Compose
├── env.example               # Environment template
├── nginx-host.conf           # Optional Nginx config
├── DEPLOYMENT.md             # This file
├── backend/
│   ├── Dockerfile            # Backend container
│   ├── .dockerignore
│   └── secrets/              # Created during setup
│       ├── rsa_key.p8
│       └── google_credentials.json
└── frontend/
    ├── Dockerfile            # Frontend container
    ├── nginx.conf            # Frontend nginx config
    └── .dockerignore
```

