# CI Workflow Rule

## After Every Push

**ALWAYS wait for CI to complete and fix any failures before considering work done.**

### Required Steps

1. **Push changes** to remote
2. **Check CI status** immediately:
   ```bash
   gh run list --branch <branch> --limit 1
   ```
3. **Wait for completion** (watch mode):
   ```bash
   gh run watch <run-id>
   ```
4. **If CI fails**, view logs and fix:
   ```bash
   gh run view <run-id> --log-failed
   ```
5. **Commit fixes** and repeat until CI passes

### CI Jobs to Monitor

| Job | What it checks |
|-----|----------------|
| `backend-lint` | Ruff + Black formatting |
| `backend-test` | pytest with PostgreSQL/Redis |
| `frontend-lint` | ESLint + TypeScript build |
| `security-scan` | Trivy + Bandit |

### Common Failures

- **TypeScript errors**: Run `npm run build` locally first
- **Lint errors**: Run `/lint all --fix` before committing
- **Test failures**: Run `pytest` or `npm test` locally
- **Import errors**: Check for missing dependencies

### NEVER DO

- Push and walk away without checking CI
- Consider a task complete if CI is failing
- Ignore CI failures as "flaky tests"

### ALWAYS DO

- Wait for CI after every push
- Fix failures immediately
- Re-run CI after fixes to confirm
