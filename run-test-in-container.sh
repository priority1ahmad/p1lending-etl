#!/bin/bash
# Alternative way to run tests - copies script into container and runs it
# This works even if scripts aren't in the image

set -e

echo "=============================================="
echo "  Running Test Script in Container"
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
    exit 1
fi

# Use docker compose (v2) or docker-compose (v1)
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

echo "Choose test to run:"
echo "1. Litigator List Only"
echo "2. DNC List Only"
echo "3. Both Lists"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        SCRIPT_FILE="backend/scripts/test_litigator_list.py"
        ;;
    2)
        SCRIPT_FILE="backend/scripts/test_dnc_list.py"
        ;;
    3)
        SCRIPT_FILE="backend/scripts/test_both_lists.py"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

if [ ! -f "$SCRIPT_FILE" ]; then
    echo "ERROR: Script file not found: $SCRIPT_FILE"
    exit 1
fi

echo ""
echo "Copying script into container and running..."
echo ""

# Copy script into container and run it
cat "$SCRIPT_FILE" | $COMPOSE_CMD -f docker-compose.prod.yml exec -T backend python -c "
import sys
import tempfile
import os

# Read script from stdin
script_content = sys.stdin.read()

# Write to temp file
with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
    f.write(script_content)
    temp_path = f.name

try:
    # Change to /app directory
    os.chdir('/app')
    # Add /app to path
    sys.path.insert(0, '/app')
    # Execute the script
    exec(compile(script_content, temp_path, 'exec'), {'__name__': '__main__', '__file__': temp_path})
finally:
    # Clean up
    try:
        os.unlink(temp_path)
    except:
        pass
"

echo ""
echo "=============================================="
echo "  Test Complete"
echo "=============================================="

