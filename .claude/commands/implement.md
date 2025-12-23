# Implement Command

You are helping the user implement a feature following the Universal Development Process (see `.claude/workflows/DEVELOPMENT_PROCESS.md`).

## Your Task

Execute **Phase 5-6** of the development process:
- Phase 5: Implementation
- Phase 6: Code Review Preparation

## Prerequisites

- Implementation plan approved (`.claude/plans/ISSUE-{number}-{slug}.md`)
- Prototype approved (if applicable)
- GitHub issue in "Ready for Implementation" status

## Process

### Step 1: Load Context
Read the implementation plan and understand:
- Files to create/modify
- Backend changes needed
- Frontend changes needed
- Testing requirements
- Documentation requirements

### Step 2: Create Feature Branch
```bash
git checkout staging  # or main if no staging
git pull origin staging
git checkout -b feature/ISSUE-{number}-{short-description}
```

Branch naming:
- `feature/ISSUE-{number}-{slug}` for new features
- `bugfix/ISSUE-{number}-{slug}` for bug fixes
- `enhancement/ISSUE-{number}-{slug}` for enhancements

### Step 3: Implement Backend Changes

Follow this order:

1. **Database Migration** (if needed):
   ```bash
   /add-migration {description}
   ```
   - Create migration file
   - Test upgrade
   - Test downgrade (rollback)

2. **Models** (if needed):
   - Create/modify SQLAlchemy models
   - Add relationships
   - Add validation
   - Test in Python shell

3. **Schemas** (if needed):
   - Create/modify Pydantic schemas
   - Add validation rules
   - Add examples for docs

4. **Services** (if needed):
   - Create/modify service layer
   - Implement business logic
   - Add error handling
   - Add logging
   - Use existing patterns

5. **API Endpoints** (if needed):
   ```bash
   /add-endpoint {name} {method}
   ```
   - Create endpoint
   - Add authentication
   - Add authorization
   - Add input validation
   - Add error responses
   - Add to router

6. **Test Backend**:
   - Run locally: `uvicorn app.main:app --reload`
   - Test endpoints with curl/Postman
   - Verify database changes
   - Check logs

### Step 4: Implement Frontend Changes

Follow this order:

1. **API Client**:
   - Add functions to `frontend/src/services/api/{module}.ts`
   - Use existing patterns (axios, error handling)
   - Add TypeScript types

2. **State Management** (if needed):
   - Create/modify Zustand store
   - Add state and actions
   - Test in React DevTools

3. **Components**:
   - Create components (may already exist from prototype)
   - Implement real logic (replace mock data)
   - Connect to API using TanStack Query
   - Add error handling
   - Add loading states

4. **Storybook Stories** (if not done in prototype):
   - Create stories for all components
   - Test all variants
   - Verify styling

5. **Pages**:
   - Create/modify pages
   - Add to routing
   - Implement ProtectedRoute if auth required
   - Test navigation

6. **Test Frontend**:
   - Run dev server: `npm run dev`
   - Access at: http://173.255.232.167:5173
   - Test all user flows
   - Test error cases
   - Test responsive design

### Step 5: Write Tests

**Backend Tests:**
```bash
cd backend
pytest tests/ -v --cov=app
```

Create:
- `tests/unit/test_{module}.py` - Unit tests
- `tests/integration/test_{feature}.py` - Integration tests

**Target:** >80% coverage for new code

**Frontend Tests:**
```bash
cd frontend
npm test
```

Create:
- `src/components/{path}/__tests__/{Component}.test.tsx`

Test:
- Component rendering
- User interactions
- Error states
- Loading states

### Step 6: Lint & Format
```bash
/lint all --fix
```

Or manually:
```bash
# Backend
cd backend
ruff check . --fix
black .

# Frontend
cd frontend
npm run lint -- --fix
```

### Step 7: Update Documentation

**CHANGELOG.md:**
Add entry under `## [Unreleased]`:
```markdown
### Added
- [ISSUE-{number}] {Feature description}
  - {Detail 1}
  - {Detail 2}
```

**DOCUMENTATION.md:**
Update sections:
- Architecture (if changed)
- API Endpoints (if added)
- User Guide (if user-facing)
- Configuration (if env vars added)

**Code Comments:**
- Add docstrings to all new functions/classes
- Add JSDoc comments to TypeScript functions
- Add inline comments for complex logic

### Step 8: Pre-Commit Verification

Run checklist:
- [ ] All acceptance criteria met
- [ ] Code follows project patterns
- [ ] Tests written and passing (>80% coverage)
- [ ] Linting passes (`/lint all`)
- [ ] TypeScript builds without errors
- [ ] No console.log or debug code
- [ ] No hardcoded secrets or credentials
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] CHANGELOG.md updated
- [ ] DOCUMENTATION.md updated
- [ ] No breaking changes (or documented if yes)

### Step 9: Commit Changes

Use structured commit messages:
```bash
git add .
git commit -m "[ISSUE-{number}] {Type}: {Brief description}

- {Change 1}
- {Change 2}
- {Change 3}

Addresses #{issue-number}"
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

### Step 10: Push and Create PR

```bash
git push origin feature/ISSUE-{number}-{slug}
```

Create Pull Request:
```bash
gh pr create --title "[ISSUE-{number}] {Description}" --body "$(cat <<'EOF'
## Summary
{Brief overview}

## Changes
- {Change 1}
- {Change 2}

## Testing
- [x] Unit tests pass
- [x] Integration tests pass
- [x] Manual testing complete
- [x] Linting passes

## Screenshots
{If UI changes}

## Breaking Changes
{None or list}

## Related Issues
Closes #{issue-number}

## Checklist
- [x] Tests written (>80% coverage)
- [x] Documentation updated
- [x] CHANGELOG.md updated
- [x] No secrets committed
- [x] Code follows project patterns
- [x] PR description complete

EOF
)"
```

### Step 11: Mark Complete

Update GitHub issue:
```markdown
## Implementation Complete

### Branch
`feature/ISSUE-{number}-{slug}`

### Pull Request
#{pr-number}

### Changes Summary
- Backend: {summary}
- Frontend: {summary}
- Tests: {count} tests added
- Documentation: {what updated}

### Testing Results
- Backend tests: ✅ {count} passed
- Frontend tests: ✅ {count} passed
- Coverage: {percent}%
- Linting: ✅ Passed

### CI Status
{Link to CI run}

### Next Steps
- Awaiting code review
- Move to QA after approval
```

Move issue to "In Review" on project board.

## Output Format

```markdown
# Implementation Complete

## Summary
**Feature:** {Name}
**Issue:** #{number}
**Branch:** `feature/ISSUE-{number}-{slug}`
**Pull Request:** #{pr-number}

## Changes Implemented

### Backend
- Migration: `{migration_file}` - {description}
- Models: {list}
- Endpoints: {list}
- Services: {list}

### Frontend
- Components: {list}
- Pages: {list}
- API Client: {functions added}
- Stores: {stores modified}

### Tests
- Backend: {count} tests, {percent}% coverage
- Frontend: {count} tests

### Documentation
- ✅ CHANGELOG.md updated
- ✅ DOCUMENTATION.md updated
- ✅ Code comments added
- ✅ API docs updated

## Quality Checks
- ✅ All acceptance criteria met
- ✅ Tests passing (>80% coverage)
- ✅ Linting passed
- ✅ TypeScript builds clean
- ✅ No secrets committed
- ✅ Security review complete
- ✅ Performance acceptable

## Testing Evidence
```bash
# Backend
pytest --cov=app
{output}

# Frontend
npm test
{output}

# Linting
/lint all
{output}
```

## Next Steps
1. **Code review** - Assign Solutions Engineer
2. **Address feedback** - If changes requested
3. **Merge approval** - Get approval
4. **Deploy staging** - Run `/deploy-staging`

**Pull Request:** {url}

Ready for code review!
```

## Important Notes

- Follow implementation plan exactly (don't add extra features)
- Use existing slash commands (`/add-endpoint`, `/add-migration`, etc.)
- Write tests WHILE implementing (not after)
- Update documentation WHILE implementing (not after)
- Run `/lint all --fix` frequently
- Commit frequently with clear messages
- Ask for help if blocked
- Don't skip quality checks

## Example Usage

```
User: /implement 42
AI: [Loads ISSUE-42 plan]
AI: [Creates feature branch]
AI: [Implements backend, frontend, tests, docs]
AI: [Commits and pushes]
AI: [Creates PR]
AI: Implementation complete! PR #{pr-number} ready for review.
```
