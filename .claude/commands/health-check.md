---
allowed-tools: Task, Read, Glob, Grep, Bash(git:*), Bash(npm:*), Bash(pip:*), Bash(python -m:*), Bash(cd:*), Bash(docker compose:*), Bash(curl:*), Write
description: Run comprehensive health check with scoring on Claude Code setup and codebase
---

## Task
Run comprehensive health check and generate a scored report.

## Scoring System

| Category | Max Points | Weight |
|----------|------------|--------|
| Claude Code Setup | 20 | 20% |
| Security | 25 | 25% |
| Code Quality | 25 | 25% |
| Dependencies | 15 | 15% |
| Documentation | 15 | 15% |
| **Total** | **100** | **100%** |

## Health Check Categories

### 1. Claude Code Setup (20 points)

**Check 1.1: Settings file valid (5 pts)**
```bash
test -f .claude/settings.json && python3 -c "import json; json.load(open('.claude/settings.json'))" && echo "VALID" || echo "INVALID"
```
- PASS (5): Valid JSON
- FAIL (0): Missing or invalid

**Check 1.2: Commands available (5 pts)**
```bash
ls -1 .claude/commands/*.md 2>/dev/null | wc -l
```
- PASS (5): 10+ commands
- PARTIAL (3): 5-9 commands
- FAIL (0): <5 commands

**Check 1.3: Rules configured (4 pts)**
```bash
ls -1 .claude/rules/*.md 2>/dev/null | wc -l
```
- PASS (4): 5+ rules
- PARTIAL (2): 2-4 rules
- FAIL (0): <2 rules

**Check 1.4: CLAUDE.md current (3 pts)**
```bash
find . -name "CLAUDE.md" -mtime -30 | head -1
```
- PASS (3): Modified within 30 days
- PARTIAL (1): Modified within 90 days
- FAIL (0): Older than 90 days

**Check 1.5: Hooks functional (3 pts)**
```bash
test -x .claude/hooks/auto-format.sh && echo "EXECUTABLE" || echo "NOT EXECUTABLE"
```
- PASS (3): Hooks exist and executable
- FAIL (0): Missing or not executable

### 2. Security (25 points)

**Check 2.1: No secrets in git staging (10 pts)**
```bash
git diff --cached 2>/dev/null | grep -iE "password\s*=|secret\s*=|api_key\s*=" | head -5
```
- PASS (10): No matches
- FAIL (0): Secrets found (CRITICAL)

**Check 2.2: .env not tracked (5 pts)**
```bash
git ls-files .env backend/.env 2>/dev/null | head -1
```
- PASS (5): Not tracked
- FAIL (0): Tracked (CRITICAL)

**Check 2.3: Secrets directory protected (5 pts)**
```bash
test -d backend/secrets && cat .gitignore 2>/dev/null | grep -q "secrets" && echo "PROTECTED" || echo "UNPROTECTED"
```
- PASS (5): In .gitignore
- FAIL (0): Not protected

**Check 2.4: No hardcoded credentials (5 pts)**
```bash
grep -rn "password\s*=\s*['\"][^'\"]*['\"]" --include="*.py" backend/app/ 2>/dev/null | grep -v "example\|test\|#" | head -5
```
- PASS (5): No hardcoded passwords
- PARTIAL (2): Only in config defaults
- FAIL (0): Hardcoded in logic

### 3. Code Quality (25 points)

**Check 3.1: Backend linting (10 pts)**
```bash
cd backend && python -m ruff check . --select=E,W,F --statistics 2>&1 | tail -5
```
- PASS (10): No errors
- PARTIAL (5): <10 errors
- FAIL (0): 10+ errors

**Check 3.2: Frontend linting (8 pts)**
```bash
cd frontend && npm run lint 2>&1 | tail -10
```
- PASS (8): No errors
- PARTIAL (4): Only warnings
- FAIL (0): Errors present

**Check 3.3: TypeScript compilation (7 pts)**
```bash
cd frontend && npx tsc --noEmit 2>&1 | tail -10
```
- PASS (7): Compiles clean
- FAIL (0): Type errors

### 4. Dependencies (15 points)

**Check 4.1: No critical npm vulnerabilities (8 pts)**
```bash
cd frontend && npm audit --audit-level=critical 2>&1 | tail -10
```
- PASS (8): No critical
- PARTIAL (4): Only high
- FAIL (0): Critical found

**Check 4.2: Backend deps installable (7 pts)**
```bash
cd backend && pip check 2>&1 | head -5
```
- PASS (7): No conflicts
- FAIL (0): Dependency conflicts

### 5. Documentation (15 points)

**Check 5.1: README exists (5 pts)**
```bash
test -f README.md && echo "EXISTS" || echo "MISSING"
```
- PASS (5): Exists
- FAIL (0): Missing

**Check 5.2: CLAUDE.md comprehensive (5 pts)**
```bash
wc -l CLAUDE.md 2>/dev/null | awk '{print $1}'
```
- PASS (5): 200+ lines
- PARTIAL (3): 100-199 lines
- FAIL (0): <100 lines

**Check 5.3: API documented (5 pts)**
```bash
curl -s http://localhost:8000/docs 2>/dev/null | head -1 || echo "NOT ACCESSIBLE"
```
- PASS (5): OpenAPI accessible
- FAIL (0): Not running/accessible

## Output Format

```
╔══════════════════════════════════════════════════════════╗
║              HEALTH CHECK REPORT                         ║
║              Date: YYYY-MM-DD HH:MM                      ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  OVERALL SCORE: XX/100  [GRADE]                         ║
║                                                          ║
║  ████████████████░░░░  XX%                              ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║  CATEGORY BREAKDOWN                                      ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Claude Code Setup    XX/20  ████████░░  XX%            ║
║  Security             XX/25  ██████████  XX%            ║
║  Code Quality         XX/25  ████████░░  XX%            ║
║  Dependencies         XX/15  ██████░░░░  XX%            ║
║  Documentation        XX/15  ████████░░  XX%            ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║  CRITICAL ISSUES (Fix Immediately)                       ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  [CRIT] Secrets found in staged files                   ║
║         → Run: git reset HEAD <file>                    ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║  WARNINGS (Should Fix)                                   ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  [WARN] 5 linting errors in backend                     ║
║         → Run: /lint backend --fix                      ║
║                                                          ║
║  [WARN] npm audit found 2 high vulnerabilities          ║
║         → Run: npm audit fix                            ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║  RECOMMENDATIONS                                         ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  1. Add more Claude Code commands (current: 8)          ║
║  2. Update CLAUDE.md (last modified: 45 days ago)       ║
║  3. Consider adding pre-commit hooks                    ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

Grade Scale:
  A+ (95-100) | A (90-94) | A- (85-89)
  B+ (80-84)  | B (75-79) | B- (70-74)
  C+ (65-69)  | C (60-64) | C- (55-59)
  D (50-54)   | F (<50)
```

## Historical Tracking
Save results to `.claude/health-history.json`:
```json
{
  "checks": [
    {
      "date": "2024-12-14",
      "score": 85,
      "grade": "A-",
      "breakdown": {
        "claude_code": 18,
        "security": 23,
        "code_quality": 20,
        "dependencies": 12,
        "documentation": 12
      }
    }
  ]
}
```

## Related Commands
- For security deep-dive: `/security-review`
- For code fixes: `/lint --fix`
- For pre-deploy: `/pre-deploy`

## Example
```
/health-check
```
Runs all checks and generates scored report.
