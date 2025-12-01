#!/bin/bash
# Script to set up DNC database for production
# This helps locate and mount the DNC database correctly

set -e

echo "=============================================="
echo "  DNC Database Setup"
echo "=============================================="
echo ""

PROD_PATH="/home/ubuntu/etl_app"
CURRENT_DIR=$(pwd)

echo "Looking for DNC database..."
echo ""

# Check common locations
DNC_FOUND=""
DNC_PATHS=(
    "$PROD_PATH/dnc_database.db"
    "$PROD_PATH/data/dnc_database.db"
    "$CURRENT_DIR/dnc_database.db"
    "$CURRENT_DIR/data/dnc_database.db"
    "$CURRENT_DIR/backend/dnc_database.db"
    "../old_app/dnc_database.db"
    "/home/ubuntu/old_app/dnc_database.db"
)

for path in "${DNC_PATHS[@]}"; do
    if [ -f "$path" ]; then
        DNC_FOUND="$path"
        echo "✅ Found DNC database at: $path"
        echo "   Size: $(du -h "$path" | cut -f1)"
        break
    fi
done

if [ -z "$DNC_FOUND" ]; then
    echo "❌ DNC database not found in any of these locations:"
    for path in "${DNC_PATHS[@]}"; do
        echo "   - $path"
    done
    echo ""
    echo "Please copy your DNC database to one of these locations:"
    echo "  1. $PROD_PATH/dnc_database.db (recommended for production)"
    echo "  2. $CURRENT_DIR/dnc_database.db"
    echo ""
    exit 1
fi

echo ""
echo "Setting up DNC database for Docker..."
echo ""

# Copy to production location if not already there
if [ "$DNC_FOUND" != "$PROD_PATH/dnc_database.db" ]; then
    echo "Copying DNC database to production location..."
    sudo mkdir -p "$PROD_PATH"
    sudo cp "$DNC_FOUND" "$PROD_PATH/dnc_database.db"
    sudo chmod 644 "$PROD_PATH/dnc_database.db"
    echo "✅ Copied to: $PROD_PATH/dnc_database.db"
fi

# Also copy to current directory for docker-compose
if [ "$DNC_FOUND" != "$CURRENT_DIR/dnc_database.db" ]; then
    echo "Copying DNC database to current directory..."
    cp "$DNC_FOUND" "$CURRENT_DIR/dnc_database.db"
    echo "✅ Copied to: $CURRENT_DIR/dnc_database.db"
fi

echo ""
echo "=============================================="
echo "  Setup Complete!"
echo "=============================================="
echo ""
echo "The DNC database is now available at:"
echo "  - $PROD_PATH/dnc_database.db (host)"
echo "  - /app/data/dnc_database.db (Docker container)"
echo ""
echo "Restart containers to apply changes:"
echo "  docker compose -f docker-compose.prod.yml restart backend celery-worker"
echo ""

