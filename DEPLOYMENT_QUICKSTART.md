# Deployment Quick Start

## Current State

- **Main branch**: Stable production version (currently running on production)
- **Staging branch**: New features (NTFY, audit logs, Snowflake results)

---

## Quick Links

- **Full Staging Guide**: [STAGING_SETUP.md](./STAGING_SETUP.md)
- **Production Guide**: [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)
- **Project Context**: [CLAUDE.md](./CLAUDE.md)

---

## Staging Deployment (Do This First)

### 1. Provision AWS EC2 Instance

**Specs:** t3.large (2 vCPU, 8 GB RAM, 50 GB SSD)

**Security Groups:**
- SSH (22): Your IP
- HTTP (80): 0.0.0.0/0
- HTTPS (443): 0.0.0.0/0
- Backend (8000): 0.0.0.0/0
- NTFY (7777): Your IP (optional)

### 2. Configure DNS in Cloudflare

Add A Record:
- **Name**: `staging.etl`
- **IP**: Your staging server IP
- **Proxy**: DNS only (grey cloud)

### 3. SSH to Staging Server

```bash
ssh -i your-key.pem ubuntu@STAGING_SERVER_IP

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
exit

# SSH back in
ssh -i your-key.pem ubuntu@STAGING_SERVER_IP

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Install Nginx + Certbot
sudo apt install nginx certbot python3-certbot-nginx -y
```

### 4. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/staging-etl
```

Copy configuration from [STAGING_SETUP.md](./STAGING_SETUP.md#step-4-install-nginx-and-ssl)

```bash
sudo ln -s /etc/nginx/sites-available/staging-etl /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Get SSL Certificate

```bash
sudo certbot --nginx -d staging.etl.p1lending.io
```

### 6. Deploy Application

```bash
# Clone staging branch
git clone -b staging YOUR_REPO_URL ~/etl-staging
cd ~/etl-staging

# Copy secrets
mkdir -p backend/secrets
# (SCP your rsa_key.p8 and google_credentials.json here)

# Create .env
cp .env.staging.example .env
nano .env  # Update credentials

# Run deployment script
chmod +x deploy-staging.sh
./deploy-staging.sh
```

### 7. Verify

Visit: **https://staging.etl.p1lending.io**

Login: `admin@p1lending.com` / `admin123`

---

## Production Deployment (After Staging Validated)

### 1. Merge Staging to Main

```bash
# On your local machine
git checkout staging
git pull origin staging

git checkout main
git pull origin main

git merge staging
git push origin main
```

### 2. Follow Production Guide

See [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) for full instructions.

---

## Troubleshooting

### Services won't start

```bash
cd ~/etl-staging
docker compose -f docker-compose.prod.yml logs
```

### SSL issues

```bash
sudo certbot certificates
sudo certbot renew --force-renewal -d staging.etl.p1lending.io
```

### Database migration fails

```bash
docker compose -f docker-compose.prod.yml exec backend alembic current
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

---

## Key Features in Staging

### New Features (Not in Production Yet)

1. **Login Audit Logging**
   - Tracks all login attempts
   - Records IP, user agent, success/failure
   - View in database: `login_audit_logs` table

2. **NTFY Push Notifications**
   - Subscribe on phone: https://staging.etl.p1lending.io:7777
   - Topics:
     - `p1-staging-auth`: Login events
     - `p1-staging-jobs`: ETL job events
     - `p1-staging-errors`: Error alerts
     - `p1-staging-system`: System events

3. **Snowflake Results Service**
   - ETL results stored in `PROCESSED_DATA_DB.PUBLIC.MASTER_PROCESSED_DB`
   - View/export via "ETL Results" page
   - Replaces Google Sheets

4. **Enhanced UI**
   - New sidebar navigation
   - Results viewer page
   - Rescrub functionality

---

## Environment Variables

### Critical Staging Variables

```bash
# .env on staging server
ENVIRONMENT=staging
CORS_ORIGINS=["https://staging.etl.p1lending.io"]
NTFY_ENABLED=true
NTFY_TOPIC_AUTH=p1-staging-auth
NTFY_TOPIC_JOBS=p1-staging-jobs
NTFY_TOPIC_ERRORS=p1-staging-errors
```

See [.env.staging.example](./.env.staging.example) for full template.

---

## Useful Commands

### View Logs
```bash
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml logs -f backend
```

### Restart Services
```bash
docker compose -f docker-compose.prod.yml restart
```

### Update Staging
```bash
cd ~/etl-staging
git pull origin staging
./deploy-staging.sh
```

### Database Backup
```bash
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U etl_user p1lending_etl_staging > backup.sql
```

---

## Support

For detailed instructions, see:
- **Staging**: [STAGING_SETUP.md](./STAGING_SETUP.md)
- **Production**: [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)
- **Project Docs**: [CLAUDE.md](./CLAUDE.md)
