#!/bin/bash
# Actions to perform when Claude Code session ends

echo ""
echo "=== Session Summary ==="
echo ""

# Show last commit
echo "Last commit:"
git log -1 --oneline 2>/dev/null || echo "(no commits)"

# Check for uncommitted changes
if [[ -n $(git status --porcelain 2>/dev/null) ]]; then
    echo ""
    echo "WARNING: Uncommitted changes detected!"
    git status --short
fi

# Check if tests should be run
CHANGED_FILES=$(git diff --name-only HEAD~1 2>/dev/null | grep -E '\.(ts|tsx|js|jsx|py)$' | head -5)
if [[ -n "$CHANGED_FILES" ]]; then
    echo ""
    echo "Changed source files (consider running tests):"
    echo "$CHANGED_FILES"
fi

# Remind about progress tracking
echo ""
echo "Remember to update SETUP-PROGRESS.md before ending!"
