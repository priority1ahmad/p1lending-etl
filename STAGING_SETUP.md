# Staging Server Setup Guide

## AWS EC2 Instance Specifications

### Recommended Specs (match or exceed production):

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Instance Type | t3.medium | t3.large or t3.xlarge |
| vCPUs | 2 | 4+ |
| RAM | 4 GB | 8 GB+ |
| Storage | 30 GB | 50 GB (SSD/gp3) |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### Storage Breakdown:
- OS & System: ~10 GB
- Docker Images: ~5 GB
- Application Code: ~1 GB
- Logs: ~2 GB
- DNC Database: ~20-25 GB (if mounted)
- Buffer: ~10 GB

**Total Recommended: 50 GB minimum**

---

## Step 1: Provision AWS EC2 Instance

### Via AWS Console:

1. **Launch Instance**:
   - AMI: Ubuntu Server 22.04 LTS
   - Instance Type: `t3.large` (2 vCPU, 8 GB RAM)
   - Storage: 50 GB gp3 SSD

2. **Configure Security Group**:
   - SSH (22): Your IP only
   - HTTP (80): 0.0.0.0/0
   - HTTPS (443): 0.0.0.0/0
   - Backend API (8000): 0.0.0.0/0
   - NTFY (7777): Your IP only (optional, for admin notifications)

3. **Create or Select Key Pair**:
   - Download `.pem` file
   - `chmod 400 your-key.pem`

4. **Launch and Note**:
   - Public IP address (e.g., `54.123.45.67`)
   - Instance ID

---

## Step 2: Initial Server Setup

SSH into your new staging server:

```bash
ssh -i your-key.pem ubuntu@STAGING_SERVER_IP
```

### Update System:

```bash
sudo apt update && sudo apt upgrade -y
```

### Install Docker:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Log out and back in for group changes
exit
# SSH back in
ssh -i your-key.pem ubuntu@STAGING_SERVER_IP
```

### Install Docker Compose:

```bash
sudo apt install docker-compose-plugin -y
```

### Verify Installations:

```bash
docker --version
docker compose version
```

---

## Step 3: Configure Cloudflare DNS

### In Cloudflare Dashboard:

1. Navigate to your domain: `p1lending.io`
2. Go to **DNS** → **Records**
3. Add **A Record**:
   - **Type**: A
   - **Name**: `staging.etl`
   - **IPv4 address**: `STAGING_SERVER_IP`
   - **Proxy status**: DNS only (grey cloud)
   - **TTL**: Auto
4. Click **Save**

**Wait 2-5 minutes for DNS propagation.**

**Test DNS:**
```bash
# From your local machine
nslookup staging.etl.p1lending.io
# Should return your staging server IP
```

---

## Step 4: Install Nginx and SSL

On the staging server:

### Install Nginx:

```bash
sudo apt install nginx -y
```

### Install Certbot (Let's Encrypt):

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Configure Nginx for Staging:

```bash
sudo nano /etc/nginx/sites-available/staging-etl
```

**Paste this configuration:**

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name staging.etl.p1lending.io;

    # Let's Encrypt challenge
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
    server_name staging.etl.p1lending.io;

    # SSL certificates (will be configured by certbot)
    ssl_certificate /etc/letsencrypt/live/staging.etl.p1lending.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging.etl.p1lending.io/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend (React app on port 80 in container)
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

    # Backend API (FastAPI on port 8000)
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

    # WebSocket (Socket.io)
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

### Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/staging-etl /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Obtain SSL Certificate:

```bash
sudo certbot --nginx -d staging.etl.p1lending.io
```

**Follow prompts:**
- Enter email: `ahmad@priority1lending.io`
- Agree to terms: Yes
- Share email: No (optional)
- Redirect HTTP to HTTPS: Yes (option 2)

**Test auto-renewal:**
```bash
sudo certbot renew --dry-run
```

---

## Step 5: Deploy Application Code

### Clone Repository (Staging Branch):

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git etl-staging
# OR if you already have it, clone and checkout staging:
git clone -b staging https://github.com/YOUR_USERNAME/YOUR_REPO.git etl-staging

cd etl-staging
git checkout staging
```

### Transfer Secrets:

You need to copy these files to the staging server:

**From your local machine:**

```bash
# Create secrets directory
ssh -i your-key.pem ubuntu@STAGING_SERVER_IP "mkdir -p ~/etl-staging/backend/secrets"

# Copy Snowflake key
scp -i your-key.pem /path/to/rsa_key.p8 ubuntu@STAGING_SERVER_IP:~/etl-staging/backend/secrets/

# Copy Google credentials
scp -i your-key.pem /path/to/google_credentials.json ubuntu@STAGING_SERVER_IP:~/etl-staging/backend/secrets/
```

### Create Environment File:

```bash
cd ~/etl-staging
cp env.example .env
nano .env
```

**Configure `.env` for staging** (see next section for details).

---

## Step 6: Environment Configuration (.env.staging)

See `.env.staging.example` in the repository for full configuration.

**Critical staging-specific settings:**

```bash
# Environment
ENVIRONMENT=staging

# Database
POSTGRES_PASSWORD=your_secure_staging_password

# JWT Secret (generate new one for staging)
SECRET_KEY=generate_new_secret_with_python_secrets_module

# CORS (staging domain)
CORS_ORIGINS=["https://staging.etl.p1lending.io"]

# NTFY Notifications (enabled for staging)
NTFY_ENABLED=true
NTFY_BASE_URL=http://ntfy:80

# Snowflake (same credentials as production)
SNOWFLAKE_ACCOUNT=your_account
SNOWFLAKE_USER=your_user
SNOWFLAKE_WAREHOUSE=your_warehouse
SNOWFLAKE_DATABASE=your_database
SNOWFLAKE_PRIVATE_KEY_PASSWORD=your_password

# Other API credentials (same as production)
CCC_API_KEY=your_ccc_key
IDICORE_CLIENT_ID=your_idicore_id
IDICORE_CLIENT_SECRET=your_idicore_secret
```

---

## Step 7: Deploy Staging Application

```bash
cd ~/etl-staging

# Build images
docker compose -f docker-compose.prod.yml build --no-cache

# Start services
docker compose -f docker-compose.prod.yml up -d

# Wait for database
sleep 15

# Run migrations
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Create admin user
docker compose -f docker-compose.prod.yml exec backend python scripts/create_initial_user.py
```

**Default login:**
- Email: `admin@p1lending.com`
- Password: `admin123`

---

## Step 8: Verify Deployment

### Check Services:

```bash
docker compose -f docker-compose.prod.yml ps
```

All services should show "Up" and "healthy".

### Check Logs:

```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Test Endpoints:

```bash
# Health check
curl https://staging.etl.p1lending.io/health

# API health
curl https://staging.etl.p1lending.io/api/v1/health
```

### Access in Browser:

Navigate to: **https://staging.etl.p1lending.io**

---

## Step 9: Configure DNC Database (Optional)

If you want staging to have access to the DNC database:

### Option A: Mount from Production (Read-Only)

**Not recommended** - requires network access between servers.

### Option B: Copy from Production

```bash
# On production server
cd /path/to/dnc/
tar -czf dnc_database.tar.gz dnc_database.db

# On staging server
scp ubuntu@PRODUCTION_IP:/path/to/dnc_database.tar.gz ~/
tar -xzf dnc_database.tar.gz
mv dnc_database.db ~/etl-staging/
```

Update `docker-compose.prod.yml` to mount the DNC database.

---

## Step 10: Testing Checklist

- [ ] Frontend loads at https://staging.etl.p1lending.io
- [ ] Login works with admin credentials
- [ ] Dashboard displays correctly
- [ ] NTFY notifications work (check port 7777)
- [ ] SQL scripts can be created/edited
- [ ] ETL jobs can be started (test with small dataset)
- [ ] Results are stored in Snowflake MASTER_PROCESSED_DB
- [ ] Login audit logs are created
- [ ] WebSocket real-time updates work

---

## Troubleshooting

### Services won't start:

```bash
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend
```

### Port conflicts:

```bash
sudo lsof -i :80
sudo lsof -i :8000
```

### SSL certificate issues:

```bash
sudo certbot certificates
sudo certbot renew --force-renewal -d staging.etl.p1lending.io
```

### Database migrations fail:

```bash
docker compose -f docker-compose.prod.yml exec backend alembic current
docker compose -f docker-compose.prod.yml exec backend alembic history
```

---

## Maintenance

### Update Staging:

```bash
cd ~/etl-staging
git pull origin staging
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### View Logs:

```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Restart Services:

```bash
docker compose -f docker-compose.prod.yml restart
```

---

## Next Steps

Once staging is validated:
1. Test all features thoroughly
2. Document any issues
3. Fix issues on staging branch
4. When ready, merge staging → main
5. Deploy to production from main branch
