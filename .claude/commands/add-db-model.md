---
allowed-tools: Read, Write, Edit, Glob, Bash(alembic:*)
description: Create SQLAlchemy model, Pydantic schemas, and Alembic migration
argument-hint: <model-name> [fields...]
---

## Task
Create a complete database model stack: SQLAlchemy model, Pydantic schemas, and Alembic migration in one command.

## Supported Arguments
- `<model-name>` - Name of the model (e.g., "Notification", "AuditLog")
- `[fields...]` - Optional field definitions (e.g., "title:str" "count:int" "is_active:bool")

## Workflow

### Step 1: Analyze Existing Patterns
Read reference implementations:
- `@backend/app/db/models/job.py` - Full model with relationships
- `@backend/app/db/models/phone_blacklist.py` - Simple model
- `@backend/app/schemas/job.py` - Pydantic schemas
- `@backend/alembic/versions/` - Migration patterns

Key patterns:
- UUID primary keys
- `created_at`, `updated_at` timestamps
- SQLAlchemy 2.0 style with `Mapped` type hints
- Pydantic v2 schemas

### Step 2: Create SQLAlchemy Model
Create `backend/app/db/models/{model_name}.py`:

```python
"""
{ModelName} database model.
"""
from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy import String, Boolean, Integer, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class {ModelName}(Base):
    """
    {ModelName} model for storing {description}.
    """
    __tablename__ = "{table_name}"

    # Primary key
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4())
    )

    # Fields (customize based on arguments)
    # ... generated fields ...

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    def __repr__(self) -> str:
        return f"<{ModelName}(id={self.id})>"
```

### Step 3: Create Pydantic Schemas
Create `backend/app/schemas/{model_name}.py`:

```python
"""
{ModelName} Pydantic schemas for API validation.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class {ModelName}Base(BaseModel):
    """Base schema with common fields."""
    # ... common fields ...
    pass


class {ModelName}Create({ModelName}Base):
    """Schema for creating a new {model_name}."""
    pass


class {ModelName}Update(BaseModel):
    """Schema for updating a {model_name}. All fields optional."""
    # ... optional fields ...
    pass


class {ModelName}Response({ModelName}Base):
    """Schema for {model_name} responses."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime


class {ModelName}List(BaseModel):
    """Schema for paginated {model_name} list."""
    items: list[{ModelName}Response]
    total: int
    page: int
    page_size: int
```

### Step 4: Update Model Imports
Edit `backend/app/db/models/__init__.py`:
```python
from app.db.models.{model_name} import {ModelName}
```

### Step 5: Update Schema Imports
Edit `backend/app/schemas/__init__.py`:
```python
from app.schemas.{model_name} import (
    {ModelName}Create,
    {ModelName}Update,
    {ModelName}Response,
    {ModelName}List,
)
```

### Step 6: Generate Alembic Migration
```bash
cd backend && alembic revision --autogenerate -m "Add {model_name} table"
```

### Step 7: Review Migration
Read the generated migration file and verify:
- Correct table name
- All columns present
- Proper indexes
- Foreign keys if any

## Output
- Created: `backend/app/db/models/{model_name}.py`
- Created: `backend/app/schemas/{model_name}.py`
- Updated: `backend/app/db/models/__init__.py`
- Updated: `backend/app/schemas/__init__.py`
- Generated: `backend/alembic/versions/xxx_add_{model_name}_table.py`

## Field Type Mapping
| Argument | SQLAlchemy | Pydantic |
|----------|------------|----------|
| `str` | `String(255)` | `str` |
| `text` | `Text` | `str` |
| `int` | `Integer` | `int` |
| `bool` | `Boolean` | `bool` |
| `datetime` | `DateTime(timezone=True)` | `datetime` |
| `uuid` | `UUID(as_uuid=False)` | `str` |
| `float` | `Float` | `float` |

## Error Handling
- If model already exists, warn and ask before overwriting
- If migration fails, provide rollback instructions
- Validate field type syntax

## Related Commands
- After creating model: `/add-endpoint` to expose via API
- For full stack: `/add-full-stack-feature`

## Example
```
/add-db-model Notification title:str message:text is_read:bool user_id:uuid
```
Creates Notification model with specified fields, schemas, and migration.
