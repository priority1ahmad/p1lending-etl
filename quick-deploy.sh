#!/bin/bash

#######################################################
# Quick Deploy to Staging (Minimal Version)
#######################################################
#
# Fast deployment script without confirmations
# Perfect for rapid iteration during development
#
# Usage:
#   ./quick-deploy.sh [SERVER_IP]
#
#######################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SERVER="${1:-13.218.65.240}"
KEY="~/.ssh/staging_key.pem"
KEY="${KEY/#\~/$HOME}"

echo -e "${CYAN}🚀 Quick Deploy to $SERVER${NC}\n"

# Pull & Restart
ssh -i "$KEY" ubuntu@"$SERVER" bash << 'ENDSSH'
cd ~/etl_app
echo "⬇️  Pulling latest code..."
git pull origin staging
echo "🔄 Restarting services..."
docker-compose -f docker-compose.prod.yml up -d --build
echo "✓ Done!"
ENDSSH

echo -e "\n${GREEN}✓ Deployment complete!${NC}"
echo -e "Frontend: http://$SERVER:3000"
echo -e "Backend: http://$SERVER:8000/docs\n"
