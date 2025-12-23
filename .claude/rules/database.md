---
paths: backend/app/db/**/*.py, backend/app/services/**/*.py
---

# Database Rules

## SQLAlchemy Patterns
- Use async session for all database operations
- Use `async with` for transactions
- Avoid N+1 queries - use joinedload/selectinload

## Model Design
- All models inherit from Base
- Include created_at, updated_at timestamps
- Use UUID for IDs where appropriate
- Add indexes for frequently queried columns

## Migrations
- Always include downgrade() for rollback
- Test migrations on copy of production data
- Never modify committed migrations - create new ones
