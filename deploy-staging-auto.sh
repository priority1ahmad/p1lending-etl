#!/bin/bash

#######################################################
# Auto-Deploy to Staging Server
#######################################################
#
# This script automatically deploys the latest staging
# branch code to the staging server.
#
# Prerequisites:
# - SSH access to staging server
# - Git repository cloned on staging server
# - Docker and Docker Compose installed
#
# Usage:
#   ./deploy-staging-auto.sh [SERVER_IP] [SSH_KEY]
#
# Examples:
#   ./deploy-staging-auto.sh 13.218.65.240 ~/.ssh/staging_key.pem
#   ./deploy-staging-auto.sh staging.etl.p1lending.io ~/.ssh/id_rsa
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
STAGING_SERVER="${1:-13.218.65.240}"
SSH_KEY="${2:-~/.ssh/staging_key.pem}"
SSH_USER="ubuntu"
REMOTE_APP_DIR="~/etl_app"
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

# Validate inputs
if [ -z "$STAGING_SERVER" ]; then
    print_error "Staging server IP/hostname is required"
    echo "Usage: $0 <server-ip> [ssh-key-path]"
    exit 1
fi

# Expand tilde in SSH key path
SSH_KEY="${SSH_KEY/#\~/$HOME}"

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    print_error "SSH key not found: $SSH_KEY"
    echo "Please provide a valid SSH key path"
    exit 1
fi

print_header "P1Lending ETL - Auto Deploy to Staging"
echo "Server: $STAGING_SERVER"
echo "SSH Key: $SSH_KEY"
echo "Branch: $BRANCH"
echo "Remote Dir: $REMOTE_APP_DIR"
echo ""

# Confirm deployment
print_warning "This will deploy the latest staging code to the server."
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Deployment cancelled"
    exit 0
fi

# Step 1: Test SSH connection
print_header "Step 1: Testing SSH Connection"
print_step "Connecting to $SSH_USER@$STAGING_SERVER..."

if ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$STAGING_SERVER" "echo 'SSH connection successful'" > /dev/null 2>&1; then
    print_success "SSH connection verified"
else
    print_error "Cannot connect to staging server"
    print_info "Please check:"
    print_info "  - Server is running and accessible"
    print_info "  - SSH key has correct permissions (chmod 400)"
    print_info "  - Firewall allows SSH (port 22)"
    exit 1
fi

# Step 2: Check if app directory exists
print_header "Step 2: Verifying Application Directory"
print_step "Checking if $REMOTE_APP_DIR exists..."

if ssh -i "$SSH_KEY" "$SSH_USER@$STAGING_SERVER" "[ -d $REMOTE_APP_DIR ]"; then
    print_success "Application directory exists"
else
    print_error "Application directory not found: $REMOTE_APP_DIR"
    print_info "Please clone the repository first:"
    print_info "  ssh -i $SSH_KEY $SSH_USER@$STAGING_SERVER"
    print_info "  git clone -b staging https://github.com/priority1ahmad/p1lending-etl.git ~/etl_app"
    exit 1
fi

# Step 3: Pull latest code
print_header "Step 3: Pulling Latest Code"
print_step "Fetching updates from GitHub..."

ssh -i "$SSH_KEY" "$SSH_USER@$STAGING_SERVER" bash << 'ENDSSH'
set -e
cd ~/etl_app

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

echo "✓ Code updated successfully"
ENDSSH

if [ $? -eq 0 ]; then
    print_success "Latest code pulled successfully"
else
    print_error "Failed to pull latest code"
    exit 1
fi

# Step 4: Backup .env file
print_header "Step 4: Backing Up Configuration"
print_step "Creating backup of .env file..."

ssh -i "$SSH_KEY" "$SSH_USER@$STAGING_SERVER" bash << 'ENDSSH'
set -e
cd ~/etl_app

if [ -f .env ]; then
    BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"
    cp .env "$BACKUP_FILE"
    echo "✓ Backup created: $BACKUP_FILE"
else
    echo "⚠ No .env file found (first deployment?)"
fi
ENDSSH

print_success "Configuration backed up"

# Step 5: Run database migrations
print_header "Step 5: Running Database Migrations"
print_step "Applying Alembic migrations..."

ssh -i "$SSH_KEY" "$SSH_USER@$STAGING_SERVER" bash << 'ENDSSH'
set -e
cd ~/etl_app

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
ENDSSH

print_success "Database migrations completed"

# Step 6: Rebuild and restart containers
print_header "Step 6: Rebuilding & Restarting Services"
print_step "Building Docker images..."

ssh -i "$SSH_KEY" "$SSH_USER@$STAGING_SERVER" bash << 'ENDSSH'
set -e
cd ~/etl_app

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
ENDSSH

if [ $? -eq 0 ]; then
    print_success "Services rebuilt and restarted"
else
    print_error "Failed to restart services"
    exit 1
fi

# Step 7: Verify deployment
print_header "Step 7: Verifying Deployment"

# Check container status
print_step "Checking container status..."
ssh -i "$SSH_KEY" "$SSH_USER@$STAGING_SERVER" bash << 'ENDSSH'
cd ~/etl_app
echo "Container Status:"
docker-compose -f docker-compose.prod.yml ps
ENDSSH

# Check backend health
print_step "Testing backend health endpoint..."
sleep 5
if ssh -i "$SSH_KEY" "$SSH_USER@$STAGING_SERVER" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/health" | grep -q "200"; then
    print_success "Backend health check passed"
else
    print_warning "Backend health check failed (may still be starting)"
fi

# Check frontend
print_step "Testing frontend..."
if ssh -i "$SSH_KEY" "$SSH_USER@$STAGING_SERVER" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000" | grep -q "200"; then
    print_success "Frontend health check passed"
else
    print_warning "Frontend health check failed (may still be starting)"
fi

# Step 8: Show logs
print_header "Step 8: Recent Logs"
print_info "Last 20 lines from each service:"

ssh -i "$SSH_KEY" "$SSH_USER@$STAGING_SERVER" bash << 'ENDSSH'
cd ~/etl_app
echo ""
echo "=== Backend Logs ==="
docker-compose -f docker-compose.prod.yml logs --tail=10 backend 2>&1 | tail -10

echo ""
echo "=== Frontend Logs ==="
docker-compose -f docker-compose.prod.yml logs --tail=10 frontend 2>&1 | tail -10

echo ""
echo "=== Celery Worker Logs ==="
docker-compose -f docker-compose.prod.yml logs --tail=10 celery-worker 2>&1 | tail -10
ENDSSH

# Step 9: Deployment summary
print_header "Deployment Summary"

# Get deployed commit
DEPLOYED_COMMIT=$(ssh -i "$SSH_KEY" "$SSH_USER@$STAGING_SERVER" "cd ~/etl_app && git log -1 --format='%h - %s'")

echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
echo ""
echo "Deployed Commit:"
echo "  $DEPLOYED_COMMIT"
echo ""
echo "Access URLs:"
echo "  Frontend: http://$STAGING_SERVER:3000"
echo "  Backend API: http://$STAGING_SERVER:8000"
echo "  API Docs: http://$STAGING_SERVER:8000/docs"
echo "  Health: http://$STAGING_SERVER:8000/health"
echo ""
echo "Useful Commands:"
echo "  View logs: ssh -i $SSH_KEY $SSH_USER@$STAGING_SERVER 'cd ~/etl_app && docker-compose -f docker-compose.prod.yml logs -f'"
echo "  Restart: ssh -i $SSH_KEY $SSH_USER@$STAGING_SERVER 'cd ~/etl_app && docker-compose -f docker-compose.prod.yml restart'"
echo "  Status: ssh -i $SSH_KEY $SSH_USER@$STAGING_SERVER 'cd ~/etl_app && docker-compose -f docker-compose.prod.yml ps'"
echo ""

print_info "Monitor the application for a few minutes to ensure stability"
print_warning "Remember to test core functionality: login, ETL jobs, real-time updates"

# Optional: Open in browser
if command -v xdg-open > /dev/null 2>&1; then
    read -p "Open frontend in browser? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open "http://$STAGING_SERVER:3000"
    fi
fi
