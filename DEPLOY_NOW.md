# Quick Deployment Commands for EC2

Run these commands on your EC2 server (ubuntu@ip-172-31-17-102):

## Step 1: Navigate to app directory (or clone/transfer code first)

```bash
cd ~/new_app
# OR if code needs to be transferred, use:
# git clone <your-repo> ~/new_app
# OR use SCP from your local machine
```

## Step 2: Ensure you have the latest code with fixes

The code should include the API URL fixes. If transferring fresh:
- Make sure `frontend/src/utils/api.ts` uses relative URLs
- Make sure `docker-compose.prod.yml` uses port 80

## Step 3: Create/Update .env file

```bash
# If .env doesn't exist, create it
cp env.example .env

# Edit .env - IMPORTANT: Set VITE_API_URL to empty for production
nano .env
```

In .env, ensure:
- `VITE_API_URL=` (empty, for relative URLs)
- `CORS_ORIGINS=["http://localhost:3000","http://YOUR_EC2_IP","http://YOUR_EC2_IP:80"]`
- All other secrets are configured

## Step 4: Set up secrets directory

```bash
mkdir -p backend/secrets

# Copy Snowflake key (adjust path as needed)
cp ~/.snowflake/rsa_key.p8 backend/secrets/ 2>/dev/null || echo "Snowflake key not found - add manually"

# Copy Google credentials (adjust path as needed)  
cp backend/google_credentials.json backend/secrets/ 2>/dev/null || echo "Google credentials not found - add manually"
```

## Step 5: Stop any existing containers

```bash
docker compose -f docker-compose.prod.yml down
```

## Step 6: Build and deploy

```bash
# Build with no cache to ensure fresh build
docker compose -f docker-compose.prod.yml build --no-cache

# Start all services
docker compose -f docker-compose.prod.yml up -d
```

## Step 7: Wait for services and run migrations

```bash
# Wait for database to be ready
sleep 15

# Run migrations
docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head

# Create admin user
docker compose -f docker-compose.prod.yml exec -T backend python scripts/create_initial_user.py
```

## Step 8: Verify deployment

```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs --tail=50

# Test health endpoints
curl http://localhost/health
curl http://localhost:8000/health
```

## Step 9: Access the app

Open in browser:
```
http://YOUR_EC2_IP
```

Default login:
- Email: `admin@p1lending.com`
- Password: `admin123`

## Troubleshooting

If port 80 is in use:
```bash
# Check what's using port 80
sudo lsof -i :80
# OR
sudo netstat -tulpn | grep :80

# If needed, stop the service using port 80
# (be careful - this might be your old app or nginx)
```

If containers fail to start:
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check specific service
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend
```

If styling is still wrong:
```bash
# Rebuild frontend with no cache
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

