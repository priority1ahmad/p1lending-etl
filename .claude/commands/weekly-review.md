---
allowed-tools: Task, Read, Write, Edit
description: Weekly Claude Code setup review (run every Monday)
---

## Weekly Review Checklist

### Questions to Answer
1. What commands did we use most this week?
2. What repetitive tasks could become new commands?
3. Did any commands fail or produce poor results?
4. Are there new patterns in the codebase not captured in rules?

### Actions
1. Run `/health-check` and note score
2. Review command usage stats in `.claude/state.json`
3. Identify top 3 improvements for this week
4. Update CLAUDE.md with any new conventions discovered

### Anti-Entropy Tasks
- Remove unused commands (0 uses in 30 days)
- Update outdated command instructions
- Add commands for repeated manual tasks
- Refresh rules based on code review feedback
