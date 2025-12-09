# Add Pytest Infrastructure

Set up complete pytest testing infrastructure for the backend. This project currently has NO automated tests.

---

## Pre-Flight Checks

1. **Verify backend exists**: `backend/` directory present
2. **Check Python version**: 3.11+ required
3. **Verify no existing tests**:
   ```
   ⚠️  WARNING: Tests directory already exists at backend/tests/
   Proceeding will add to existing structure.
   ```

---

## Required File References

| File | Purpose |
|------|---------|
| `backend/requirements.txt` | Add test dependencies |
| `backend/app/main.py` | FastAPI app for test client |
| `backend/app/db/session.py` | Database session factory |
| `backend/app/db/base.py` | SQLAlchemy Base |
| `backend/app/core/security.py` | Token creation for auth |
| `backend/app/core/config.py` | Settings to override |

---

## Step-by-Step Implementation

### Step 1: Add Test Dependencies

**Update `backend/requirements.txt`**:
```
# Testing (add at end of file)
pytest>=7.4.0
pytest-asyncio>=0.23.0
pytest-cov>=4.1.0
pytest-mock>=3.12.0
httpx>=0.25.0
factory-boy>=3.3.0
anyio>=4.0.0
```

### Step 2: Create Directory Structure

```
backend/tests/
├── __init__.py
├── conftest.py                 # Global fixtures
├── test_api/
│   ├── __init__.py
│   ├── test_auth.py           # Auth endpoint tests
│   ├── test_health.py         # Health check tests
│   ├── test_jobs.py           # Jobs endpoint tests
│   └── test_scripts.py        # SQL scripts tests
├── test_services/
│   ├── __init__.py
│   ├── test_etl_engine.py     # ETL engine tests
│   ├── test_snowflake.py      # Snowflake service tests
│   ├── test_idicore.py        # idiCORE service tests
│   └── test_dnc.py            # DNC service tests
└── test_models/
    ├── __init__.py
    └── test_job.py            # Job model tests
```

### Step 3: Create pytest.ini

**Create `backend/pytest.ini`**:
```ini
[pytest]
asyncio_mode = auto
testpaths = tests
python_files = test_*.py
python_functions = test_*
python_classes = Test*
addopts = -v --tb=short --strict-markers
markers =
    slow: marks tests as slow (deselect with '-m "not slow"')
    integration: marks tests requiring external services
filterwarnings =
    ignore::DeprecationWarning
    ignore::PendingDeprecationWarning
env =
    DATABASE_URL=postgresql+asyncpg://test:test@localhost:5432/test_db
    SECRET_KEY=test-secret-key-not-for-production
    REDIS_URL=redis://localhost:6379/1
```

### Step 4: Create conftest.py

**Create `backend/tests/conftest.py`**:
```python
"""
Pytest configuration and shared fixtures
"""
import asyncio
import pytest
from typing import AsyncGenerator, Generator
from uuid import uuid4

from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.db.models.user import User
from app.db.models.sql_script import SQLScript
from app.db.models.job import ETLJob, JobStatus, JobType
from app.core.security import get_password_hash, create_access_token


# Test database URL - use SQLite for speed
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def engine():
    """Create test database engine"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture
async def db(engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session"""
    async_session = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

    async with async_session() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test HTTP client"""

    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db: AsyncSession) -> User:
    """Create test user"""
    user = User(
        id=uuid4(),
        email="test@example.com",
        hashed_password=get_password_hash("testpassword123"),
        full_name="Test User",
        is_active=True,
        is_superuser=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest.fixture
async def admin_user(db: AsyncSession) -> User:
    """Create admin user"""
    user = User(
        id=uuid4(),
        email="admin@example.com",
        hashed_password=get_password_hash("adminpassword123"),
        full_name="Admin User",
        is_active=True,
        is_superuser=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user: User) -> dict:
    """Create auth headers for test user"""
    token = create_access_token(data={"sub": test_user.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(admin_user: User) -> dict:
    """Create auth headers for admin user"""
    token = create_access_token(data={"sub": admin_user.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def sample_script(db: AsyncSession, test_user: User) -> SQLScript:
    """Create sample SQL script"""
    script = SQLScript(
        id=uuid4(),
        name="Test Script",
        content="SELECT * FROM test_table LIMIT 10",
        description="A test SQL script",
        created_by=test_user.id,
    )
    db.add(script)
    await db.commit()
    await db.refresh(script)
    return script


@pytest.fixture
async def sample_job(db: AsyncSession, sample_script: SQLScript, test_user: User) -> ETLJob:
    """Create sample ETL job"""
    job = ETLJob(
        id=uuid4(),
        job_type=JobType.SINGLE_SCRIPT,
        script_id=sample_script.id,
        status=JobStatus.PENDING,
        started_by=test_user.id,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job
```

### Step 5: Create Sample Tests

**Create `backend/tests/test_api/test_health.py`**:
```python
"""
Tests for health check endpoints
"""
import pytest
from httpx import AsyncClient


class TestHealthEndpoints:
    """Test health check endpoints"""

    @pytest.mark.asyncio
    async def test_root_endpoint(self, client: AsyncClient):
        """Test root endpoint returns API info"""
        response = await client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert "P1Lending ETL API" in data["message"]
        assert "version" in data

    @pytest.mark.asyncio
    async def test_health_endpoint(self, client: AsyncClient):
        """Test health endpoint returns healthy status"""
        response = await client.get("/health")

        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}
```

**Create `backend/tests/test_api/test_auth.py`**:
```python
"""
Tests for authentication endpoints
"""
import pytest
from httpx import AsyncClient
from app.db.models.user import User


class TestAuthEndpoints:
    """Test authentication endpoints"""

    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient, test_user: User):
        """Test successful login"""
        response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": "test@example.com",
                "password": "testpassword123",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient, test_user: User):
        """Test login with wrong password"""
        response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": "test@example.com",
                "password": "wrongpassword",
            },
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login with non-existent user"""
        response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": "nonexistent@example.com",
                "password": "anypassword",
            },
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_me_authenticated(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user: User
    ):
        """Test getting current user info"""
        response = await client.get(
            "/api/v1/auth/me",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email

    @pytest.mark.asyncio
    async def test_get_me_unauthenticated(self, client: AsyncClient):
        """Test getting current user without auth"""
        response = await client.get("/api/v1/auth/me")

        assert response.status_code == 401
```

### Step 6: Update .gitignore

**Add to `.gitignore`**:
```
# Testing
.pytest_cache/
.coverage
htmlcov/
coverage.xml
*.cover
.hypothesis/
```

---

## Output Format

```markdown
# Pytest Infrastructure Setup Complete

## Files Created

| File | Purpose |
|------|---------|
| `backend/tests/__init__.py` | Test package init |
| `backend/tests/conftest.py` | Shared fixtures |
| `backend/tests/test_api/__init__.py` | API tests package |
| `backend/tests/test_api/test_health.py` | Health endpoint tests |
| `backend/tests/test_api/test_auth.py` | Auth endpoint tests |
| `backend/pytest.ini` | Pytest configuration |

## Dependencies Added

```
pytest>=7.4.0
pytest-asyncio>=0.23.0
pytest-cov>=4.1.0
pytest-mock>=3.12.0
httpx>=0.25.0
anyio>=4.0.0
```

## Run Tests

```bash
cd backend
pip install -r requirements.txt
pytest
```

## Validation Checklist

- [ ] `pip install -r requirements.txt` succeeds
- [ ] `pytest --collect-only` shows tests
- [ ] `pytest tests/test_api/test_health.py` passes
- [ ] `pytest tests/test_api/test_auth.py` passes
- [ ] `pytest --cov=app` shows coverage report
```

---

## Error Handling

| Error | Resolution |
|-------|------------|
| `ModuleNotFoundError: app` | Run from `backend/` directory |
| `asyncio fixture not found` | Install `pytest-asyncio>=0.23.0` |
| `Database URL invalid` | Check pytest.ini env settings |
| `Import error in conftest` | Verify all models imported correctly |

---

## Validation Steps

1. **Install dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Verify test collection**:
   ```bash
   pytest --collect-only
   ```

3. **Run all tests**:
   ```bash
   pytest -v
   ```

4. **Run with coverage**:
   ```bash
   pytest --cov=app --cov-report=html
   open htmlcov/index.html
   ```

5. **Verify in CI/CD** (optional):
   ```bash
   pytest --junitxml=test-results.xml --cov=app --cov-report=xml
   ```
