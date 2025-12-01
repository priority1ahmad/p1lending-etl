#!/bin/bash
# Test script for Litigator and DNC lists
# Run this from the project root directory

set -e

echo "=============================================="
echo "  List Testing Script"
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

echo "Choose test to run:"
echo "1. Litigator List Only"
echo "2. DNC List Only"
echo "3. Both Lists"
echo ""
read -p "Enter choice (1-3): " choice

# Use docker compose (v2) or docker-compose (v1)
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

case $choice in
    1)
        echo ""
        echo "Running Litigator List test..."
        echo ""
        $COMPOSE_CMD -f docker-compose.prod.yml exec -T backend python scripts/test_litigator_list.py
        ;;
    2)
        echo ""
        echo "Running DNC List test..."
        echo ""
        $COMPOSE_CMD -f docker-compose.prod.yml exec -T backend python scripts/test_dnc_list.py
        ;;
    3)
        echo ""
        echo "Running both tests..."
        echo ""
        $COMPOSE_CMD -f docker-compose.prod.yml exec -T backend python scripts/test_both_lists.py
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "=============================================="
echo "  Test Complete"
echo "=============================================="

