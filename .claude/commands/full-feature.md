# Full Feature Implementation

**Composite Agent**: This agent chains multiple tasks to implement a complete feature end-to-end.

## Feature Description
$ARGUMENTS

---

## Workflow Overview

This composite agent executes the following steps in order:

```
┌─────────────────────────────────────────────────────────────┐
│                    FULL FEATURE WORKFLOW                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: PLAN                                               │
│  ├── Analyze feature requirements                           │
│  ├── Identify affected files                                │
│  └── Create implementation checklist                        │
│                                                             │
│  Step 2: BACKEND (if needed)                                │
│  ├── /add-endpoint - Create API endpoints                   │
│  ├── /add-migration - Create database changes               │
│  └── /add-etl-service - Add external service (if needed)    │
│                                                             │
│  Step 3: FRONTEND (if needed)                               │
│  ├── /add-react-page - Create new page                      │
│  └── Update existing components                             │
│                                                             │
│  Step 4: REVIEW                                             │
│  ├── /review-endpoint - Review new endpoints                │
│  └── /review-security - Security check                      │
│                                                             │
│  Step 5: TEST                                               │
│  └── /generate-tests - Create tests for new code            │
│                                                             │
│  Step 6: DOCUMENT                                           │
│  ├── Update CLAUDE.md if architecture changed               │
│  └── Update env.example if new env vars                     │
│                                                             │
│  Step 7: PREPARE PR                                         │
│  └── /create-pr - Generate PR description                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Planning Phase

### Analyze Requirements

Break down the feature into:
- [ ] Database changes needed
- [ ] New API endpoints
- [ ] New/modified frontend pages
- [ ] External service integrations
- [ ] Configuration changes

### Create Implementation Plan

```markdown
## Feature: {feature_name}

### Components Needed

| Component | Type | Action |
|-----------|------|--------|
| {model}.py | Model | Create |
| {endpoint}.py | Endpoint | Create |
| {Page}.tsx | Page | Create |
| ... | ... | ... |

### Dependencies

1. {First thing to implement}
2. {Second thing - depends on first}
3. ...

### Risks

- {Potential issue and mitigation}
```

---

## Step 2: Backend Implementation

### 2a. Database Model (if needed)

Execute mentally: `/add-migration {model description}`

- Create model in `backend/app/db/models/`
- Create Pydantic schemas in `backend/app/schemas/`
- Generate and run Alembic migration

### 2b. API Endpoints

Execute mentally: `/add-endpoint {endpoint description}`

- Create endpoints in `backend/app/api/v1/endpoints/`
- Register router in `backend/app/api/v1/router.py`
- Implement service layer if complex logic needed

### 2c. External Service (if needed)

Execute mentally: `/add-etl-service {service description}`

- Create service in `backend/app/services/etl/`
- Add configuration to `backend/app/core/config.py`
- Update `env.example`

---

## Step 3: Frontend Implementation

### 3a. New Page (if needed)

Execute mentally: `/add-react-page {page description}`

- Create page component in `frontend/src/pages/`
- Add route in `frontend/src/App.tsx`
- Add navigation in `frontend/src/components/layout/AppBar.tsx`

### 3b. API Integration

- Create API functions in `frontend/src/services/api/`
- Use TanStack Query for data fetching
- Add Zustand store if complex state needed

### 3c. UI Components

- Use MUI components from project patterns
- Follow existing styling conventions (`sx` prop)
- Handle loading/error states

---

## Step 4: Review Phase

### 4a. Endpoint Review

Execute mentally: `/review-endpoint {new endpoints}`

Verify:
- [ ] Auth on all protected endpoints
- [ ] Input validation via Pydantic
- [ ] Proper error handling
- [ ] Async patterns correct

### 4b. Security Review

Execute mentally: `/review-security {new code}`

Verify:
- [ ] No hardcoded secrets
- [ ] No injection vulnerabilities
- [ ] Proper authorization checks

---

## Step 5: Testing Phase

Execute mentally: `/generate-tests {new modules}`

### Backend Tests

For each new endpoint/service:
- [ ] Happy path tests
- [ ] Error case tests
- [ ] Auth tests

### Frontend Tests (optional)

For critical components:
- [ ] Render tests
- [ ] User interaction tests

---

## Step 6: Documentation

### Update CLAUDE.md

If architecture changed:
- [ ] Add new files to directory structure
- [ ] Update data flow diagrams
- [ ] Add new API endpoints

### Update env.example

If new environment variables:
- [ ] Add with example values
- [ ] Add comments explaining purpose

---

## Step 7: Prepare for PR

Execute mentally: `/create-pr {feature summary}`

- Commit all changes
- Create descriptive PR

---

## Output Format

```markdown
# Feature Implementation Complete: {feature_name}

## Summary

{Brief description of what was implemented}

## Files Created

| File | Purpose |
|------|---------|
| `path/to/file.py` | {description} |
| ... | ... |

## Files Modified

| File | Changes |
|------|---------|
| `path/to/file.py` | {what changed} |
| ... | ... |

## Database Changes

- Migration: `{migration_name}`
- Tables: {new/modified tables}

## New Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/... | ... |

## New Frontend Routes

| Path | Component | Description |
|------|-----------|-------------|
| /feature | FeaturePage | ... |

## Configuration Changes

New environment variables:
- `VAR_NAME`: {description}

## Tests Created

- `tests/test_feature.py`

## Validation Checklist

- [ ] Backend server starts without errors
- [ ] Frontend builds without errors
- [ ] All new endpoints work (test with curl)
- [ ] Frontend page renders correctly
- [ ] All tests pass
- [ ] No security issues
- [ ] Documentation updated

## PR Ready

```bash
# Create PR with:
gh pr create --title "feat: {feature_name}" --body "..."
```
```

---

## Error Handling

| Stage | Error | Resolution |
|-------|-------|------------|
| Planning | Unclear requirements | Ask clarifying questions |
| Backend | Migration fails | Check model syntax, foreign keys |
| Frontend | Build fails | Check imports, TypeScript errors |
| Testing | Tests fail | Fix implementation or test |
| Review | Security issue | Address before proceeding |

---

## Rollback Plan

If feature needs to be reverted:

1. **Database**: `alembic downgrade -1`
2. **Backend**: Revert commits
3. **Frontend**: Revert commits
4. **Config**: Remove new env vars

---

## Validation Steps

After all steps complete:

1. **Full stack test**:
   ```bash
   # Backend
   cd backend && uvicorn app.main:app --reload

   # Frontend
   cd frontend && npm run dev
   ```

2. **E2E verification**:
   - Login to app
   - Navigate to new feature
   - Test all functionality
   - Check browser console for errors

3. **API verification**:
   ```bash
   # Test each new endpoint
   curl -X ... http://localhost:8000/api/v1/...
   ```

4. **Run tests**:
   ```bash
   cd backend && pytest
   cd frontend && npm test
   ```
