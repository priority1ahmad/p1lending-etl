---
paths: backend/tests/**/*.py, frontend/src/**/*.test.ts, frontend/src/**/*.test.tsx
---

# Testing Rules

## Python (pytest)

### Structure
- Test files: `test_*.py` or `*_test.py`
- Test functions: `test_*` prefix
- Test classes: `Test*` prefix
- Fixtures in `conftest.py`

### Patterns
```python
# Async test
@pytest.mark.asyncio
async def test_async_function():
    result = await some_async_call()
    assert result is not None

# Parametrized test
@pytest.mark.parametrize("input,expected", [
    ("a", 1),
    ("b", 2),
])
def test_with_params(input, expected):
    assert process(input) == expected

# Fixture usage
@pytest.fixture
def sample_data():
    return {"key": "value"}

def test_with_fixture(sample_data):
    assert sample_data["key"] == "value"
```

### Mocking
```python
from unittest.mock import Mock, patch, AsyncMock

# Mock external service
@patch('app.services.external_api.call')
def test_with_mock(mock_call):
    mock_call.return_value = {"status": "ok"}
    result = function_under_test()
    mock_call.assert_called_once()

# Mock async
@patch('app.services.async_service.fetch', new_callable=AsyncMock)
async def test_async_mock(mock_fetch):
    mock_fetch.return_value = []
    result = await async_function()
```

### Database Tests
```python
# Use async session fixture from conftest.py
async def test_db_operation(db: AsyncSession):
    obj = Model(name="test")
    db.add(obj)
    await db.commit()

    result = await db.execute(select(Model))
    assert len(result.scalars().all()) == 1
```

## TypeScript (Jest/Vitest)

### Structure
- Test files: `*.test.ts` or `*.test.tsx`
- Colocate with source or in `__tests__/`

### Patterns
```typescript
// Basic test
describe('ComponentName', () => {
  it('should render correctly', () => {
    expect(result).toBe(expected);
  });

  it('handles edge case', () => {
    expect(() => fn(null)).toThrow();
  });
});

// Async test
it('fetches data', async () => {
  const data = await fetchData();
  expect(data).toHaveLength(10);
});
```

### React Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';

it('renders button and handles click', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click</Button>);

  fireEvent.click(screen.getByText('Click'));
  expect(handleClick).toHaveBeenCalled();
});
```

## Examples in Codebase
- Async fixtures: `backend/tests/conftest.py`
- Service mocking: `backend/tests/test_concurrency_retry.py`
- Batch testing: `backend/tests/test_dnc_batch_optimization.py`

## NEVER DO
- Skip tests in CI without documented reason
- Use `time.sleep()` - use async wait or mocks
- Test implementation details - test behavior
- Share state between tests

## ALWAYS DO
- Isolate tests (no side effects)
- Use descriptive test names
- Test edge cases and errors
- Clean up created resources
