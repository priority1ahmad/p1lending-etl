---
paths: **/*.py, **/*.ts, **/*.tsx
---

# Code Style Rules

## Python

### Naming
- Functions/variables: `snake_case`
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Private: `_leading_underscore`
- Module-level: `lowercase`

### Formatting
- Line length: 100 characters max
- Indentation: 4 spaces
- Imports: sorted (isort), grouped (stdlib, third-party, local)
- Quotes: double quotes for strings

### Type Hints
```python
# Always use type hints
def process_data(
    items: list[dict[str, Any]],
    limit: int = 100,
    *,
    include_metadata: bool = False,
) -> tuple[list[dict], int]:
    """Process items and return results with count."""
    ...
```

### Async/Await
```python
# Use async for all I/O operations
async def fetch_data(db: AsyncSession) -> list[Model]:
    result = await db.execute(select(Model))
    return result.scalars().all()

# Use asyncio.gather for parallel operations
results = await asyncio.gather(
    fetch_users(),
    fetch_orders(),
    return_exceptions=True,
)
```

### Error Handling
```python
# Specific exceptions, not bare except
try:
    result = await api_call()
except httpx.HTTPStatusError as e:
    logger.error(f"API error: {e.response.status_code}")
    raise
except httpx.TimeoutException:
    logger.warning("Request timed out, retrying...")
    raise
```

### Docstrings
```python
def complex_function(param1: str, param2: int) -> dict:
    """
    Brief description of function.

    Args:
        param1: Description of param1
        param2: Description of param2

    Returns:
        Description of return value

    Raises:
        ValueError: When param1 is empty
    """
```

## TypeScript

### Naming
- Functions/variables: `camelCase`
- Components/interfaces/types: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- File names: `PascalCase.tsx` for components, `camelCase.ts` for utils

### Formatting
- Line length: 100 characters max
- Indentation: 2 spaces
- Semicolons: required
- Quotes: single quotes

### Type Definitions
```typescript
// Prefer interfaces for objects
interface UserData {
  id: string;
  name: string;
  email: string;
}

// Use type for unions/intersections
type Status = 'pending' | 'active' | 'completed';
type UserWithStatus = UserData & { status: Status };

// Export types from dedicated files
export type { UserData, Status };
```

### React Components
```typescript
// Functional components with explicit types
interface Props {
  title: string;
  onSubmit: (data: FormData) => void;
  children?: React.ReactNode;
}

export default function MyComponent({ title, onSubmit, children }: Props) {
  // Component logic
}
```

### Imports
```typescript
// Group imports: React, third-party, local
import { useState, useEffect } from 'react';

import { Box, Button } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/stores/authStore';
import { fetchData } from '@/services/api';
```

## Examples in Codebase
- Python async patterns: `backend/app/services/etl/engine.py`
- TypeScript components: `frontend/src/pages/Dashboard.tsx`
- Type definitions: `frontend/src/types/`

## Tools
- Python: Black (formatter), Ruff (linter), mypy (type checker)
- TypeScript: Prettier (formatter), ESLint (linter)

## NEVER DO
- Use `any` type without justification
- Ignore linter warnings
- Mix tabs and spaces
- Use magic numbers without constants

## ALWAYS DO
- Run formatters before committing
- Use const over let when possible
- Prefer early returns for readability
- Keep functions focused and small
