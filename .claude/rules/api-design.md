---
paths: backend/app/api/**/*.py
---

# API Design Rules

## Endpoint Structure
- Use RESTful naming: `/api/v1/resource` (plural nouns)
- HTTP methods: GET (read), POST (create), PUT (update), DELETE (remove)
- Return appropriate status codes: 200, 201, 400, 401, 403, 404, 500

## Request/Response
- Use Pydantic schemas for all request bodies
- Include response_model in endpoint decorators
- Document with OpenAPI docstrings

## Authentication
- All endpoints require JWT auth unless explicitly public
- Use `Depends(get_current_user)` for protected routes
- Include user context in audit logs

## Error Handling
- Use HTTPException with appropriate status codes
- Include meaningful error messages
- Log errors with context (user_id, request_id)
