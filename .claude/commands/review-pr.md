# Review Pull Request

Perform a thorough code review of a pull request.

## PR Reference
$ARGUMENTS

(PR number, URL, or branch name to review)

## Instructions

### 1. Gather PR Information

```bash
# If PR number provided
gh pr view <number>
gh pr diff <number>

# If branch name provided
git fetch origin
git diff main..origin/<branch>
```

### 2. Review Checklist

#### Code Quality
- [ ] **Readability**: Is the code easy to understand?
- [ ] **Naming**: Do variable/function names follow conventions?
  - Python: `snake_case` for functions/vars, `PascalCase` for classes
  - TypeScript: `camelCase` for vars, `PascalCase` for components
- [ ] **Complexity**: Could any complex logic be simplified?
- [ ] **DRY**: Is there duplicated code that should be extracted?

#### Project Patterns (from CLAUDE.md)
- [ ] **Backend**: Service layer pattern followed (logic in `services/`, not endpoints)?
- [ ] **Backend**: Dependency injection via `deps.py`?
- [ ] **Backend**: Async/await for all DB operations?
- [ ] **Backend**: Pydantic schemas for validation?
- [ ] **Frontend**: TanStack Query for server state?
- [ ] **Frontend**: Zustand for client state (if complex)?
- [ ] **Frontend**: MUI components styled with `sx` prop?

#### Security
- [ ] No hardcoded secrets or credentials
- [ ] Authentication enforced on protected endpoints
- [ ] Input validation present
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities in frontend

#### Testing
- [ ] New code has tests (or documented why not)
- [ ] Existing tests still pass
- [ ] Manual testing instructions provided

#### Documentation
- [ ] API changes documented in docstrings
- [ ] Complex logic has comments
- [ ] README/CLAUDE.md updated if architecture changed
- [ ] env.example updated if new env vars

#### Database
- [ ] Migrations included for schema changes
- [ ] Migration is reversible (downgrade works)
- [ ] Indexes added for filtered/sorted columns

#### Performance
- [ ] No N+1 query issues
- [ ] Appropriate pagination for list endpoints
- [ ] Large data sets handled in batches

### 3. Provide Feedback

For each issue found, format as:

```
📍 **File**: `path/to/file.py:42`

**Issue**: Description of the problem

**Suggestion**:
```python
# Suggested fix
```

**Severity**: 🔴 Blocker | 🟡 Needs Discussion | 🟢 Nitpick
```

### 4. Summary Template

```markdown
## Review Summary

### Overall Assessment
[Approve / Request Changes / Comment]

### Highlights
- 👍 Good things about this PR

### Required Changes
- 🔴 Must fix before merge

### Suggestions
- 🟡 Recommended improvements

### Nitpicks
- 🟢 Optional style improvements

### Questions
- ❓ Clarifications needed

### Testing Notes
- How I tested / what should be tested
```

### 5. Review Focus by File Type

#### `backend/app/api/v1/endpoints/*.py`
- Auth decorators present
- Response models defined
- Error handling with HTTPException
- Input validated via Pydantic

#### `backend/app/services/etl/*.py`
- Error handling for external APIs
- Logging with `etl_logger`
- Rate limiting considerations
- Batch processing for large data

#### `frontend/src/pages/*.tsx`
- Loading states handled
- Error states handled
- TanStack Query used correctly
- Auth check if protected

#### `docker-compose*.yml`
- Version pinning
- Volume mounts correct
- Health checks present

## Output

1. List all files changed with brief description
2. Provide detailed feedback for each significant file
3. Summarize with overall assessment
4. Recommend: Approve, Request Changes, or Needs Discussion
