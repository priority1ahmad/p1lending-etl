---
allowed-tools: Task, Read, Write, Edit, Glob, Grep, Bash(claude:*), Bash(cat:*), Bash(ls:*), Bash(wc:*), Bash(find:*), Bash(git:*), mcp__sequential-thinking__sequentialthinking
description: Perform comprehensive Claude Code environment audit with recommendations
---

## Task

Perform a thorough audit of the Claude Code environment and generate a structured report with specific recommendations.

## Audit Categories

### 1. MCP Server Analysis
```bash
claude mcp list
```

Categorize each server into:
- **Essential**: Actively used, critical for workflow
- **Nice-to-have**: Occasionally useful but not blocking
- **Remove**: Unused, redundant, or problematic

### 2. Settings Analysis

**Files to examine:**
- `~/.claude.json` (global settings)
- `.claude/settings.json` (project settings)

**Check for:**
- Redundant configurations between files
- Stale allowed/denied tool patterns
- Missing essential permissions
- Hooks that should exist but don't

### 3. Commands Analysis

**Directories:**
- `.claude/commands/` (project commands)
- `~/.claude/commands/` (global commands)

**Identify:**
- Overlapping functionality between commands
- Commands that are never used
- Missing commands based on common workflows

### 4. CLAUDE.md Quality

**Metrics:**
| Metric | Good | Warning | Bad |
|--------|------|---------|-----|
| Length | 200-400 lines | 100-199 or 400-600 | <100 or >600 |
| Last updated | <30 days | 30-90 days | >90 days |
| TDD enforcement | Explicit | Implied | Missing |
| Architecture clarity | Diagrams/tables | Text only | Vague |
| Decision framework | Clear matrix | Some guidance | None |

### 5. Hooks Analysis

**Essential hooks:**
- Pre-edit: Formatting (Black/Prettier/Ruff)
- Pre-commit: Tests must pass
- Post-tool: Auto-lint on file changes

**Check for:**
- Missing essential hooks
- Broken hook scripts
- Over-aggressive blocking hooks

### 6. Context Analysis

Analyze token efficiency:
- Rules that could be consolidated
- Overly verbose CLAUDE.md sections
- Redundant documentation

## Report Format

```
╔═══════════════════════════════════════════════════════════════════╗
║              CLAUDE CODE ENVIRONMENT AUDIT                        ║
║              Date: YYYY-MM-DD                                     ║
╠═══════════════════════════════════════════════════════════════════╣

## Current State Summary

| Category | Status | Issues |
|----------|--------|--------|
| MCP Servers | X active | Y to review |
| Settings | Valid | Z redundancies |
| Commands | N total | M overlapping |
| CLAUDE.md | X lines | Updated Y days ago |
| Hooks | X active | Y missing |

## Items to REMOVE

### MCP Servers
- `server-name` - Reason: not used in 30 days
  → Command: `claude mcp remove server-name`

### Commands
- `/command-name` - Reason: duplicates /other-command
  → Command: `rm .claude/commands/command-name.md`

### Settings
- `pattern-in-allowed-tools` - Reason: too permissive
  → Edit: `.claude/settings.json`

## Items to ADD

### Missing Hooks
- Pre-commit test runner
  → Add hook configuration to settings.json

### Missing Commands
- `/command-suggestion` - Would help with common workflow X

### Settings Improvements
- Add `Bash(test:*)` to allowed tools for TDD workflow

## CLAUDE.md Improvements

### Too Long (if applicable)
- Section "X" could be moved to .claude/docs/
- Section "Y" is redundant with rules/

### Too Short (if applicable)
- Missing: Architecture overview
- Missing: Decision framework
- Missing: TDD requirements

### Clarity Issues
- Section "X" needs examples
- Section "Y" contradicts rule Z

## Action Priority

| Priority | Action | Impact |
|----------|--------|--------|
| P0 (Now) | Remove broken MCP server | Unblocks workflow |
| P1 (Today) | Add missing hooks | Prevents errors |
| P2 (Week) | Consolidate commands | Reduces confusion |
| P3 (Month) | Refactor CLAUDE.md | Improves context |

╚═══════════════════════════════════════════════════════════════════╝
```

## Execution Flow

1. Use `mcp__sequential-thinking__sequentialthinking` for deep analysis
2. Collect all data before making recommendations
3. Present findings and wait for user approval
4. Only make changes after explicit approval

## Example

```
/environment-audit
```

Generates comprehensive audit report without making any changes.
