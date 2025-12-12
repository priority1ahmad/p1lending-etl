---
allowed-tools: Read, Edit, Write, Glob, Grep
description: Create a new FastAPI endpoint with proper structure
argument-hint: <endpoint-name> <http-method>
---

## Task
Create a new API endpoint named `$1` with HTTP method `$2`.

## Requirements
1. Create endpoint in `backend/app/api/v1/endpoints/$1.py`
2. Follow existing patterns from @backend/app/api/v1/endpoints/jobs.py
3. Use async/await for all database operations
4. Include Pydantic request/response schemas in `backend/app/schemas/`
5. Add dependency injection for authentication from `deps.py`
6. Register router in `backend/app/api/v1/router.py`
7. Add appropriate error handling with HTTPException
8. Include docstrings with OpenAPI documentation

## Existing patterns
- Auth dependency: `current_user: User = Depends(get_current_user)`
- DB session: `db: AsyncSession = Depends(get_db)`
