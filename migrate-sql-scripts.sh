#!/bin/bash
# Script to manually migrate SQL scripts to database
# This can be run if SQL scripts are not showing in the frontend
# This script MUST be run from the project root directory

set -e

echo "=============================================="
echo "  Migrating SQL Scripts to Database"
echo "=============================================="
echo ""

# Check if docker-compose.prod.yml exists
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "ERROR: docker-compose.prod.yml not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "ERROR: Docker is not running or you don't have permission to access it."
    echo "Please start Docker and ensure you have the necessary permissions."
    exit 1
fi

# Check if backend container is running
if ! docker compose -f docker-compose.prod.yml ps backend | grep -q "Up"; then
    echo "ERROR: Backend container is not running!"
    echo "Please start the containers first:"
    echo "  docker compose -f docker-compose.prod.yml up -d"
    exit 1
fi

echo "Running migration in Docker container..."
echo ""

# Use docker compose (v2) or docker-compose (v1)
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

$COMPOSE_CMD -f docker-compose.prod.yml exec -T backend python scripts/migrate_sql_scripts.py

echo ""
echo "=============================================="
echo "  Migration Complete!"
echo "=============================================="
echo ""
echo "SQL scripts should now be visible in the frontend."
echo "Refresh your browser to see them."

