# Domain Setup Guide: etl.p1lending.io

**Purpose**: Configure production deployment at etl.p1lending.io with HTTPS
**Prerequisites**: Domain registered, AWS EC2/server provisioned, DNS provider access

---

## Table of Contents

1. [DNS Configuration](#1-dns-configuration)
2. [Server Preparation](#2-server-preparation)
3. [Nginx Reverse Proxy Setup](#3-nginx-reverse-proxy-setup)
4. [SSL/TLS Certificate (Let's Encrypt)](#4-ssltls-certificate)
5. [Docker Configuration Updates](#5-docker-configuration-updates)
6. [Application Configuration](#6-application-configuration)
7. [Testing & Verification](#7-testing--verification)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. DNS Configuration

### Option A: Cloudflare (Recommended)

1. **Log in to Cloudflare Dashboard**
   - Navigate to p1lending.io domain

2. **Add A Record**
   ```
   Type: A
   Name: etl
   IPv4 address: YOUR_SERVER_PUBLIC_IP
   Proxy status: DNS only (gray cloud) initially
   TTL: Auto
   ```

3. **Wait for DNS Propagation** (1-5 minutes)
   ```bash
   # Verify DNS resolution
   nslookup etl.p1lending.io
   dig etl.p1lending.io
   ```

### Option B: Other DNS Providers

Follow similar steps to add an A record:
- **Hostname**: etl
- **Record Type**: A
- **Value**: YOUR_SERVER_PUBLIC_IP
- **TTL**: 300 (5 minutes)

---

## 2. Server Preparation

### Connect to Production Server

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@YOUR_SERVER_IP

# Update system packages
sudo apt update && sudo apt upgrade -y
```

### Install Required Software

```bash
# Install Docker (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose (if not already installed)
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

---

## 3. Nginx Reverse Proxy Setup

### Create Nginx Configuration File

```bash
sudo nano /etc/nginx/sites-available/etl.p1lending.io
```

**Configuration:**

```nginx
# HTTP server (will redirect to HTTPS after SSL setup)
server {
    listen 80;
    listen [::]:80;
    server_name etl.p1lending.io;

    # Increase upload size limits
    client_max_body_size 100M;

    # Frontend (React app)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts for long-running ETL jobs
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }

    # API Docs
    location /docs {
        proxy_pass http://localhost:8000/docs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # OpenAPI spec
    location /openapi.json {
        proxy_pass http://localhost:8000/openapi.json;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # WebSocket connections (Socket.io)
    location /socket.io/ {
        proxy_pass http://localhost:8000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:8000/health;
        access_log off;
    }
}
```

### Enable the Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/etl.p1lending.io /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 4. SSL/TLS Certificate

### Obtain Let's Encrypt Certificate

```bash
# Run Certbot
sudo certbot --nginx -d etl.p1lending.io

# Follow prompts:
# 1. Enter email address for renewal notifications
# 2. Agree to Terms of Service
# 3. Choose whether to redirect HTTP to HTTPS (select YES - option 2)
```

**Certbot will automatically**:
- Obtain SSL certificate
- Modify Nginx config to use HTTPS
- Set up HTTP → HTTPS redirect
- Configure auto-renewal

### Verify SSL Certificate

```bash
# Check certificate status
sudo certbot certificates

# Test auto-renewal
sudo certbot renew --dry-run
```

### After SSL Setup, Nginx Config Will Look Like:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name etl.p1lending.io;

    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name etl.p1lending.io;

    # SSL Certificate (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/etl.p1lending.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/etl.p1lending.io/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # ... rest of location blocks from above ...
}
```

---

## 5. Docker Configuration Updates

### Update docker-compose.prod.yml

No changes needed to docker-compose.prod.yml if using host nginx. Ports remain:
- Frontend: 3000
- Backend: 8000
- NTFY: 7777 (optional)

### If Using Cloudflare Proxy

Update docker-compose.prod.yml to trust Cloudflare IPs:

```yaml
backend:
  environment:
    - FORWARDED_ALLOW_IPS=*
    - TRUST_PROXY_HEADERS=true
```

---

## 6. Application Configuration

### Update Backend Environment Variables

Edit `.env` file on the server:

```bash
cd ~/etl_app  # or wherever your app is deployed
nano .env
```

**Add/Update:**

```bash
# Domain Configuration
DOMAIN=etl.p1lending.io
BACKEND_URL=https://etl.p1lending.io
FRONTEND_URL=https://etl.p1lending.io

# CORS Origins (IMPORTANT!)
BACKEND_CORS_ORIGINS=["https://etl.p1lending.io","http://localhost:3000"]

# Allowed Hosts
ALLOWED_HOSTS=["etl.p1lending.io","localhost"]

# Secure Cookies (for HTTPS)
SECURE_COOKIES=true
SESSION_COOKIE_SECURE=true
CSRF_COOKIE_SECURE=true
```

### Update Frontend Environment (if applicable)

If frontend has environment variables:

```bash
nano frontend/.env.production
```

```bash
VITE_API_URL=https://etl.p1lending.io/api
VITE_WS_URL=wss://etl.p1lending.io
```

### Restart Application

```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 7. Testing & Verification

### DNS Resolution

```bash
# Check DNS
nslookup etl.p1lending.io
dig etl.p1lending.io

# Expected output: A record pointing to your server IP
```

### HTTP → HTTPS Redirect

```bash
curl -I http://etl.p1lending.io
# Should return 301 redirect to https://
```

### HTTPS Access

```bash
curl -I https://etl.p1lending.io
# Should return 200 OK with security headers
```

### SSL Certificate

```bash
# Check SSL certificate details
openssl s_client -connect etl.p1lending.io:443 -servername etl.p1lending.io < /dev/null 2>/dev/null | openssl x509 -noout -dates
```

### Browser Testing

1. **Navigate to**: https://etl.p1lending.io
2. **Verify**:
   - ✅ Padlock icon in browser
   - ✅ Certificate is valid (Let's Encrypt)
   - ✅ Application loads correctly
   - ✅ Login functionality works
   - ✅ WebSocket connections work (real-time updates)

### API Testing

```bash
# Health check
curl https://etl.p1lending.io/health

# API docs
curl https://etl.p1lending.io/docs
```

---

## 8. Troubleshooting

### Issue: DNS Not Resolving

**Symptoms**: `nslookup etl.p1lending.io` fails

**Solutions**:
1. Verify A record is correct in DNS provider
2. Wait for DNS propagation (up to 24 hours, usually 5 minutes)
3. Flush local DNS cache:
   ```bash
   # Linux
   sudo systemd-resolve --flush-caches

   # macOS
   sudo dscacheutil -flushcache

   # Windows
   ipconfig /flushdns
   ```

---

### Issue: 502 Bad Gateway

**Symptoms**: Nginx shows 502 error

**Solutions**:
1. Check if Docker containers are running:
   ```bash
   docker ps
   ```
2. Check backend logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs backend
   ```
3. Verify ports are correct in Nginx config (3000, 8000)
4. Check firewall rules allow internal connections

---

### Issue: CORS Errors

**Symptoms**: Browser console shows CORS errors

**Solutions**:
1. Verify `BACKEND_CORS_ORIGINS` in `.env` includes https://etl.p1lending.io
2. Restart backend after changing environment variables
3. Check `X-Forwarded-Proto` header is set in Nginx config

---

### Issue: WebSocket Connection Fails

**Symptoms**: Real-time updates don't work

**Solutions**:
1. Verify `/socket.io/` location block in Nginx config
2. Check `proxy_set_header Upgrade` and `Connection "upgrade"` are set
3. Ensure WebSocket timeout is configured (not too short)
4. Check browser developer tools → Network → WS for connection errors

---

### Issue: SSL Certificate Not Renewing

**Symptoms**: Certificate expires

**Solutions**:
1. Test renewal:
   ```bash
   sudo certbot renew --dry-run
   ```
2. Check certbot timer:
   ```bash
   sudo systemctl status certbot.timer
   ```
3. Manual renewal:
   ```bash
   sudo certbot renew
   sudo systemctl reload nginx
   ```

---

### Issue: Application Slow or Timing Out

**Symptoms**: Pages load slowly or timeout

**Solutions**:
1. Increase Nginx timeouts in `/etc/nginx/sites-available/etl.p1lending.io`:
   ```nginx
   proxy_connect_timeout 600;
   proxy_send_timeout 600;
   proxy_read_timeout 600;
   ```
2. Check server resources (CPU, RAM):
   ```bash
   htop
   docker stats
   ```
3. Review application logs for performance issues

---

### Issue: NTFY Port 7777 Not Accessible

**Symptoms**: Cannot access NTFY web interface

**Solutions**:
1. Add separate server block in Nginx (if exposing publicly):
   ```nginx
   server {
       listen 80;
       server_name ntfy.p1lending.io;
       location / {
           proxy_pass http://localhost:7777;
       }
   }
   ```
2. Or use SSH tunnel for admin access:
   ```bash
   ssh -L 7777:localhost:7777 ubuntu@etl.p1lending.io
   # Then access http://localhost:7777
   ```

---

## Security Checklist

Before going live:

- [ ] SSL certificate is valid and auto-renewing
- [ ] HTTP redirects to HTTPS
- [ ] Security headers are set (HSTS, X-Frame-Options, etc.)
- [ ] CORS is properly configured (not allowing all origins)
- [ ] Firewall rules restrict access to necessary ports only
- [ ] SSH keys are used (password authentication disabled)
- [ ] Database passwords are strong and environment-specific
- [ ] API keys and secrets are in `.env` (not in code)
- [ ] Fail2ban or similar is configured to prevent brute force
- [ ] Server is updated with latest security patches
- [ ] Backups are configured and tested
- [ ] Monitoring/alerting is set up

---

## Maintenance

### SSL Certificate Renewal

Certbot auto-renews certificates. Verify:

```bash
sudo certbot renew --dry-run
```

### Nginx Configuration Updates

After modifying Nginx config:

```bash
sudo nginx -t           # Test configuration
sudo systemctl reload nginx  # Apply changes
```

### Application Updates

```bash
cd ~/etl_app
git pull origin staging
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Quick Reference

| Service | Port | Internal URL | External URL |
|---------|------|--------------|--------------|
| Frontend | 3000 | http://localhost:3000 | https://etl.p1lending.io |
| Backend API | 8000 | http://localhost:8000 | https://etl.p1lending.io/api |
| API Docs | 8000 | http://localhost:8000/docs | https://etl.p1lending.io/docs |
| WebSockets | 8000 | ws://localhost:8000/socket.io | wss://etl.p1lending.io/socket.io |
| NTFY (optional) | 7777 | http://localhost:7777 | (SSH tunnel only) |
| PostgreSQL | 5432 | localhost:5432 | (Internal only) |
| Redis | 6379 | localhost:6379 | (Internal only) |

---

## Next Steps After Setup

1. **Configure Cloudflare Proxy** (optional):
   - Enable orange cloud for DDoS protection
   - Configure firewall rules
   - Enable Page Rules for caching

2. **Set Up Monitoring**:
   - Application performance monitoring (APM)
   - Uptime monitoring (UptimeRobot, Pingdom)
   - Log aggregation (CloudWatch, Datadog)

3. **Configure Backups**:
   - Database backups (automated)
   - Application code backups (git)
   - Environment configuration backups

4. **Create Staging Environment**:
   - Use subdomain: staging.etl.p1lending.io
   - Separate database and resources

---

*Last Updated: December 8, 2024*
*Tested on: Ubuntu 22.04 LTS*
