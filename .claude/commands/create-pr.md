# Create Pull Request

Create a well-structured pull request for the current changes.

## PR Context
$ARGUMENTS

(Optional: Additional context about the changes, ticket number, etc.)

## Instructions

### 1. Analyze Changes

First, understand what's being changed:

```bash
# Check current branch
git branch --show-current

# See all changes
git status
git diff --stat

# View commit history on this branch
git log main..HEAD --oneline
```

### 2. Categorize Changes

Group changes by type:
- **Features**: New functionality
- **Fixes**: Bug fixes
- **Refactor**: Code improvements without behavior change
- **Docs**: Documentation updates
- **Chore**: Dependencies, configs, tooling

### 3. Create PR Title

Format: `<type>: <concise description>`

Examples:
- `feat: Add preview confirmation before ETL execution`
- `fix: Resolve KeyError in cached_address filtering`
- `refactor: Extract phone normalization to helper method`

### 4. Write PR Description

Use this template:

```markdown
## Summary

[1-2 sentence overview of what this PR does]

## Changes

- [Bullet point describing each significant change]
- [Reference files changed: `backend/app/services/etl/engine.py`]
- [Note any breaking changes]

## Testing

- [ ] Tested locally with development server
- [ ] Verified ETL job execution works
- [ ] Checked frontend functionality
- [ ] [Additional test steps specific to this PR]

## Screenshots

[If frontend changes, add before/after screenshots]

## Related Issues

- Closes #[issue number]
- Related to #[issue number]

## Checklist

- [ ] Code follows project patterns (see CLAUDE.md)
- [ ] No hardcoded credentials or secrets
- [ ] Database migrations included (if needed)
- [ ] env.example updated (if new env vars)
```

### 5. Pre-PR Checks

Verify before creating PR:

```bash
# Ensure no uncommitted changes
git status

# Verify build passes
cd frontend && npm run build && cd ..

# Check for obvious issues
cd backend && python -m py_compile app/main.py

# Ensure branch is up to date with main
git fetch origin
git log HEAD..origin/main --oneline  # Should be empty or minimal
```

### 6. Create PR

Using GitHub CLI:

```bash
gh pr create \
  --title "feat: Your PR title" \
  --body "$(cat <<EOF
## Summary

Description here.

## Changes

- Change 1
- Change 2

## Testing

- [ ] Local testing complete

## Checklist

- [ ] Follows project patterns
- [ ] No secrets committed
EOF
)"
```

Or push and create via web:
```bash
git push -u origin $(git branch --show-current)
# Then use GitHub web interface
```

### 7. Post-PR Actions

After creating:
- [ ] Add reviewers
- [ ] Add labels (bug, feature, etc.)
- [ ] Link to related issues
- [ ] Request review in team channel

## Commit Message Guidelines

For commits in this project:
- Use imperative mood: "Add feature" not "Added feature"
- First line: 50 chars max, summary
- Body: Wrap at 72 chars, explain what and why

Examples from recent history:
- `Fix KeyError 'cached_address' in ETL engine filtering`
- `Add script to remove processed records from Google Sheets`
- `Limit preview table display to 100 rows to save RAM`

## Output

1. Analyze all changes on the branch
2. Generate appropriate PR title
3. Generate complete PR description
4. Provide the `gh pr create` command ready to run
5. List any additional actions needed
