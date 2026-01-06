#!/bin/bash
# Remind Claude about available resources at session start

cat << 'EOF'
{
  "systemMessage": "📋 **Resource Reminder**: Before each task, evaluate: (1) Skills - check if any skill applies, (2) Commands - check .claude/commands/ for matching /commands, (3) MCP Servers - snowflake, github, context7, playwright, mcp-request, (4) Agents - Explore, Plan, code-reviewer. See .claude/rules/skill-evaluation.md for decision flow."
}
EOF
