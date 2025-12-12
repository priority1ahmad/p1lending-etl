---
allowed-tools: Read, Edit, Write, Bash(alembic:*)
description: Create Alembic database migration
argument-hint: <migration-description>
---

## Task
Create an Alembic migration: "$ARGUMENTS"

## Steps
1. Review current models in @backend/app/db/models/
2. Generate migration: `alembic revision --autogenerate -m "$ARGUMENTS"`
3. Review generated migration file in `backend/alembic/versions/`
4. Verify upgrade() and downgrade() functions are correct
5. Test migration locally if possible

## Conventions
- Migration messages should be descriptive
- Always include downgrade() for rollback capability
- Check for data loss in ALTER operations
