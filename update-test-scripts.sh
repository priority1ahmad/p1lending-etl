#!/bin/bash
# Quick script to update test scripts in running container
# Run this after pulling latest code with updated test scripts

set -e

echo "=============================================="
echo "  Updating Test Scripts in Container"
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

CONTAINER_ID=$(docker compose -f docker-compose.prod.yml ps -q backend)

echo "Copying updated test scripts to container..."
echo ""

# Ensure scripts directory exists
$COMPOSE_CMD -f docker-compose.prod.yml exec -T backend mkdir -p /app/scripts

# Copy scripts using docker cp (faster and more reliable)
echo "1. Copying test_litigator_list.py..."
docker cp backend/scripts/test_litigator_list.py "$CONTAINER_ID:/app/scripts/test_litigator_list.py" 2>/dev/null && echo "   ✅ Copied" || echo "   ⚠️  Using alternative method..."
if [ $? -ne 0 ]; then
    $COMPOSE_CMD -f docker-compose.prod.yml exec -T backend sh -c "cat > /app/scripts/test_litigator_list.py" < backend/scripts/test_litigator_list.py
fi

echo "2. Copying test_dnc_list.py..."
docker cp backend/scripts/test_dnc_list.py "$CONTAINER_ID:/app/scripts/test_dnc_list.py" 2>/dev/null && echo "   ✅ Copied" || echo "   ⚠️  Using alternative method..."
if [ $? -ne 0 ]; then
    $COMPOSE_CMD -f docker-compose.prod.yml exec -T backend sh -c "cat > /app/scripts/test_dnc_list.py" < backend/scripts/test_dnc_list.py
fi

echo "3. Copying test_both_lists.py..."
docker cp backend/scripts/test_both_lists.py "$CONTAINER_ID:/app/scripts/test_both_lists.py" 2>/dev/null && echo "   ✅ Copied" || echo "   ⚠️  Using alternative method..."
if [ $? -ne 0 ]; then
    $COMPOSE_CMD -f docker-compose.prod.yml exec -T backend sh -c "cat > /app/scripts/test_both_lists.py" < backend/scripts/test_both_lists.py
fi

echo ""
echo "Verifying scripts are updated..."
echo ""

$COMPOSE_CMD -f docker-compose.prod.yml exec -T backend python -c "
import sys
import os

scripts_to_check = [
    ('/app/scripts/test_dnc_list.py', 'test_dnc_list.py'),
    ('/app/scripts/test_litigator_list.py', 'test_litigator_list.py'),
    ('/app/scripts/test_both_lists.py', 'test_both_lists.py'),
]

all_updated = True
for script_path, script_name in scripts_to_check:
    if os.path.exists(script_path):
        with open(script_path, 'r') as f:
            content = f.read()
            if '313-782-5498' in content:
                print(f'✅ {script_name} has updated phone numbers')
            else:
                print(f'❌ {script_name} does NOT have updated phone numbers')
                all_updated = False
    else:
        print(f'❌ {script_name} not found at {script_path}')
        all_updated = False

if all_updated:
    print()
    print('✅ All scripts are updated!')
else:
    print()
    print('⚠️  Some scripts may need manual update')
" 2>&1

echo ""
echo "=============================================="
echo "  Update Complete"
echo "=============================================="
echo ""
echo "You can now run the tests:"
echo "  docker compose -f docker-compose.prod.yml exec -T backend python /app/scripts/test_both_lists.py"
echo ""

