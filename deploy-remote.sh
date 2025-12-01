#!/bin/bash
# Quick deployment script to run on EC2 server
# This assumes the code is already on the server

set -e

echo "=============================================="
echo "  P1Lending ETL - Quick Deployment"
echo "=============================================="

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found!"
    echo "Please create .env from env.example first:"
    echo "  cp env.example .env"
    echo "  nano .env"
    exit 1
fi

# Check secrets
if [ ! -f "backend/secrets/rsa_key.p8" ]; then
    echo "WARNING: Snowflake key not found at backend/secrets/rsa_key.p8"
fi

if [ ! -f "backend/secrets/google_credentials.json" ]; then
    echo "WARNING: Google credentials not found at backend/secrets/google_credentials.json"
fi

# Stop existing containers
echo "Stopping existing containers..."
docker compose -f docker-compose.prod.yml down || true

# Build and start
echo "Building and starting containers..."
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# Wait for services
echo "Waiting for services to start..."
sleep 15

# Run migrations
echo "Running database migrations..."
docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head || true

# Create admin user
echo "Creating admin user..."
docker compose -f docker-compose.prod.yml exec -T backend python scripts/create_initial_user.py || true

# Migrate SQL scripts as templates
echo "Migrating SQL scripts to database..."
docker compose -f docker-compose.prod.yml exec -T backend python scripts/migrate_sql_scripts.py || true

# Show status
echo ""
echo "=============================================="
echo "  Deployment Complete!"
echo "=============================================="
echo ""
docker compose -f docker-compose.prod.yml ps
echo ""
echo "Access the app at: http://$(hostname -I | awk '{print $1}')"
echo "Default login: admin@p1lending.com / admin123"

