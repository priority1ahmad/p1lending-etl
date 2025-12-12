---
allowed-tools: Read, Write, Edit
description: Record feedback about Claude Code commands or setup
argument-hint: <command-name> <rating 1-5> <notes>
---

## Command Feedback

Record feedback for command `$1`:
- Rating: $2/5
- Notes: $3

### Process
1. Log feedback to `.claude/feedback.log`
2. If rating < 3, flag for review
3. Aggregate feedback weekly for improvements

### Feedback Log Format
```
[TIMESTAMP] command=$1 rating=$2 notes="$3"
```
