#!/bin/bash
# Quick fix: Copy test scripts into running container and run them
# This works immediately without rebuilding

set -e

echo "=============================================="
echo "  Quick Test Fix - Copy Scripts to Container"
echo "=============================================="
echo ""

# Check if docker-compose.prod.yml exists
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "ERROR: docker-compose.prod.yml not found!"
    exit 1
fi

# Check if backend container is running
if ! docker compose -f docker-compose.prod.yml ps backend | grep -q "Up"; then
    echo "ERROR: Backend container is not running!"
    exit 1
fi

# Use docker compose (v2) or docker-compose (v1)
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

echo "Copying test scripts to container..."
echo ""

# Create scripts directory in container if it doesn't exist
$COMPOSE_CMD -f docker-compose.prod.yml exec -T backend mkdir -p /app/scripts

# Copy test scripts
echo "Copying test_litigator_list.py..."
docker cp backend/scripts/test_litigator_list.py $(docker compose -f docker-compose.prod.yml ps -q backend):/app/scripts/test_litigator_list.py 2>/dev/null || \
$COMPOSE_CMD -f docker-compose.prod.yml exec -T backend sh -c "cat > /app/scripts/test_litigator_list.py" < backend/scripts/test_litigator_list.py

echo "Copying test_dnc_list.py..."
docker cp backend/scripts/test_dnc_list.py $(docker compose -f docker-compose.prod.yml ps -q backend):/app/scripts/test_dnc_list.py 2>/dev/null || \
$COMPOSE_CMD -f docker-compose.prod.yml exec -T backend sh -c "cat > /app/scripts/test_dnc_list.py" < backend/scripts/test_dnc_list.py

echo "Copying test_both_lists.py..."
docker cp backend/scripts/test_both_lists.py $(docker compose -f docker-compose.prod.yml ps -q backend):/app/scripts/test_both_lists.py 2>/dev/null || \
$COMPOSE_CMD -f docker-compose.prod.yml exec -T backend sh -c "cat > /app/scripts/test_both_lists.py" < backend/scripts/test_both_lists.py

echo ""
echo "✅ Scripts copied successfully!"
echo ""
echo "Now you can run:"
echo "  docker compose -f docker-compose.prod.yml exec -T backend python /app/scripts/test_both_lists.py"
echo ""
echo "Or use: bash test-lists.sh"

