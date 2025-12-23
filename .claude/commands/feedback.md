---
allowed-tools: Bash
description: Record feedback about Claude Code commands or setup
argument-hint: <command-name> <rating 1-5> <notes>
---

## Record Command Feedback

Log feedback for command **$1** with rating **$2/5**.

### Action
Append feedback entry to `.claude/feedback.log`:

```bash
echo "$(date +%Y-%m-%d) | $1 | $2 | $3" >> .claude/feedback.log
```

### Validation
- Rating must be 1-5
- Command name should be a valid slash command
- Notes should describe what worked well or what needs improvement

### After Recording
- If rating < 3, add flag for review: `[NEEDS REVIEW]`
- Thank user for feedback
- Suggest running `/weekly-review` to analyze patterns

### Low Rating Response
If rating is 1-2, ask user:
- What specifically didn't work?
- What was expected vs. what happened?
- How could the command be improved?

### Output
```
✅ Feedback recorded for /$1 (rating: $2/5)

Logged to: .claude/feedback.log
Entry: $(date +%Y-%m-%d) | $1 | $2 | $3

Thank you for helping improve Claude Code setup!
Run /weekly-review to see aggregated feedback patterns.
```
