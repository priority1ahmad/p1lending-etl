---
allowed-tools: Task, Read, Write, Edit, Glob, Grep
description: Analyze usage and improve Claude Code setup
---

## Continuous Improvement Analysis

### Data Sources
1. `.claude/state.json` - Usage statistics
2. `.claude/feedback.log` - User feedback
3. Git history - What types of changes are common
4. Failed command patterns - What doesn't work well

### Improvement Categories

#### A. New Commands Needed
Analyze git commits for patterns:
- Repeated file types edited together
- Common multi-step workflows
- Frequently typed bash commands

#### B. Command Refinements
From feedback and failures:
- Commands with low ratings
- Commands with common failure modes
- Commands that need more context

#### C. Rules Updates
From code review patterns:
- New conventions established
- Old conventions deprecated
- Common review feedback

### Output
Generate improvement PR with:
- 2-3 new commands based on usage patterns
- Updates to existing commands based on feedback
- Rules updates based on code patterns
