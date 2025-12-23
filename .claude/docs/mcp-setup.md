# MCP Server Setup Guide

This guide documents how to set up Model Context Protocol (MCP) servers for the P1Lending ETL system.

## Overview

MCP (Model Context Protocol) allows Claude Code to connect directly to external tools and data sources like databases, GitHub, and other services.

## Available MCP Servers

### 1. PostgreSQL MCP Server

**Purpose:** Query the ETL database directly for audit logs, job status, and debugging.

**Installation:**
```bash
claude mcp add postgres --scope project
```

**Configuration (`.claude/mcp.json`):**
```json
{
  "mcp_servers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://p1lending:***@localhost:5433/p1lending_etl"
      }
    }
  }
}
```

**Use Cases:**
- Query job status: `SELECT * FROM etl_jobs WHERE status = 'failed'`
- Check audit logs: `SELECT * FROM login_audit_logs ORDER BY created_at DESC`
- Debug issues: Direct database inspection

**Security Note:** Never commit database credentials. Use environment variables.

---

### 2. GitHub MCP Server

**Purpose:** Manage issues, PRs, and repository operations directly from Claude Code.

**Installation:**
```bash
claude mcp add github --scope user
```

**Configuration:**
```json
{
  "mcp_servers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "<your-token>"
      }
    }
  }
}
```

**Use Cases:**
- Create issues for bugs found during debugging
- Review PRs without leaving Claude Code
- Search repository for code patterns

**Required Scopes:** `repo`, `read:org`

---

### 3. Git MCP Server

**Purpose:** Enhanced git operations beyond basic bash commands.

**Installation:**
```bash
claude mcp add git --scope project
```

**Configuration:**
```json
{
  "mcp_servers": {
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git"],
      "env": {
        "GIT_DIR": "/home/p1ahmad/projects/LodasoftETL/new_app/.git"
      }
    }
  }
}
```

**Use Cases:**
- Complex git operations
- History analysis
- Branch management

---

## Setup Instructions

### Step 1: Install MCP CLI
```bash
npm install -g @modelcontextprotocol/cli
```

### Step 2: Add Server
```bash
# For project-specific (stored in .claude/mcp.json)
claude mcp add <server-name> --scope project

# For user-wide (stored in ~/.claude/mcp.json)
claude mcp add <server-name> --scope user
```

### Step 3: Configure Credentials
Edit the configuration file and add credentials via environment variables or the config file (for non-sensitive data).

### Step 4: Verify Connection
```bash
claude mcp list
claude mcp test <server-name>
```

---

## Security Best Practices

1. **Never commit credentials**
   - Use environment variables
   - Add `mcp.json` to `.gitignore` if it contains secrets

2. **Use minimal permissions**
   - Database: Read-only user when possible
   - GitHub: Limit token scopes

3. **Audit access**
   - MCP servers have full access to connected resources
   - Only install from trusted sources

---

## Recommended Setup for P1Lending ETL

### Development Environment
```json
{
  "mcp_servers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${POSTGRES_URL}"
      }
    }
  }
}
```

### Production (Read-Only)
```json
{
  "mcp_servers": {
    "postgres-readonly": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "--readonly"],
      "env": {
        "DATABASE_URL": "${POSTGRES_READONLY_URL}"
      }
    }
  }
}
```

---

## Troubleshooting

### "Connection refused"
- Check if database is running
- Verify port mapping in docker-compose
- Test connection with `psql` first

### "Authentication failed"
- Verify credentials in environment
- Check user permissions in database
- Ensure token has required scopes (GitHub)

### "MCP server not found"
- Run `npm install -g @modelcontextprotocol/server-<name>`
- Check npm global path is in PATH

---

## Future MCP Servers to Consider

| Server | Purpose | Priority |
|--------|---------|----------|
| Snowflake | Query data warehouse directly | High |
| Slack | Send notifications, alerts | Medium |
| Redis | Debug Celery queues | Medium |
| AWS | Manage EC2, logs | Low |

---

*Last updated: December 2024*
