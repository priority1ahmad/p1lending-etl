# MCP Server Usage Guide

## Available MCP Servers

### GitHub (`github`)
**Scope**: User (available in all projects)

**Key Tools**:
- `create_issue` - Create GitHub issues
- `list_issues` - List and filter issues
- `create_pull_request` - Create PRs
- `search_repositories` - Search for repos
- `get_file_contents` - Read files from repos
- `push_files` - Push multiple files in one commit

**Example Usage**:
"Create a GitHub issue for adding user authentication"

### Sequential Thinking (`sequential-thinking`)
**Scope**: User

**When to Use**:
- Complex architectural decisions
- Multi-step problem solving
- Breaking down large features
- Debugging complex issues

**Example Usage**:
"Use sequential thinking to plan the ETL pipeline architecture"

### Context7 (`context7`)
**Scope**: User

**Key Tools**:
- `resolve-library-id` - Find library documentation ID
- `get-library-docs` - Query library documentation

**Example Usage**:
"Look up Snowflake Python connector documentation on Context7"

### Playwright (`playwright`)
**Scope**: Project

**Key Tools**:
- `browser_navigate` - Go to URL
- `browser_screenshot` - Capture page
- `browser_click` - Click elements
- `browser_type` - Type text into fields
- `browser_snapshot` - Get accessibility tree

**Headless Mode** (Linode): All operations run without visible browser.

**Example Usage**:
"Use Playwright to test the /results page loads correctly"

### Storybook (`storybook-mcp`) [Pending Phase 5]
**Scope**: Project

Will be added after Storybook is installed in Phase 5:
```bash
claude mcp add storybook-mcp \
  --scope project \
  --transport http \
  -- http://localhost:6006/mcp
```

**Key Tools**:
- `list-all-components` - Get all components
- `get-component-docs` - Get component props/docs
- `get-story-url` - Get URL to specific story

## MCP Best Practices

1. **Check before creating**: Always search existing resources first
2. **Use for research**: Let MCP servers provide context
3. **Combine tools**: Use GitHub + Sequential Thinking for planning
4. **Document findings**: Add learnings to CLAUDE.md
5. **Prefer accessibility snapshots**: Playwright's snapshot is faster than screenshots

## Environment Variables

The following environment variables are used by MCP servers:

```bash
# GitHub MCP (auto-configured via gh CLI)
GITHUB_TOKEN=$(gh auth token)

# Brave Search (optional - not installed)
# BRAVE_API_KEY=your_key_here
```

## Troubleshooting

### MCP server not connecting
```bash
# Check server status
claude mcp list

# Remove and re-add
claude mcp remove <server-name>
claude mcp add <server-name> ...
```

### Playwright browser issues
```bash
# Reinstall browser with dependencies
npx playwright install chromium --with-deps
```

### GitHub authentication issues
```bash
# Re-authenticate
gh auth login
gh auth status
```
