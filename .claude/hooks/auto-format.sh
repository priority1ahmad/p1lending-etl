#\!/bin/bash
# Auto-format files after edit/write

FILE_PATH=$(jq -r '.tool_input.file_path // empty' 2>/dev/null)

if [ -z "$FILE_PATH" ]; then
    exit 0
fi

# Python files
if [[ "$FILE_PATH" == *.py ]]; then
    if command -v black &> /dev/null; then
        black --quiet "$FILE_PATH" 2>/dev/null || true
    fi
    if command -v ruff &> /dev/null; then
        ruff check --fix --quiet "$FILE_PATH" 2>/dev/null || true
    fi
fi

# TypeScript/JavaScript files
if [[ "$FILE_PATH" == *.ts ]] || [[ "$FILE_PATH" == *.tsx ]] || [[ "$FILE_PATH" == *.js ]]; then
    if command -v npx &> /dev/null; then
        npx prettier --write "$FILE_PATH" 2>/dev/null || true
    fi
fi

exit 0
