---
allowed-tools: Bash(npm run:*), Bash(pytest:*), Bash(git:*), Read, Grep
description: Pre-deployment checklist and validation
---

## Pre-Deployment Checklist

### 1. Code Quality
- [ ] Run backend linting: `cd backend && ruff check .`
- [ ] Run frontend linting: `cd frontend && npm run lint`
- [ ] Run type checking: `cd frontend && npm run build`

### 2. Tests
- [ ] Run backend tests: `cd backend && pytest`
- [ ] Run frontend tests: `cd frontend && npm test`

### 3. Security
- [ ] No secrets in code: `grep -r "password\|secret\|api_key" --include="*.py" --include="*.ts"`
- [ ] .env not staged: `git status`

### 4. Database
- [ ] Migrations up to date: `alembic current`
- [ ] No pending migrations: `alembic check`

### 5. Git
- [ ] On correct branch: `git branch --show-current`
- [ ] No uncommitted changes: `git status`
- [ ] Recent commits reviewed: `git log --oneline -5`

### 6. Documentation
- [ ] CHANGELOG updated if needed
- [ ] API changes documented
