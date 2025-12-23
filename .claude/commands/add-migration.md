---
allowed-tools: Read, Edit, Write, Bash(alembic:*), Bash(cd:*), Glob
description: Create Alembic database migration with validation
argument-hint: <migration-description>
---

## Task
Create an Alembic migration: "$ARGUMENTS"

## Workflow

### Step 1: Pre-Migration Checks
Verify database state before creating migration:

```bash
# Check current migration status
cd backend && alembic current

# Check for pending migrations
cd backend && alembic check 2>&1 || echo "May need attention"

# List recent migrations
cd backend && ls -la alembic/versions/ | tail -10
```

### Step 2: Review Model Changes
Analyze what models changed:
- Read `@backend/app/db/models/` for new or modified models
- Compare with existing migrations in `@backend/alembic/versions/`
- Identify: New tables, altered columns, new indexes, foreign keys

### Step 3: Generate Migration
```bash
cd backend && alembic revision --autogenerate -m "$ARGUMENTS"
```

### Step 4: Review Generated Migration
Read the generated migration file and verify:

**Check upgrade() function:**
- Creates correct table(s)
- Adds correct columns with types
- Includes indexes where needed
- Foreign key constraints correct
- Default values appropriate

**Check downgrade() function:**
- Reverses all changes
- Drops tables/columns in correct order
- Handles data loss warnings

### Step 5: Common Issues to Fix

**Missing imports:**
```python
# Add if using UUID columns
from sqlalchemy.dialects.postgresql import UUID

# Add if using Enum
from sqlalchemy import Enum
import enum
```

**Data migration needed:**
```python
def upgrade():
    # Schema change
    op.add_column('table', sa.Column('new_col', sa.String()))

    # Data migration
    connection = op.get_bind()
    connection.execute(
        sa.text("UPDATE table SET new_col = 'default' WHERE new_col IS NULL")
    )

    # Make NOT NULL after data populated
    op.alter_column('table', 'new_col', nullable=False)
```

**Destructive changes:**
```python
# DANGEROUS: Dropping columns loses data
op.drop_column('table', 'column')  # ⚠️ Data loss!

# SAFER: Rename first, drop later
op.alter_column('table', 'old_name', new_column_name='deprecated_old_name')
```

### Step 6: Test Migration Locally

```bash
# Apply migration
cd backend && alembic upgrade head

# Verify it worked
cd backend && alembic current

# Test downgrade (if safe)
cd backend && alembic downgrade -1

# Re-apply
cd backend && alembic upgrade head
```

### Step 7: Conflict Resolution

If autogenerate fails due to conflicts:

```bash
# Show migration history
cd backend && alembic history --verbose

# Merge conflicting heads
cd backend && alembic merge heads -m "merge_migration_heads"

# Or manually resolve:
# 1. Edit migration file
# 2. Update down_revision to correct parent
# 3. Verify with: alembic history
```

## Migration Best Practices

| Do | Don't |
|-----|-------|
| Use descriptive message | Use "update" or "changes" |
| Test downgrade() | Skip downgrade testing |
| Add indexes for FK columns | Ignore query performance |
| Use nullable=True initially | Force NOT NULL on new columns |
| Backup before production | Run untested migrations |

## Output
- Generated: `backend/alembic/versions/{revision}_*.py`
- Verified: upgrade() and downgrade() functions

## Error Handling

**"Target database is not up to date"**
```bash
cd backend && alembic upgrade head
# Then retry migration generation
```

**"Can't locate revision"**
```bash
# Check for broken chain
cd backend && alembic history
# May need to delete orphaned migration files
```

**"Multiple heads"**
```bash
cd backend && alembic heads
cd backend && alembic merge heads -m "merge_heads"
```

## Related Commands
- Before migration: `/add-db-model` to create model
- After migration: `/pre-deploy` before deploying
- For rollback: `/db-manage migrate-down`

## Example
```
/add-migration add_notification_table
```
Creates migration for notification table with proper validation.
