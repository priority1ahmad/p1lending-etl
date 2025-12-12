---
allowed-tools: Task, Read, Glob, Grep, Bash(git:*), Bash(npm:*), Bash(pip:*)
description: Run comprehensive health check on Claude Code setup and codebase
---

## Claude Code & Codebase Health Check

### 1. Claude Code Setup Health
Check for:
- [ ] `.claude/settings.json` exists and is valid JSON
- [ ] `.claude/commands/` has at least 5 useful commands
- [ ] `.claudeignore` exists and is comprehensive
- [ ] `CLAUDE.md` is up to date (modified within last 30 days)
- [ ] Hooks are functional (test auto-format hook)

### 2. Security Health
- [ ] No secrets in git staging: `git diff --cached | grep -i "password\|secret\|api_key"`
- [ ] `.env` not tracked: `git ls-files .env`
- [ ] Pre-commit hooks installed: `test -f .git/hooks/pre-commit`

### 3. Code Quality Health
- [ ] Backend linting passes: `cd backend && ruff check . --select=E,W,F`
- [ ] Frontend linting passes: `cd frontend && npm run lint`
- [ ] No TypeScript errors: `cd frontend && npx tsc --noEmit`

### 4. Dependency Health
- [ ] No critical vulnerabilities: `cd frontend && npm audit --audit-level=critical`
- [ ] Backend deps up to date: `cd backend && pip list --outdated`

### 5. Documentation Health
- [ ] README exists and has setup instructions
- [ ] CLAUDE.md reflects current architecture
- [ ] API endpoints documented

### Output
Generate a health report with:
- Overall score (0-100)
- Critical issues requiring immediate attention
- Recommendations for improvement
- Comparison with last health check (if available)
