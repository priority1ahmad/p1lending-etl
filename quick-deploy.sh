#!/bin/bash

#######################################################
# Quick Deploy (Run on Staging Server)
#######################################################
#
# Fast deployment script without confirmations
# Perfect for rapid iteration during development
#
# Run this script DIRECTLY on the staging server.
#
# Usage (on staging server):
#   cd ~/etl_app
#   ./quick-deploy.sh
#
#######################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🚀 Quick Deploy${NC}\n"

# Pull & Restart
echo "⬇️  Pulling latest code..."
git pull origin staging

echo "🔄 Restarting services..."
docker-compose -f docker-compose.prod.yml up -d --build

echo "✓ Done!"

echo -e "\n${GREEN}✓ Deployment complete!${NC}\n"
