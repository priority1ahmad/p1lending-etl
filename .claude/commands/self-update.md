---
allowed-tools: Task, Read, Write, Edit, Glob, WebFetch, WebSearch
description: Update Claude Code setup based on latest best practices
---

## Self-Update System

### Process
1. **Gather current state**
   - Read current `.claude/settings.json`
   - List current commands in `.claude/commands/`
   - Check current CLAUDE.md content

2. **Research updates** (spawn Explore agents)
   - Agent 1: Search for new Claude Code features (WebSearch)
   - Agent 2: Analyze codebase changes since last update
   - Agent 3: Check for deprecated patterns

3. **Generate update plan**
   - New commands to add based on codebase evolution
   - Settings to update for new features
   - CLAUDE.md sections to refresh

4. **Apply updates** (with user approval)
   - Add new slash commands
   - Update settings for new capabilities
   - Refresh documentation

### Schedule
Run this command monthly or when:
- Major Claude Code version released
- Significant codebase changes merged
- Team reports missing functionality
