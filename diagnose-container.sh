#!/bin/bash
# Diagnostic script to check container structure
# This helps identify where files are located in the Docker container

echo "=============================================="
echo "  Container Structure Diagnostic"
echo "=============================================="
echo ""

# Check if docker-compose.prod.yml exists
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "ERROR: docker-compose.prod.yml not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Check if backend container is running
if ! docker compose -f docker-compose.prod.yml ps backend | grep -q "Up"; then
    echo "ERROR: Backend container is not running!"
    echo "Please start the containers first:"
    echo "  docker compose -f docker-compose.prod.yml up -d"
    exit 1
fi

# Use docker compose (v2) or docker-compose (v1)
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

echo "1. Checking /app directory structure..."
echo ""
$COMPOSE_CMD -f docker-compose.prod.yml exec -T backend ls -la /app | head -20
echo ""

echo "2. Checking for scripts directory..."
echo ""
$COMPOSE_CMD -f docker-compose.prod.yml exec -T backend ls -la /app/scripts 2>/dev/null || echo "❌ /app/scripts does not exist"
echo ""

echo "3. Checking for backend/scripts directory..."
echo ""
$COMPOSE_CMD -f docker-compose.prod.yml exec -T backend ls -la /app/backend/scripts 2>/dev/null || echo "❌ /app/backend/scripts does not exist"
echo ""

echo "4. Running Python diagnostic script..."
echo ""
$COMPOSE_CMD -f docker-compose.prod.yml exec -T backend python /app/scripts/check_container_structure.py 2>/dev/null || \
$COMPOSE_CMD -f docker-compose.prod.yml exec -T backend python scripts/check_container_structure.py 2>/dev/null || \
$COMPOSE_CMD -f docker-compose.prod.yml exec -T backend python /app/backend/scripts/check_container_structure.py 2>/dev/null || \
echo "❌ Could not run diagnostic script"
echo ""

echo "5. Checking for test scripts..."
echo ""
echo "Looking for test_litigator_list.py:"
$COMPOSE_CMD -f docker-compose.prod.yml exec -T backend find /app -name "test_litigator_list.py" 2>/dev/null || echo "  Not found"
echo ""

echo "Looking for test_dnc_list.py:"
$COMPOSE_CMD -f docker-compose.prod.yml exec -T backend find /app -name "test_dnc_list.py" 2>/dev/null || echo "  Not found"
echo ""

echo "Looking for test_both_lists.py:"
$COMPOSE_CMD -f docker-compose.prod.yml exec -T backend find /app -name "test_both_lists.py" 2>/dev/null || echo "  Not found"
echo ""

echo "=============================================="
echo "  Diagnostic Complete"
echo "=============================================="
echo ""
echo "Based on the results above, use the correct path to run scripts."
echo "Common paths:"
echo "  - /app/scripts/test_both_lists.py"
echo "  - scripts/test_both_lists.py (if working dir is /app)"
echo "  - /app/backend/scripts/test_both_lists.py (if different structure)"

