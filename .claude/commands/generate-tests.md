# Generate Tests

Generate comprehensive tests for the specified module or component.

## Target
$ARGUMENTS

---

## Pre-Flight Checks

1. **Verify target exists**:
   ```
   ❌ ERROR: Target file not found: {path}

   Did you mean one of these?
   - backend/app/api/v1/endpoints/{similar}
   - backend/app/services/etl/{similar}
   - frontend/src/pages/{similar}
   ```

2. **Check if tests directory exists**:
   - Backend: `backend/tests/` (create if missing)
   - Frontend: Tests alongside components

3. **Verify test dependencies** (see `/add-pytest` if missing):
   - Backend: pytest, pytest-asyncio, httpx in requirements.txt
   - Frontend: vitest, @testing-library/react in package.json

---

## Required File References

### For Backend Tests
| File | Purpose |
|------|---------|
| Target file | Code to test |
| `backend/app/core/config.py` | Settings to mock |
| `backend/app/db/models/` | Models for fixtures |
| `backend/app/schemas/` | Request/response shapes |
| `backend/tests/conftest.py` | Existing fixtures |

### For Frontend Tests
| File | Purpose |
|------|---------|
| Target component | Code to test |
| `frontend/src/stores/` | Stores to mock |
| `frontend/src/services/api/` | API calls to mock |
| `frontend/src/utils/api.ts` | Axios instance |

---

## Test Generation Instructions

### For Backend Python Files

#### API Endpoints (`backend/app/api/v1/endpoints/`)

```python
"""
Tests for {endpoint_name} endpoints
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4

from app.main import app
from app.db.models.{model} import {Model}


class Test{Endpoint}Endpoints:
    """Test suite for {endpoint} API"""

    @pytest.fixture
    async def sample_{model}(self, db: AsyncSession) -> {Model}:
        """Create a sample {model} for testing"""
        {model} = {Model}(
            id=uuid4(),
            # ... required fields
        )
        db.add({model})
        await db.commit()
        await db.refresh({model})
        return {model}

    # === Happy Path Tests ===

    @pytest.mark.asyncio
    async def test_list_{models}_success(
        self,
        client: AsyncClient,
        auth_headers: dict,
        sample_{model}: {Model}
    ):
        """Test listing {models} returns expected data"""
        response = await client.get(
            "/api/v1/{endpoint}/",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    @pytest.mark.asyncio
    async def test_create_{model}_success(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Test creating a new {model}"""
        payload = {
            # ... required fields
        }

        response = await client.post(
            "/api/v1/{endpoint}/",
            json=payload,
            headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json()
        assert "id" in data

    # === Error Cases ===

    @pytest.mark.asyncio
    async def test_list_{models}_unauthorized(self, client: AsyncClient):
        """Test that unauthorized access is rejected"""
        response = await client.get("/api/v1/{endpoint}/")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_create_{model}_invalid_data(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Test validation rejects invalid data"""
        payload = {"invalid": "data"}

        response = await client.post(
            "/api/v1/{endpoint}/",
            json=payload,
            headers=auth_headers
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_get_{model}_not_found(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Test 404 for non-existent {model}"""
        fake_id = str(uuid4())

        response = await client.get(
            f"/api/v1/{endpoint}/{fake_id}",
            headers=auth_headers
        )

        assert response.status_code == 404
```

#### ETL Services (`backend/app/services/etl/`)

```python
"""
Tests for {Service}Service
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from app.services.etl.{service}_service import {Service}Service


class Test{Service}Service:
    """Test suite for {Service}Service"""

    @pytest.fixture
    def service(self):
        """Create service instance with mocked dependencies"""
        with patch('app.services.etl.{service}_service.settings') as mock_settings:
            mock_settings.{service}.api_key = "test_key"
            mock_settings.{service}.base_url = "https://test.api.com"
            yield {Service}Service()

    @pytest.fixture
    def mock_response(self):
        """Create mock API response"""
        mock = Mock()
        mock.status_code = 200
        mock.json.return_value = {"result": "success"}
        return mock

    # === Unit Tests ===

    def test_init_loads_config(self, service):
        """Test service initializes with correct config"""
        assert service.api_key == "test_key"
        assert service.base_url == "https://test.api.com"

    @patch('requests.Session.request')
    def test_api_call_success(self, mock_request, service, mock_response):
        """Test successful API call"""
        mock_request.return_value = mock_response

        result = service._make_request("GET", "/endpoint")

        assert result == {"result": "success"}
        mock_request.assert_called_once()

    @patch('requests.Session.request')
    def test_api_call_handles_error(self, mock_request, service):
        """Test API error handling"""
        mock_request.side_effect = Exception("Connection error")

        result = service._make_request("GET", "/endpoint")

        assert result is None

    # === Integration-like Tests (with mocks) ===

    @patch('requests.Session.request')
    def test_process_batch(self, mock_request, service, mock_response):
        """Test batch processing"""
        mock_request.return_value = mock_response
        records = [{"id": 1}, {"id": 2}, {"id": 3}]

        results = service.process_batch(records, batch_size=2)

        assert len(results) == 3
```

### For Frontend React Files

```typescript
/**
 * Tests for {Component}
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { {Component} } from './{Component}';

// Mock API
vi.mock('../../utils/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock auth store
vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
    user: { id: '1', email: 'test@test.com' },
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('{Component}', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // === Rendering Tests ===

  it('renders loading state initially', () => {
    render(<{Component} />, { wrapper: createWrapper() });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders data after loading', async () => {
    const api = await import('../../utils/api');
    (api.default.get as vi.Mock).mockResolvedValueOnce({
      data: [{ id: '1', name: 'Test' }],
    });

    render(<{Component} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  it('renders error state on failure', async () => {
    const api = await import('../../utils/api');
    (api.default.get as vi.Mock).mockRejectedValueOnce(new Error('Failed'));

    render(<{Component} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  // === Interaction Tests ===

  it('handles button click', async () => {
    render(<{Component} />, { wrapper: createWrapper() });

    const button = screen.getByRole('button', { name: /action/i });
    fireEvent.click(button);

    await waitFor(() => {
      // Assert expected behavior
    });
  });
});
```

---

## Output Format

```markdown
# Generated Tests for {target}

## Test File Created
`{test_file_path}`

## Test Coverage

| Category | Tests | Status |
|----------|-------|--------|
| Happy Path | {count} | ✅ Created |
| Error Cases | {count} | ✅ Created |
| Edge Cases | {count} | ✅ Created |
| Auth | {count} | ✅ Created |

## Fixtures Created

- `{fixture_name}`: {description}

## Mocks Required

- `{mock_target}`: {what it mocks}

## Run Tests

```bash
# Backend
cd backend
pytest tests/test_{module}.py -v

# Frontend
cd frontend
npm test -- {Component}.test.tsx
```

## Validation Checklist

- [ ] Tests pass: `pytest tests/test_{module}.py`
- [ ] Coverage adequate: `pytest --cov=app.{module}`
- [ ] No flaky tests (run 3x)
- [ ] Mocks correctly isolate external services
```

---

## Error Handling

| Issue | Resolution |
|-------|------------|
| Missing conftest.py | Run `/add-pytest` first |
| Import errors | Check PYTHONPATH includes backend/ |
| Async issues | Ensure pytest-asyncio installed |
| Missing fixtures | Create in conftest.py or test file |

---

## Validation Steps

After generating tests:

1. **Run the tests**:
   ```bash
   pytest tests/test_{module}.py -v
   ```

2. **Check coverage**:
   ```bash
   pytest tests/test_{module}.py --cov=app.{module} --cov-report=term-missing
   ```

3. **Verify isolation** - Tests should pass without:
   - Running database
   - External API access
   - Other tests running first

4. **Run multiple times** - Ensure no flaky tests:
   ```bash
   pytest tests/test_{module}.py -v --count=3
   ```
