# Skill, Command & Server Evaluation Rule

## Mandatory Pre-Task Checklist

**Before starting ANY task, Claude MUST evaluate:**

1. **Skills** - Is there a skill that applies?
2. **Slash Commands** - Is there a `/command` for this?
3. **MCP Servers** - Which servers provide relevant tools?
4. **Agents** - Should a specialized agent handle this?

## Decision Flow

```
User Request Received
         │
         ▼
┌─────────────────────────┐
│ 1. Check for applicable │
│    skill (even 1% match)│
│    → Invoke Skill tool  │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 2. Check slash commands │
│    in .claude/commands/ │
│    → Use if matches     │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 3. Identify MCP servers │
│    to leverage:         │
│    • snowflake → DB ops │
│    • github → PRs/issues│
│    • context7 → lib docs│
│    • playwright → UI    │
│    • mcp-request → APIs │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 4. Consider agents:     │
│    • Explore → codebase │
│    • Plan → architecture│
│    • code-reviewer → PR │
└──────────┬──────────────┘
           │
           ▼
      Execute Task
```

## Task-to-Resource Mapping

| Task Type | Check First | MCP Server | Agent |
|-----------|-------------|------------|-------|
| New feature | `/recommend`, `/start-feature` | context7 | Plan |
| Bug fix | `/fix-issue`, `/debug-etl` | snowflake | Explore |
| Database work | `/db-manage`, `/add-migration` | snowflake | - |
| API endpoint | `/add-endpoint` | mcp-request | - |
| React component | `/add-react-page`, `/storybook-component` | playwright | - |
| PR/Issue | - | github | code-reviewer |
| Documentation lookup | - | context7 | - |
| ETL debugging | `/debug-etl`, `/trace-job` | snowflake | - |
| Deployment | `/pre-deploy`, `/quick-deploy` | - | - |
| Code quality | `/lint`, `/security-review` | - | security-auditor |

## Available MCP Servers (This Project)

| Server | When to Use |
|--------|-------------|
| `snowflake` | Query MASTER_PROCESSED_DB, schema changes, data migrations |
| `github` | Create PRs, manage issues, view commits |
| `context7` | Look up library documentation (FastAPI, React, MUI, etc.) |
| `playwright` | Test UI components, take screenshots, browser automation |
| `mcp-request` | Test API endpoints, make HTTP requests |
| `sequential-thinking` | Complex multi-step analysis, architecture decisions |

## Red Flags - Stop and Reconsider

If you catch yourself thinking:
- "I'll just write this from scratch" → Check for existing patterns first
- "This is simple, no need for a command" → Commands exist for a reason
- "I know how to do this" → The project may have specific patterns
- "Let me explore the codebase manually" → Use Explore agent instead
- "I'll query the API directly" → Check if MCP server can do it

## Enforcement

This rule applies to:
- All file paths (`**/*`)
- Every user request
- Every task iteration

**Failure to evaluate available resources before acting is a violation of project standards.**

## Quick Reference

```
/recommend     → Feature planning
/implement     → Feature execution
/lint          → Code quality
/pre-deploy    → Deployment checks
/debug-etl     → ETL issues
/db-manage     → Database operations
/health-check  → Environment health
/environment-audit → Claude config audit
```
