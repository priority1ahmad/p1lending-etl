#\!/bin/bash
# Run after git merge/pull to check if Claude setup needs update

CLAUDE_MD_CHANGED=$(git diff HEAD@{1} --name-only | grep -c "CLAUDE.md" 2>/dev/null || echo "0")
BACKEND_STRUCTURE_CHANGED=$(git diff HEAD@{1} --name-only | grep -c "backend/app/" 2>/dev/null || echo "0")
FRONTEND_STRUCTURE_CHANGED=$(git diff HEAD@{1} --name-only | grep -c "frontend/src/" 2>/dev/null || echo "0")

if [ "$CLAUDE_MD_CHANGED" -gt 0 ] || [ "$BACKEND_STRUCTURE_CHANGED" -gt 5 ] || [ "$FRONTEND_STRUCTURE_CHANGED" -gt 5 ]; then
    echo "⚠️  Significant changes detected. Consider running /health-check"
fi
