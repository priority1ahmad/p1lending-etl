---
allowed-tools: Read, Edit, Write, Glob, Grep, TodoWrite, Bash(git:*)
description: Create complete full-stack feature (backend + frontend)
argument-hint: <feature-name>
---

## Task
Create a complete full-stack feature for **$1** with database schema, backend API, and frontend UI.

## Context
This command scaffolds an entire feature stack following P1Lending ETL patterns:
- **Backend**: Alembic migration → SQLAlchemy model → Pydantic schemas → FastAPI endpoint
- **Frontend**: React page → API client → Route registration
- Follows existing patterns from jobs/scripts modules

## Implementation Steps

### Phase 1: Backend - Database Layer

1. **Read existing patterns** to understand the current architecture:
   - Read `backend/app/db/models/job.py` (reference for model structure)
   - Read `backend/app/db/models/sql_script.py` (reference for relationships)
   - List existing migrations to determine next version number

2. **Create Alembic migration**:
   - File: `backend/alembic/versions/XXX_add_$1.py` (use next sequential number)
   - Include:
     - `id` column (UUID primary key with server_default)
     - `created_at` and `updated_at` timestamps
     - Foreign key to `users` table for `created_by_id`
     - Appropriate indexes
   - Pattern from: `backend/alembic/versions/003_add_sql_scripts.py`

3. **Create SQLAlchemy model**:
   - File: `backend/app/db/models/$1.py`
   - Import Base from `app.db.base`
   - Define `$1` class (singular, PascalCase)
   - Table name: `$1s` (plural, snake_case)
   - Include `__repr__` method
   - Pattern from: `backend/app/db/models/job.py`

4. **Update model imports**:
   - Edit `backend/app/db/models/__init__.py`
   - Add: `from .$ lowercase($1) import $1`

### Phase 2: Backend - API Layer

5. **Create Pydantic schemas**:
   - File: `backend/app/schemas/$1.py`
   - Define schemas:
     - `$1Base` (shared fields)
     - `$1Create` (for POST requests)
     - `$1Update` (for PUT/PATCH requests)
     - `$1InDB` (with id, created_at, updated_at)
     - `$1` (public response schema)
   - Pattern from: `backend/app/schemas/sql_script.py`

6. **Create FastAPI endpoint**:
   - File: `backend/app/api/v1/endpoints/$1.py`
   - Create APIRouter instance
   - Implement endpoints:
     - `GET /` - List all (with pagination)
     - `POST /` - Create new
     - `GET /{id}` - Get by ID
     - `PUT /{id}` - Update
     - `DELETE /{id}` - Delete
   - Use dependencies:
     - `current_user: User = Depends(get_current_user)`
     - `db: AsyncSession = Depends(get_db)`
   - Pattern from: `backend/app/api/v1/endpoints/sql_scripts.py`

7. **Register router**:
   - Edit `backend/app/api/v1/router.py`
   - Import: `from app.api.v1.endpoints import $1`
   - Add: `api_router.include_router($1.router, prefix="/$1s", tags=["$1s"])`

### Phase 3: Frontend - UI Layer

8. **Create API client functions**:
   - File: `frontend/src/services/api/$1.ts`
   - Import axios instance from `@/utils/api`
   - Define TypeScript interfaces matching backend schemas
   - Implement functions:
     - `get$1s()` - Fetch list
     - `get$1(id)` - Fetch single
     - `create$1(data)` - Create new
     - `update$1(id, data)` - Update existing
     - `delete$1(id)` - Delete
   - Pattern from: `frontend/src/services/api/sqlScripts.ts`

9. **Create React page component**:
   - File: `frontend/src/pages/$1.tsx` (PascalCase)
   - Import necessary MUI components (Box, Card, Button, Table, etc.)
   - Use TanStack Query for data fetching:
     - `useQuery` for fetching list
     - `useMutation` for create/update/delete
   - Include:
     - Data table with MUI Table components
     - Create/Edit dialog with form
     - Delete confirmation dialog
     - Loading states and error handling
   - Pattern from: `frontend/src/pages/SqlFiles.tsx`

10. **Register frontend route**:
    - Edit `frontend/src/App.tsx`
    - Import the new page component
    - Add route in ProtectedRoute section:
      ```tsx
      <Route path="/$1s" element={<$1 />} />
      ```

11. **Add navigation link** (optional):
    - Edit `frontend/src/components/layout/Sidebar.tsx`
    - Add ListItem with navigation to `/$1s`
    - Use appropriate MUI icon

### Phase 4: Finalization

12. **Create TodoWrite list** for manual steps:
    ```
    - [ ] Run migration: `cd backend && alembic upgrade head`
    - [ ] Test backend endpoints with curl or Postman
    - [ ] Write unit tests in `backend/tests/test_$1.py`
    - [ ] Write frontend component tests
    - [ ] Update API documentation if needed
    - [ ] Add to CHANGELOG.md
    ```

13. **Run auto-formatting**:
    - Backend: `cd backend && ruff check --fix . && black .`
    - Frontend: `cd frontend && npm run lint:fix`

14. **Show summary** of created files and next steps

## Requirements

- Feature name should be singular (e.g., "notification", "report")
- All async operations must use async/await
- Follow existing authentication patterns
- Include proper error handling with HTTPException
- Use TypeScript strict mode on frontend
- Follow MUI design system for UI components

## Example Usage

```bash
/add-full-stack-feature notification
```

Creates:
- Migration: `backend/alembic/versions/007_add_notifications.py`
- Model: `backend/app/db/models/notification.py`
- Schemas: `backend/app/schemas/notification.py`
- Endpoint: `backend/app/api/v1/endpoints/notification.py`
- API Client: `frontend/src/services/api/notification.ts`
- Page: `frontend/src/pages/Notification.tsx`
- Routes registered in both backend and frontend

## Important Notes

- Always read existing files first to understand patterns
- Keep naming consistent: singular model, plural table/routes
- Don't modify database directly - only through migrations
- Test backend endpoints before frontend integration
- Use TodoWrite to track manual testing and documentation steps
