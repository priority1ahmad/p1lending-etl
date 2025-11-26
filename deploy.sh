#!/bin/bash
# =============================================================================
# P1Lending ETL - EC2 Deployment Script
# =============================================================================
# This script deploys the new app alongside an existing old app on EC2.
#
# Prerequisites:
#   - Docker and Docker Compose installed on EC2
#   - Git installed
#   - SSH access to EC2 instance
#
# Usage:
#   1. Copy this entire new_app folder to EC2
#   2. SSH into EC2 and run: ./deploy.sh
#
# Ports Used (to avoid conflicts with old app):
#   - 8080: Frontend (access new app here)
#   - 8000: Backend API
#   - 5433: PostgreSQL
#   - 6380: Redis
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "=============================================="
echo "  P1Lending ETL - New App Deployment"
echo "=============================================="
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}Warning: Running as root. Consider using a non-root user.${NC}"
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BLUE}Working directory: $SCRIPT_DIR${NC}"

# =============================================================================
# Step 1: Check prerequisites
# =============================================================================
echo -e "\n${BLUE}[1/7] Checking prerequisites...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed.${NC}"
    echo "Install Docker with: sudo apt-get update && sudo apt-get install -y docker.io"
    exit 1
fi
echo -e "${GREEN}✓ Docker is installed${NC}"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed.${NC}"
    echo "Install with: sudo apt-get install -y docker-compose-plugin"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose is installed${NC}"

# Check if user can run Docker without sudo
if ! docker ps &> /dev/null; then
    echo -e "${YELLOW}Warning: Docker requires sudo. Adding user to docker group...${NC}"
    echo "Run: sudo usermod -aG docker \$USER && newgrp docker"
    echo "Then re-run this script."
    exit 1
fi
echo -e "${GREEN}✓ Docker permissions OK${NC}"

# =============================================================================
# Step 2: Check environment configuration
# =============================================================================
echo -e "\n${BLUE}[2/7] Checking environment configuration...${NC}"

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}No .env file found. Creating from .env.example...${NC}"
        cp .env.example .env
        echo -e "${YELLOW}⚠ IMPORTANT: Edit .env file with your actual credentials before continuing!${NC}"
        echo -e "${YELLOW}  Run: nano .env${NC}"
        echo ""
        read -p "Press Enter after you've configured .env, or Ctrl+C to abort..."
    else
        echo -e "${RED}Error: No .env or .env.example file found.${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓ Environment file exists${NC}"

# =============================================================================
# Step 3: Set up secrets directory
# =============================================================================
echo -e "\n${BLUE}[3/7] Setting up secrets directory...${NC}"

SECRETS_DIR="$SCRIPT_DIR/backend/secrets"
mkdir -p "$SECRETS_DIR"

# Check for Snowflake key
if [ ! -f "$SECRETS_DIR/rsa_key.p8" ]; then
    echo -e "${YELLOW}⚠ Snowflake private key not found at: $SECRETS_DIR/rsa_key.p8${NC}"
    echo "Copy your Snowflake private key:"
    echo "  cp ~/.snowflake/rsa_key.p8 $SECRETS_DIR/"
    echo ""
    read -p "Press Enter after copying, or Ctrl+C to abort..."
fi

# Check for Google credentials
if [ ! -f "$SECRETS_DIR/google_credentials.json" ]; then
    echo -e "${YELLOW}⚠ Google credentials not found at: $SECRETS_DIR/google_credentials.json${NC}"
    
    # Check if it exists in old location
    if [ -f "$SCRIPT_DIR/backend/google_credentials.json" ]; then
        echo "Found in backend folder. Moving to secrets..."
        cp "$SCRIPT_DIR/backend/google_credentials.json" "$SECRETS_DIR/"
    else
        echo "Copy your Google credentials file:"
        echo "  cp /path/to/google_credentials.json $SECRETS_DIR/"
        echo ""
        read -p "Press Enter after copying, or Ctrl+C to abort..."
    fi
fi

echo -e "${GREEN}✓ Secrets directory configured${NC}"

# =============================================================================
# Step 4: Check for port conflicts
# =============================================================================
echo -e "\n${BLUE}[4/7] Checking for port conflicts...${NC}"

check_port() {
    local port=$1
    local service=$2
    if netstat -tuln 2>/dev/null | grep -q ":$port " || ss -tuln 2>/dev/null | grep -q ":$port "; then
        echo -e "${YELLOW}⚠ Port $port ($service) is already in use${NC}"
        return 1
    fi
    return 0
}

PORTS_OK=true
check_port 8080 "Frontend" || PORTS_OK=false
check_port 8000 "Backend API" || PORTS_OK=false
check_port 5433 "PostgreSQL" || PORTS_OK=false
check_port 6380 "Redis" || PORTS_OK=false

if [ "$PORTS_OK" = false ]; then
    echo -e "${YELLOW}Some ports are in use. The deployment may fail or need port changes.${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ All required ports are available${NC}"
fi

# =============================================================================
# Step 5: Build and start containers
# =============================================================================
echo -e "\n${BLUE}[5/7] Building and starting containers...${NC}"

# Use docker compose (v2) or docker-compose (v1)
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

echo "Using: $COMPOSE_CMD"

# Pull base images first
echo "Pulling base images..."
$COMPOSE_CMD -f docker-compose.prod.yml pull postgres redis

# Build application images
echo "Building application images..."
$COMPOSE_CMD -f docker-compose.prod.yml build --no-cache

# Start services
echo "Starting services..."
$COMPOSE_CMD -f docker-compose.prod.yml up -d

echo -e "${GREEN}✓ Containers started${NC}"

# =============================================================================
# Step 6: Run database migrations
# =============================================================================
echo -e "\n${BLUE}[6/7] Running database migrations...${NC}"

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 10

# Run migrations
echo "Running Alembic migrations..."
$COMPOSE_CMD -f docker-compose.prod.yml exec -T backend alembic upgrade head

# Create initial admin user
echo "Creating initial admin user..."
$COMPOSE_CMD -f docker-compose.prod.yml exec -T backend python scripts/create_initial_user.py || true

echo -e "${GREEN}✓ Database migrations complete${NC}"

# =============================================================================
# Step 7: Verify deployment
# =============================================================================
echo -e "\n${BLUE}[7/7] Verifying deployment...${NC}"

echo "Waiting for services to be healthy..."
sleep 5

# Check backend health
if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API is healthy${NC}"
else
    echo -e "${RED}✗ Backend API health check failed${NC}"
fi

# Check frontend
if curl -sf http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is healthy${NC}"
else
    echo -e "${RED}✗ Frontend health check failed${NC}"
fi

# Show container status
echo ""
echo "Container status:"
$COMPOSE_CMD -f docker-compose.prod.yml ps

# =============================================================================
# Done!
# =============================================================================
echo -e "\n${GREEN}"
echo "=============================================="
echo "  Deployment Complete!"
echo "=============================================="
echo -e "${NC}"
echo "Access the new app at:"
echo -e "  ${BLUE}http://$(hostname -I | awk '{print $1}'):8080${NC}"
echo ""
echo "Default login credentials:"
echo "  Email: admin@p1lending.com"
echo "  Password: admin123"
echo -e "  ${RED}⚠ Change this immediately after first login!${NC}"
echo ""
echo "Useful commands:"
echo "  View logs:     $COMPOSE_CMD -f docker-compose.prod.yml logs -f"
echo "  Stop app:      $COMPOSE_CMD -f docker-compose.prod.yml down"
echo "  Restart:       $COMPOSE_CMD -f docker-compose.prod.yml restart"
echo "  Shell access:  $COMPOSE_CMD -f docker-compose.prod.yml exec backend bash"
echo ""
echo "Your OLD app should still be running on its original ports."
echo ""

