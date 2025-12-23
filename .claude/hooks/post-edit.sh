#!/bin/bash
# Auto-format files after editing

FILE="$1"
EXTENSION="${FILE##*.}"

case "$EXTENSION" in
    ts|tsx|js|jsx|json)
        if command -v npx &> /dev/null; then
            npx prettier --write "$FILE" 2>/dev/null || true
        fi
        ;;
    py)
        if command -v black &> /dev/null; then
            black "$FILE" 2>/dev/null || true
        elif command -v ruff &> /dev/null; then
            ruff format "$FILE" 2>/dev/null || true
        fi
        ;;
    md)
        # Optional: format markdown
        if command -v npx &> /dev/null; then
            npx prettier --write "$FILE" 2>/dev/null || true
        fi
        ;;
esac

exit 0
