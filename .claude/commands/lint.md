---
allowed-tools: Bash(python -m ruff:*), Bash(ruff:*), Bash(npm run:*), Bash(cd:*), Bash(black:*), Bash(python -m black:*), Read
description: Run code quality checks on backend and frontend
argument-hint: "[backend|frontend|all] [--fix]"
---

## Task
Run linting and code quality checks across the codebase, optionally auto-fixing issues.

## Supported Arguments
- `backend` - Check only Python code
- `frontend` - Check only TypeScript/React code
- `all` or (none) - Check both (default)
- `--fix` - Auto-fix fixable issues

## Workflow

### Backend Checks (Python)

**Ruff Linting:**
```bash
cd backend && python -m ruff check . --output-format=grouped
```

**Ruff with Auto-fix:**
```bash
cd backend && python -m ruff check . --fix
```

**Black Formatting Check:**
```bash
cd backend && python -m black --check --diff .
```

**Black Auto-format:**
```bash
cd backend && python -m black .
```

**Type Checking (if mypy configured):**
```bash
cd backend && python -m mypy app/ --ignore-missing-imports 2>/dev/null || echo "mypy not configured"
```

### Frontend Checks (TypeScript/React)

**ESLint:**
```bash
cd frontend && npm run lint
```

**ESLint with Auto-fix:**
```bash
cd frontend && npm run lint -- --fix
```

**TypeScript Compilation:**
```bash
cd frontend && npx tsc --noEmit
```

**Prettier Check:**
```bash
cd frontend && npx prettier --check "src/**/*.{ts,tsx,css}"
```

**Prettier Auto-format:**
```bash
cd frontend && npx prettier --write "src/**/*.{ts,tsx,css}"
```

## Output Format

```
============================================
CODE QUALITY CHECK RESULTS
Scope: [backend|frontend|all]
Mode: [check|fix]
============================================

BACKEND (Python)
----------------
Ruff:     [PASS|FAIL] X issues (Y fixed)
Black:    [PASS|FAIL] X files need formatting
Type:     [PASS|SKIP] X errors

FRONTEND (TypeScript)
---------------------
ESLint:   [PASS|FAIL] X errors, Y warnings
TypeScript: [PASS|FAIL] X type errors
Prettier: [PASS|FAIL] X files need formatting

============================================
SUMMARY
============================================
Total Issues: X
Auto-fixed:   Y
Remaining:    Z

[PASS] Ready for commit
-- or --
[FAIL] Fix issues before committing
```

## Common Issues & Fixes

### Backend
| Issue | Auto-fixable | Manual Fix |
|-------|--------------|------------|
| Unused imports | Yes (ruff) | Remove import |
| Line too long | No | Break line |
| Missing docstring | No | Add docstring |
| Type hint missing | No | Add type hint |

### Frontend
| Issue | Auto-fixable | Manual Fix |
|-------|--------------|------------|
| Unused variable | Yes (eslint) | Remove or prefix with _ |
| Missing dependency | No | Add to useEffect deps |
| Type error | No | Fix type definition |
| Import order | Yes (prettier) | Auto-fix |

## Error Handling
- If linter not installed, show installation command
- Continue checking other tools if one fails
- Report partial results

## Related Commands
- After fixing: `/pre-deploy` to run full checks
- For security: `/security-review`

## Example
```bash
# Check everything
/lint

# Check and fix backend only
/lint backend --fix

# Check frontend only
/lint frontend
```
