#!/bin/bash
# Complete deployment script for EC2 server
# Run this on your EC2 server: bash deploy-on-server.sh

set -e

echo "=============================================="
echo "  P1Lending ETL - Complete Deployment"
echo "=============================================="

# Get EC2 IP for CORS
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || hostname -I | awk '{print $1}')

echo "Detected IP: $EC2_IP"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Step 1: Check prerequisites
echo "[1/8] Checking prerequisites..."
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker not installed. Install with:"
    echo "  sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin"
    exit 1
fi

if ! docker ps &> /dev/null; then
    echo "ERROR: Docker requires sudo or user not in docker group"
    echo "Run: sudo usermod -aG docker \$USER && newgrp docker"
    exit 1
fi
echo "✓ Docker OK"

# Step 2: Create .env if it doesn't exist
echo ""
echo "[2/8] Setting up environment..."
if [ ! -f ".env" ]; then
    echo "Creating .env from env.example..."
    cp env.example .env
    
    # Generate SECRET_KEY
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))" 2>/dev/null || openssl rand -base64 32)
    sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
    
    # Set VITE_API_URL to empty for production
    sed -i "s/^VITE_API_URL=.*/VITE_API_URL=/" .env
    
    # Update CORS_ORIGINS with actual IP
    sed -i "s|http://your-ec2-ip|http://$EC2_IP|g" .env
    
    echo "✓ .env created"
    echo "⚠ IMPORTANT: Edit .env and add your secrets:"
    echo "   - POSTGRES_PASSWORD"
    echo "   - SNOWFLAKE_PRIVATE_KEY_PASSWORD"
    echo "   - CCC_API_KEY"
    echo "   - IDICORE_CLIENT_ID and IDICORE_CLIENT_SECRET"
    echo ""
    read -p "Press Enter after editing .env, or Ctrl+C to abort..."
else
    echo "✓ .env exists"
    # Ensure VITE_API_URL is empty
    if grep -q "^VITE_API_URL=http" .env; then
        sed -i "s/^VITE_API_URL=.*/VITE_API_URL=/" .env
        echo "✓ Updated VITE_API_URL to empty for production"
    fi
fi

# Step 3: Set up secrets directory
echo ""
echo "[3/8] Setting up secrets..."
mkdir -p backend/secrets

if [ ! -f "backend/secrets/rsa_key.p8" ]; then
    # Try to find Snowflake key
    if [ -f ~/.snowflake/rsa_key.p8 ]; then
        cp ~/.snowflake/rsa_key.p8 backend/secrets/
        echo "✓ Copied Snowflake key"
    elif [ -f backend/rsa_key.p8 ]; then
        cp backend/rsa_key.p8 backend/secrets/
        echo "✓ Copied Snowflake key from backend/"
    else
        echo "⚠ WARNING: Snowflake key not found at backend/secrets/rsa_key.p8"
        echo "   Copy it manually: cp /path/to/rsa_key.p8 backend/secrets/"
    fi
else
    echo "✓ Snowflake key exists"
fi

if [ ! -f "backend/secrets/google_credentials.json" ]; then
    if [ -f backend/google_credentials.json ]; then
        cp backend/google_credentials.json backend/secrets/
        echo "✓ Copied Google credentials"
    else
        echo "⚠ WARNING: Google credentials not found"
        echo "   Copy it manually: cp /path/to/google_credentials.json backend/secrets/"
    fi
else
    echo "✓ Google credentials exist"
fi

# Step 4: Check port 80
echo ""
echo "[4/8] Checking port 80..."
if sudo lsof -i :80 &>/dev/null || sudo netstat -tuln 2>/dev/null | grep -q ":80 "; then
    echo "⚠ WARNING: Port 80 is in use"
    echo "   Current usage:"
    sudo lsof -i :80 2>/dev/null || sudo netstat -tuln | grep ":80 " || true
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✓ Port 80 is available"
fi

# Step 5: Stop existing containers
echo ""
echo "[5/8] Stopping existing containers..."
docker compose -f docker-compose.prod.yml down 2>/dev/null || true
echo "✓ Stopped"

# Step 6: Build images
echo ""
echo "[6/8] Building Docker images..."
echo "This may take several minutes..."
docker compose -f docker-compose.prod.yml build --no-cache
echo "✓ Build complete"

# Step 7: Start services
echo ""
echo "[7/8] Starting services..."
docker compose -f docker-compose.prod.yml up -d
echo "✓ Services started"

# Step 8: Run migrations and setup
echo ""
echo "[8/8] Running migrations and setup..."
echo "Waiting for database to be ready..."
sleep 15

echo "Running migrations..."
docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head || echo "⚠ Migration warning (may be OK if already up to date)"

echo "Creating admin user..."
docker compose -f docker-compose.prod.yml exec -T backend python scripts/create_initial_user.py || echo "⚠ Admin user creation warning (may already exist)"

echo "Migrating SQL scripts to database..."
docker compose -f docker-compose.prod.yml exec -T backend python scripts/migrate_sql_scripts.py || echo "⚠ SQL script migration warning (may already exist)"

# Final status
echo ""
echo "=============================================="
echo "  Deployment Complete!"
echo "=============================================="
echo ""
echo "Container status:"
docker compose -f docker-compose.prod.yml ps
echo ""
echo "Access the app at:"
echo "  http://$EC2_IP"
echo ""
echo "Default login credentials:"
echo "  Email: admin@p1lending.com"
echo "  Password: admin123"
echo "  ⚠ Change this immediately after first login!"
echo ""
echo "Useful commands:"
echo "  View logs:    docker compose -f docker-compose.prod.yml logs -f"
echo "  Stop app:     docker compose -f docker-compose.prod.yml down"
echo "  Restart:      docker compose -f docker-compose.prod.yml restart"
echo ""

