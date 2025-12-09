# Add Database Migration

Create an Alembic migration for database schema changes.

## Migration Description
$ARGUMENTS

## Instructions

### 1. Understand Current Schema

Review existing models in `backend/app/db/models/`:
- `user.py` - User model
- `job.py` - ETLJob, JobLog models
- `sql_script.py` - SQLScript model
- `config.py` - Config (key-value) model

### 2. Create or Modify Model

If adding new model, create in `backend/app/db/models/`:

```python
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.db.base import Base

class NewModel(Base):
    __tablename__ = "table_name"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    metadata_json = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Foreign key example
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))

    # Relationship example
    user = relationship("User", back_populates="new_models")
```

### 3. Register Model

Update `backend/app/db/models/__init__.py`:

```python
from app.db.models.new_model import NewModel
```

Update `backend/app/db/base.py` if needed for imports.

### 4. Generate Migration

```bash
cd backend

# Activate virtual environment
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Generate migration
alembic revision --autogenerate -m "Add {description}"
```

### 5. Review Generated Migration

Check the file in `backend/alembic/versions/`:

```python
"""Add {description}

Revision ID: xxxx
Revises: yyyy
Create Date: ...
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'xxxx'
down_revision = 'yyyy'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Verify generated operations
    op.create_table(
        'table_name',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        # ... other columns
    )

def downgrade() -> None:
    # Verify rollback is complete
    op.drop_table('table_name')
```

### 6. Test Migration

```bash
# Apply migration
alembic upgrade head

# Verify in database
# psql -U p1lending -d p1lending_etl -c "\d table_name"

# Test rollback
alembic downgrade -1
alembic upgrade head
```

### 7. Production Deployment

In Docker:
```bash
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## Common Migration Operations

### Add Column
```python
op.add_column('table_name', sa.Column('new_column', sa.String(100)))
```

### Rename Column
```python
op.alter_column('table_name', 'old_name', new_column_name='new_name')
```

### Add Index
```python
op.create_index('ix_table_column', 'table_name', ['column'])
```

### Add Foreign Key
```python
op.create_foreign_key('fk_name', 'source_table', 'target_table', ['source_col'], ['target_col'])
```

### Add Enum Type (for PostgreSQL)
```python
# In upgrade
jobtype = postgresql.ENUM('type1', 'type2', name='enumname')
jobtype.create(op.get_bind())

# In downgrade
op.execute('DROP TYPE enumname')
```

## Naming Conventions

- Migration files: `{number}_{description}.py` (auto-generated)
- Table names: snake_case plural (`etl_jobs`)
- Column names: snake_case (`created_at`)
- Indexes: `ix_{table}_{column}`
- Foreign keys: `fk_{table}_{column}_{ref_table}`

## Output

1. Create/modify the model file
2. Generate the migration
3. Review and fix any issues in generated migration
4. Provide test commands
5. Document any manual data migration needed
