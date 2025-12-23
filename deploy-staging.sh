#!/bin/bash

# ============================================
# STAGING DEPLOYMENT SCRIPT
# ============================================
# Deploys the staging branch to staging server
# Run this on the staging server only

set -e  # Exit on error

echo "========================================"
echo "P1Lending ETL - Staging Deployment"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
APP_DIR=~/etl-staging
BRANCH=staging
COMPOSE_FILE=docker-compose.prod.yml

# ============================================
# Pre-flight Checks
# ============================================

echo -e "${YELLOW}Running pre-flight checks...${NC}"

# Check if we're in the right directory
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}Error: Application directory not found at $APP_DIR${NC}"
    echo "Please clone the repository first:"
    echo "  git clone -b staging YOUR_REPO_URL ~/etl-staging"
    exit 1
fi

cd $APP_DIR

# Check if we're on staging branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    echo -e "${YELLOW}Warning: Not on staging branch (currently on: $CURRENT_BRANCH)${NC}"
    read -p "Switch to staging branch? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout $BRANCH
    else
        echo -e "${RED}Deployment cancelled.${NC}"
        exit 1
    fi
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please create .env from .env.staging.example:"
    echo "  cp .env.staging.example .env"
    echo "  nano .env  # Update with your credentials"
    exit 1
fi

# Check if secrets exist
if [ ! -f "backend/secrets/rsa_key.p8" ]; then
    echo -e "${RED}Error: Snowflake key not found at backend/secrets/rsa_key.p8${NC}"
    exit 1
fi

if [ ! -f "backend/secrets/google_credentials.json" ]; then
    echo -e "${YELLOW}Warning: Google credentials not found at backend/secrets/google_credentials.json${NC}"
    echo "This is optional if using Snowflake results service only."
fi

echo -e "${GREEN}✓ Pre-flight checks passed${NC}"
echo ""

# ============================================
# Pull Latest Code
# ============================================

echo -e "${YELLOW}Pulling latest code from staging branch...${NC}"
git fetch origin
git pull origin $BRANCH

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Git pull failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Code updated${NC}"
echo ""

# ============================================
# Backup Database (Optional)
# ============================================

read -p "Create database backup before deploying? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Creating database backup...${NC}"
    BACKUP_DIR=~/etl-backups
    mkdir -p $BACKUP_DIR
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)

    docker compose -f $COMPOSE_FILE exec -T db pg_dump -U etl_user p1lending_etl_staging > "$BACKUP_DIR/staging_db_$TIMESTAMP.sql"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Backup created at $BACKUP_DIR/staging_db_$TIMESTAMP.sql${NC}"
    else
        echo -e "${YELLOW}Warning: Backup failed, but continuing...${NC}"
    fi
    echo ""
fi

# ============================================
# Stop Services
# ============================================

echo -e "${YELLOW}Stopping services...${NC}"
docker compose -f $COMPOSE_FILE down

echo -e "${GREEN}✓ Services stopped${NC}"
echo ""

# ============================================
# Build Images
# ============================================

echo -e "${YELLOW}Building Docker images...${NC}"
echo "This may take several minutes..."

docker compose -f $COMPOSE_FILE build --no-cache

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Docker build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Images built${NC}"
echo ""

# ============================================
# Start Services
# ============================================

echo -e "${YELLOW}Starting services...${NC}"
docker compose -f $COMPOSE_FILE up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to start services${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Services started${NC}"
echo ""

# ============================================
# Wait for Services
# ============================================

echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
sleep 20

# Check service health
UNHEALTHY=$(docker compose -f $COMPOSE_FILE ps | grep -E "(unhealthy|starting)" | wc -l)
if [ $UNHEALTHY -gt 0 ]; then
    echo -e "${YELLOW}Warning: Some services are not healthy yet${NC}"
    docker compose -f $COMPOSE_FILE ps
    echo ""
    echo "Waiting 30 more seconds..."
    sleep 30
fi

echo -e "${GREEN}✓ Services ready${NC}"
echo ""

# ============================================
# Run Database Migrations
# ============================================

echo -e "${YELLOW}Running database migrations...${NC}"
docker compose -f $COMPOSE_FILE exec -T backend alembic upgrade head

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Database migrations failed${NC}"
    echo "Check logs with: docker compose -f $COMPOSE_FILE logs backend"
    exit 1
fi

echo -e "${GREEN}✓ Migrations applied${NC}"
echo ""

# ============================================
# Create/Update Admin User (Optional)
# ============================================

read -p "Create/reset admin user? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Creating admin user...${NC}"
    docker compose -f $COMPOSE_FILE exec -T backend python scripts/create_initial_user.py
    echo -e "${GREEN}✓ Admin user created${NC}"
    echo ""
    echo "Default credentials:"
    echo "  Email: admin@p1lending.com"
    echo "  Password: admin123"
    echo ""
fi

# ============================================
# Verify Deployment
# ============================================

echo -e "${YELLOW}Verifying deployment...${NC}"
echo ""

# Check service status
echo "Service Status:"
docker compose -f $COMPOSE_FILE ps

echo ""

# Test health endpoints
echo "Testing health endpoints..."

HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)
if [ "$HEALTH_CHECK" == "200" ]; then
    echo -e "${GREEN}✓ Backend health check passed${NC}"
else
    echo -e "${RED}✗ Backend health check failed (HTTP $HEALTH_CHECK)${NC}"
fi

FRONTEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80)
if [ "$FRONTEND_CHECK" == "200" ]; then
    echo -e "${GREEN}✓ Frontend health check passed${NC}"
else
    echo -e "${RED}✗ Frontend health check failed (HTTP $FRONTEND_CHECK)${NC}"
fi

echo ""

# ============================================
# Summary
# ============================================

echo "========================================"
echo -e "${GREEN}DEPLOYMENT COMPLETE!${NC}"
echo "========================================"
echo ""
echo "Staging URL: https://staging.etl.p1lending.io"
echo ""
echo "Useful commands:"
echo "  View logs:        docker compose -f $COMPOSE_FILE logs -f"
echo "  Restart services: docker compose -f $COMPOSE_FILE restart"
echo "  Stop services:    docker compose -f $COMPOSE_FILE down"
echo "  Check status:     docker compose -f $COMPOSE_FILE ps"
echo ""
echo "To view specific service logs:"
echo "  docker compose -f $COMPOSE_FILE logs -f backend"
echo "  docker compose -f $COMPOSE_FILE logs -f frontend"
echo "  docker compose -f $COMPOSE_FILE logs -f celery-worker"
echo ""

# ============================================
# Post-Deployment Checks
# ============================================

echo "Recommended post-deployment checks:"
echo "  1. Test login at https://staging.etl.p1lending.io"
echo "  2. Verify NTFY notifications (port 7777)"
echo "  3. Test ETL job with small dataset"
echo "  4. Check Snowflake MASTER_PROCESSED_DB table"
echo "  5. Verify login audit logs in database"
echo ""

# Ask if user wants to view logs
read -p "View live logs now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker compose -f $COMPOSE_FILE logs -f
fi
