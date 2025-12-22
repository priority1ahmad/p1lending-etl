#!/bin/bash
# Pre-tool execution validation
# Receives tool name and arguments via stdin

TOOL_NAME="$1"
INPUT=$(cat)

# Block dangerous production operations
if echo "$INPUT" | grep -qiE "(production|prod|--env.*prod)"; then
    echo "BLOCKED: Production operations not allowed in development"
    exit 1
fi

# Block destructive commands
if echo "$INPUT" | grep -qE "rm\s+-rf\s+/"; then
    echo "BLOCKED: Dangerous recursive delete"
    exit 1
fi

# All checks passed
exit 0
