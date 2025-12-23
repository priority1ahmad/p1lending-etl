# Production Server Setup Guide

## Overview

This guide covers deploying to **etl.p1lending.io** (production) after staging validation.

**Prerequisites:**
- Staging environment tested and validated
- All features working on staging
- No critical bugs in staging

---

## Deployment Strategy

### Two-Phase Deployment:

**Phase 1: Staging Validation** (Current)
- Deploy new features to staging
- Test thoroughly
- Fix any issues

**Phase 2: Production Rollout** (After validation)
- Merge staging → main
- Deploy to production
- Monitor closely

---

## Production Server Specs

### Recommended (Same or better than staging):

| Component | Recommended |
|-----------|-------------|
| Instance Type | t3.xlarge or better |
| vCPUs | 4+ |
| RAM | 16 GB+ |
| Storage | 100 GB SSD (gp3) |
| OS | Ubuntu 22.04 LTS |

### Why more resources?
- Production will handle real workloads
- 20+ GB DNC database
- Concurrent ETL jobs
- Real-time websockets
- NTFY notifications

---

## Pre-Deployment Checklist

- [ ] All staging tests passed
- [ ] No critical bugs in staging
- [ ] Database backup strategy in place
- [ ] Rollback plan documented
- [ ] Downtime window communicated (if needed)
- [ ] Production environment variables configured
- [ ] SSL certificates ready
- [ ] DNS configured for etl.p1lending.io

---

## Step 1: Prepare Production Code

### Merge Staging to Main:

```bash
# On your local machine
cd ~/projects/LodasoftETL/new_app

# Ensure staging is up to date
git checkout staging
git pull origin staging

# Checkout main
git checkout main
git pull origin main

# Merge staging into main
git merge staging

# Push to remote
git push origin main
```

---

## Step 2: Production DNS Configuration

### In Cloudflare:

1. Navigate to: `p1lending.io`
2. DNS → Records
3. Add **A Record**:
   - **Type**: A
   - **Name**: `etl`
   - **IPv4 address**: `PRODUCTION_SERVER_IP`
   - **Proxy status**: DNS only (grey cloud)
   - **TTL**: Auto
4. Save

**Test:**
```bash
nslookup etl.p1lending.io
```

---

## Step 3: Production Server Setup

### SSH to Production:

```bash
ssh -i your-key.pem ubuntu@PRODUCTION_SERVER_IP
```

### Install Dependencies (if new server):

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Install Nginx
sudo apt install nginx -y

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y
```

---

## Step 4: Nginx Configuration

### Create Production Nginx Config:

```bash
sudo nano /etc/nginx/sites-available/etl-production
```

**Configuration:**

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name etl.p1lending.io;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name etl.p1lending.io;

    ssl_certificate /etc/letsencrypt/live/etl.p1lending.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/etl.p1lending.io/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:8000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:8000/health;
    }
}
```

### Enable Site:

```bash
sudo ln -s /etc/nginx/sites-available/etl-production /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Obtain SSL Certificate:

```bash
sudo certbot --nginx -d etl.p1lending.io
```

---

## Step 5: Deploy Production Application

### Clone Repository (Main Branch):

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git etl-production

cd etl-production
git checkout main
```

### Transfer Production Secrets:

```bash
# From your local machine
ssh -i your-key.pem ubuntu@PRODUCTION_IP "mkdir -p ~/etl-production/backend/secrets"

scp -i your-key.pem /path/to/rsa_key.p8 ubuntu@PRODUCTION_IP:~/etl-production/backend/secrets/
scp -i your-key.pem /path/to/google_credentials.json ubuntu@PRODUCTION_IP:~/etl-production/backend/secrets/
```

### Configure Production Environment:

```bash
cd ~/etl-production
cp .env.staging.example .env
nano .env
```

**Update for production:**
- Change `ENVIRONMENT=production`
- Use production-specific secrets
- Update `CORS_ORIGINS=["https://etl.p1lending.io"]`
- Change NTFY topics (remove "staging" prefix)

---

## Step 6: Production Deployment

### Run Deployment Script:

```bash
cd ~/etl-production
chmod +x deploy-staging.sh

# Or create production-specific script
./deploy-production.sh
```

**Manual deployment:**

```bash
# Build and start
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# Wait for services
sleep 20

# Run migrations
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Create admin user (if needed)
docker compose -f docker-compose.prod.yml exec backend python scripts/create_initial_user.py
```

---

## Step 7: Verify Production

### Health Checks:

```bash
curl https://etl.p1lending.io/health
curl https://etl.p1lending.io/api/v1/health
```

### Access Application:

Navigate to: **https://etl.p1lending.io**

### Monitor Logs:

```bash
docker compose -f docker-compose.prod.yml logs -f
```

---

## Step 8: Post-Deployment Validation

- [ ] Login works
- [ ] Dashboard loads
- [ ] SQL scripts can be managed
- [ ] ETL job can be started (small test)
- [ ] Results saved to Snowflake MASTER_PROCESSED_DB
- [ ] NTFY notifications working
- [ ] Login audit logs created
- [ ] WebSocket updates working

---

## Rollback Plan

If issues occur in production:

### Option 1: Rollback Code

```bash
cd ~/etl-production

# Stop services
docker compose -f docker-compose.prod.yml down

# Checkout previous stable commit
git log --oneline -10  # Find last stable commit
git checkout <commit-hash>

# Redeploy
docker compose -f docker-compose.prod.yml up -d --build
```

### Option 2: Database Rollback

```bash
# Restore from backup (if needed)
docker compose -f docker-compose.prod.yml exec -T db psql -U etl_user p1lending_etl_production < ~/backups/prod_db_TIMESTAMP.sql
```

### Option 3: Emergency Fallback

If critical failure, switch DNS back to old server temporarily.

---

## Monitoring

### Set Up Monitoring:

1. **NTFY Notifications**: Subscribe to topics on your phone
2. **Log Rotation**: Configure logrotate for Docker logs
3. **Health Checks**: Set up external monitoring (UptimeRobot, etc.)
4. **Database Backups**: Schedule daily backups via cron

### Backup Cron Job:

```bash
crontab -e
```

Add:
```cron
# Daily database backup at 2 AM
0 2 * * * cd ~/etl-production && docker compose -f docker-compose.prod.yml exec -T db pg_dump -U etl_user p1lending_etl_production > ~/backups/prod_db_$(date +\%Y\%m\%d).sql
```

---

## Maintenance

### Update Production:

```bash
cd ~/etl-production
git pull origin main
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### View Logs:

```bash
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml logs -f backend
```

### Restart Services:

```bash
docker compose -f docker-compose.prod.yml restart
```

---

## Support

For issues:
1. Check logs first
2. Review staging environment
3. Consult CLAUDE.md for project context
4. Contact development team

---

## Next Steps After Production Deployment

1. Monitor for 24-48 hours
2. Validate all ETL jobs working
3. Check Snowflake MASTER_PROCESSED_DB data
4. Verify NTFY notifications
5. Review login audit logs
6. Consider automated backups
7. Set up monitoring/alerting
