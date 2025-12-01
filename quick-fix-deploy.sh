#!/bin/bash
# Quick fix deployment script for logs permission error
# Run this on your production server after pulling the latest code

set -e

echo "=============================================="
echo "  Quick Fix: Logs Permission Error"
echo "=============================================="
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Step 1: Create logs directory
echo "[1/4] Creating logs directory..."
mkdir -p backend/logs/jobs
chmod -R 755 backend/logs
echo "✓ Logs directory created"

# Step 2: Stop containers
echo ""
echo "[2/4] Stopping existing containers..."
docker compose -f docker-compose.prod.yml down 2>/dev/null || true
echo "✓ Containers stopped"

# Step 3: Rebuild
echo ""
echo "[3/4] Rebuilding containers with fixes..."
docker compose -f docker-compose.prod.yml build --no-cache backend celery-worker
echo "✓ Containers rebuilt"

# Step 4: Start services
echo ""
echo "[4/4] Starting services..."
docker compose -f docker-compose.prod.yml up -d
echo "✓ Services started"

# Verify
echo ""
echo "=============================================="
echo "  Deployment Complete!"
echo "=============================================="
echo ""
echo "Checking container status..."
docker compose -f docker-compose.prod.yml ps
echo ""
echo "Checking logs directory in container..."
docker compose -f docker-compose.prod.yml exec -T backend ls -la /app/backend/logs/jobs 2>/dev/null || echo "⚠ Directory check failed (container may still be starting)"
echo ""
echo "View logs with:"
echo "  docker compose -f docker-compose.prod.yml logs -f backend"
echo ""

