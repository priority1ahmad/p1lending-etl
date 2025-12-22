# Weekly Maintenance Workflow

Run weekly maintenance tasks.

## Tasks

### 1. Security Audit
```bash
npm audit
pip-audit 2>/dev/null || echo "pip-audit not installed"
```

### 2. Dependency Updates
```bash
npm outdated
pip list --outdated 2>/dev/null || echo "No pip outdated"
```

### 3. Code Quality
```bash
npm run lint -- --max-warnings 0
```

### 4. Test Coverage
```bash
npm run test -- --coverage
```

### 5. Documentation Review
- Check README.md is current
- Verify CLAUDE.md reflects actual practices
- Update API documentation if needed

### 6. Storybook Health
```bash
npm run build-storybook
```

### 7. Git Cleanup
```bash
git fetch --prune
git branch --merged main | grep -v main | xargs git branch -d 2>/dev/null || true
```

## Output
Generate weekly report in `docs/weekly-reports/YYYY-MM-DD.md`
