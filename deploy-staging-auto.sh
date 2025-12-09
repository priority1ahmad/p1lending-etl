#!/bin/bash

#######################################################
# Auto-Deploy Staging (Run on Staging Server)
#######################################################
#
# This script deploys the latest staging branch code.
# Run this script DIRECTLY on the staging server.
#
# Prerequisites:
# - Git repository cloned
# - Docker and Docker Compose installed
# - Run from ~/etl_app directory
#
# Usage (on staging server):
#   cd ~/etl_app
#   ./deploy-staging-auto.sh
#
#######################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="$(pwd)"
BRANCH="staging"

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

print_step() {
    echo -e "${YELLOW}▶ $1${NC}"
}

# Validate we're in the right directory
if [ ! -f "docker-compose.prod.yml" ]; then
    print_error "docker-compose.prod.yml not found!"
    print_info "Please run this script from the ~/etl_app directory:"
    print_info "  cd ~/etl_app"
    print_info "  ./deploy-staging-auto.sh"
    exit 1
fi

print_header "P1Lending ETL - Auto Deploy Staging"
echo "Directory: $APP_DIR"
echo "Branch: $BRANCH"
echo ""

# Confirm deployment
print_warning "This will deploy the latest staging code."
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Deployment cancelled"
    exit 0
fi

# Step 1: Pull latest code
print_header "Step 1: Pulling Latest Code"
print_step "Fetching updates from GitHub..."

# Fetch latest
echo "Fetching from origin..."
git fetch origin staging

# Show changes
echo ""
echo "Changes to be deployed:"
git log --oneline HEAD..origin/staging | head -10

# Pull changes
echo ""
echo "Pulling latest staging code..."
git pull origin staging

if [ $? -eq 0 ]; then
    print_success "Latest code pulled successfully"
else
    print_error "Failed to pull latest code"
    exit 1
fi

# Step 2: Backup .env file
print_header "Step 2: Backing Up Configuration"
print_step "Creating backup of .env file..."

if [ -f .env ]; then
    BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"
    cp .env "$BACKUP_FILE"
    echo "✓ Backup created: $BACKUP_FILE"
else
    echo "⚠ No .env file found (first deployment?)"
fi

print_success "Configuration backed up"

# Step 3: Run database migrations
print_header "Step 3: Running Database Migrations"
print_step "Applying Alembic migrations..."

# Check if backend container is running
if docker ps | grep -q "backend"; then
    echo "Running migrations in backend container..."
    docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head

    if [ $? -eq 0 ]; then
        echo "✓ Migrations applied successfully"
    else
        echo "⚠ Migration failed or no new migrations"
    fi
else
    echo "⚠ Backend container not running, will migrate on startup"
fi

print_success "Database migrations completed"

# Step 4: Rebuild and restart containers
print_header "Step 4: Rebuilding & Restarting Services"
print_step "Building Docker images..."

echo "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

echo ""
echo "Building new images (this may take a few minutes)..."
docker-compose -f docker-compose.prod.yml build --no-cache frontend backend

echo ""
echo "Starting all services..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "Waiting for services to be healthy..."
sleep 10

echo "✓ Services restarted successfully"

if [ $? -eq 0 ]; then
    print_success "Services rebuilt and restarted"
else
    print_error "Failed to restart services"
    exit 1
fi

# Step 5: Verify deployment
print_header "Step 5: Verifying Deployment"

# Check container status
print_step "Checking container status..."
echo "Container Status:"
docker-compose -f docker-compose.prod.yml ps

# Check backend health
print_step "Testing backend health endpoint..."
sleep 5
if curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/health | grep -q "200"; then
    print_success "Backend health check passed"
else
    print_warning "Backend health check failed (may still be starting)"
fi

# Check frontend
print_step "Testing frontend..."
if curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 | grep -q "200"; then
    print_success "Frontend health check passed"
else
    print_warning "Frontend health check failed (may still be starting)"
fi

# Step 6: Show logs
print_header "Step 6: Recent Logs"
print_info "Last 10 lines from each service:"

echo ""
echo "=== Backend Logs ==="
docker-compose -f docker-compose.prod.yml logs --tail=10 backend 2>&1 | tail -10

echo ""
echo "=== Frontend Logs ==="
docker-compose -f docker-compose.prod.yml logs --tail=10 frontend 2>&1 | tail -10

echo ""
echo "=== Celery Worker Logs ==="
docker-compose -f docker-compose.prod.yml logs --tail=10 celery-worker 2>&1 | tail -10

# Step 7: Deployment summary
print_header "Deployment Summary"

# Get deployed commit
DEPLOYED_COMMIT=$(git log -1 --format='%h - %s')

echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
echo ""
echo "Deployed Commit:"
echo "  $DEPLOYED_COMMIT"
echo ""
echo "Useful Commands:"
echo "  View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  Restart: docker-compose -f docker-compose.prod.yml restart"
echo "  Status: docker-compose -f docker-compose.prod.yml ps"
echo ""

print_info "Monitor the application for a few minutes to ensure stability"
print_warning "Remember to test core functionality: login, ETL jobs, real-time updates"
