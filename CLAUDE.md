# CLAUDE.md - P1Lending ETL System

## Project Overview

**P1Lending ETL** is a mortgage lead data enrichment and compliance scrubbing system. It extracts lead data from Snowflake, enriches it with real phone numbers and emails via idiCORE API, validates against DNC (Do Not Call) lists and litigator databases, and stores results in Snowflake.

### Business Flow
1. User selects SQL script(s) defining lead criteria from Snowflake
2. System queries Snowflake for raw lead data
3. Each record is enriched via idiCORE API (real phone numbers, emails)
4. Phone numbers are checked against CCC Litigator API and local DNC database
5. Enriched, validated data is stored in Snowflake results tables
6. Processed records are cached to avoid reprocessing

---

## Tech Stack

### Backend
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | FastAPI | 0.115.0 |
| Python | 3.11+ | - |
| ORM | SQLAlchemy (async) | 2.0+ |
| Validation | Pydantic | 2.12+ |
| Background Jobs | Celery | 5.4.0 |
| Message Broker | Redis | 5.2.0 |
| Database | PostgreSQL | 15 |
| WebSocket | python-socketio | 5.11+ |
| Migrations | Alembic | 1.14+ |

### Frontend
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React | 19.2.0 |
| Build Tool | Vite | 7.2.4 |
| UI Library | Material UI (MUI) | 7.3.5 |
| Routing | React Router | 7.9.6 |
| Server State | TanStack Query | 5.90+ |
| Client State | Zustand | 5.0.8 |
| WebSocket | socket.io-client | 4.8.1 |
| Language | TypeScript | 5.9.3 |

### External Services
| Service | Purpose |
|---------|---------|
| Snowflake | Source data warehouse + results storage |
| idiCORE API | Real phone number & email lookup |
| CCC/DNC Scrub API | Litigator list checking |
| SQLite | Local DNC database lookup (20GB+) |
| NTFY | Self-hosted push notifications |

### Snowflake Schema

**Results Table:** `PROCESSED_DATA_DB.PUBLIC.MASTER_PROCESSED_DB`

This table stores all processed ETL results with enriched lead data:

| Column Group | Columns | Description |
|--------------|---------|-------------|
| Core Fields | record_id (PK), job_id, job_name, table_id, table_title, processed_at | Job tracking and identification |
| Person Data | first_name, last_name, address, city, state, zip_code | Original lead information |
| Contact Data | phone_1, phone_2, phone_3, email_1, email_2, email_3 | Enriched phone numbers and emails from idiCORE |
| Compliance Flags | in_litigator_list, phone_1_in_dnc, phone_2_in_dnc, phone_3_in_dnc | DNC and litigator list check results |
| Additional Data | additional_data (VARIANT) | Flexible JSON storage for extra fields |

**Table Creation:** Automatically created by `ETLResultsService._ensure_table_exists()` on first connection.

---

## Directory Structure

```
new_app/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI entry point, CORS, Socket.io
│   │   ├── api/v1/
│   │   │   ├── router.py           # Router aggregation
│   │   │   ├── deps.py             # Dependency injection (auth, db)
│   │   │   └── endpoints/
│   │   │       ├── auth.py         # Login, refresh, logout, me
│   │   │       ├── jobs.py         # ETL job management
│   │   │       ├── sql_scripts.py  # SQL script CRUD
│   │   │       ├── health.py       # Health checks
│   │   │       └── results.py      # ETL results retrieval
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic Settings (env vars)
│   │   │   ├── security.py         # JWT tokens, password hashing
│   │   │   ├── logger.py           # ETL logging utilities
│   │   │   └── exceptions.py       # Custom exceptions
│   │   ├── db/
│   │   │   ├── models/             # SQLAlchemy models
│   │   │   │   ├── user.py         # User model
│   │   │   │   ├── job.py          # ETLJob, JobLog models
│   │   │   │   ├── sql_script.py   # SQLScript model
│   │   │   │   └── audit.py        # LoginAuditLog model
│   │   │   ├── session.py          # Async database session
│   │   │   └── base.py             # SQLAlchemy Base
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── etl/                # ETL business logic (CORE)
│   │   │   │   ├── engine.py       # Main ETL orchestrator
│   │   │   │   ├── snowflake_service.py
│   │   │   │   ├── idicore_service.py
│   │   │   │   ├── ccc_service.py
│   │   │   │   ├── dnc_service.py
│   │   │   │   ├── cache_service.py
│   │   │   │   └── results_service.py
│   │   │   └── ntfy_service.py     # Push notifications
│   │   ├── workers/
│   │   │   ├── celery_app.py       # Celery configuration
│   │   │   ├── etl_tasks.py        # ETL job execution task
│   │   │   └── db_helper.py        # Sync DB for Celery
│   │   └── websockets/
│   │       └── job_events.py       # Socket.io + Redis pub/sub
│   ├── alembic/versions/           # Database migrations
│   ├── scripts/                    # Utility scripts
│   ├── secrets/                    # Credentials (git-ignored)
│   ├── logs/                       # Application logs
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── main.tsx                # React entry point
│   │   ├── App.tsx                 # Root component with routing
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx       # Main ETL dashboard
│   │   │   ├── SqlFiles.tsx
│   │   │   ├── SqlEditor.tsx
│   │   │   ├── ETLResults.tsx
│   │   │   ├── Rescrub.tsx
│   │   │   └── UserProfile.tsx
│   │   ├── components/
│   │   │   └── layout/
│   │   │       ├── Layout.tsx
│   │   │       ├── AppBar.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       └── ProtectedRoute.tsx
│   │   ├── services/api/           # API client functions
│   │   ├── stores/authStore.ts     # Zustand auth state
│   │   ├── utils/api.ts            # Axios instance
│   │   └── theme/                  # MUI theme
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml              # Development (postgres, redis)
├── docker-compose.prod.yml         # Production (all services)
├── deploy.sh                       # Main deployment script
├── .env                            # Environment variables (git-ignored)
└── env.example                     # Environment template
```

---

## Key Files

| File | Description |
|------|-------------|
| `backend/app/main.py` | FastAPI entry point, CORS, Socket.io mount |
| `backend/app/services/etl/engine.py` | **Main ETL orchestrator** - coordinates all services |
| `backend/app/workers/etl_tasks.py` | Celery task that executes ETL jobs |
| `backend/app/core/config.py` | Pydantic Settings (all env vars) |
| `frontend/src/App.tsx` | React root component with routing |

---

## Build & Run Commands

### Development Setup

```bash
# Start infrastructure (PostgreSQL, Redis)
docker compose up -d

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
python scripts/create_initial_user.py

# Run backend (terminal 1)
uvicorn app.main:app --reload

# Run Celery worker (terminal 2)
celery -A app.workers.celery_app worker --loglevel=info

# Frontend setup (terminal 3)
cd frontend
npm install
npm run dev
```

### Frontend Commands

```bash
npm run dev       # Development server (Vite hot reload)
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

### Production Deployment

```bash
# Full deployment
./deploy.sh

# Docker commands
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml down

# Access container shell
docker compose -f docker-compose.prod.yml exec backend bash

# Run migrations
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### Test Commands

```bash
# Test DNC list lookup
python scripts/test_dnc_list.py

# Test litigator API
python scripts/test_litigator_list.py

# Test both
python scripts/test_both_lists.py

# In container
docker compose -f docker-compose.prod.yml exec backend python scripts/test_both_lists.py
```

---

## CI/CD Configuration

**Status: No automated CI/CD pipeline configured.**

Deployment is manual via shell scripts:
- `deploy.sh` - Main production deployment (7-step process)
- `deploy-staging.sh` - Staging environment
- `quick-deploy.sh` - Fast deployment for iteration

---

## Security Concerns

### CRITICAL - Requires Immediate Action

1. **Hardcoded API Keys in Config** (`backend/app/core/config.py:12-42`)
   - Snowflake credentials have default values
   - CCC API key hardcoded
   - idiCORE credentials hardcoded
   - **Action:** Remove all default values, require env vars

2. **Committed .env File** (`.env`)
   - Production credentials committed to repository
   - Google Service Account private key exposed
   - **Action:** Remove from git history, rotate all credentials

3. **Default Admin Credentials** (`backend/scripts/create_initial_user.py:20-32`)
   - `admin@p1lending.com` / `admin123`
   - **Action:** Change immediately after deployment

### HIGH Severity

4. **Wildcard CORS on WebSocket** (`backend/app/websockets/job_events.py:13,30`)
   - `cors_allowed_origins="*"` allows any origin
   - **Action:** Restrict to known domains

5. **No Token Blacklist** (`backend/app/api/v1/endpoints/auth.py:193-201`)
   - Logout doesn't invalidate tokens
   - **Action:** Implement Redis-backed token revocation

6. **Unauthenticated WebSocket** (`backend/app/websockets/job_events.py`)
   - No JWT validation on WebSocket connections
   - **Action:** Add authentication to handshake

### MEDIUM Severity

7. **Insecure Snowflake Defaults** (`backend/app/core/config.py:20-21`)
   - `insecure_mode=True`, `ocsp_fail_open=True`
   - **Action:** Set to `False` in production

8. **Password Logged to Console** (`backend/scripts/create_initial_user.py:65-67`)
   - Plaintext password printed during user creation
   - **Action:** Remove password from output

### Positive Security Measures

- Password hashing with bcrypt (passlib)
- JWT authentication with expiration
- SQLAlchemy ORM prevents SQL injection
- Login audit logging with IP tracking
- Non-root Docker user

---

## Environment Variables

### Required Variables

```bash
# Database
POSTGRES_USER=p1lending
POSTGRES_PASSWORD=<strong_password>
POSTGRES_DB=p1lending_etl

# Security
SECRET_KEY=<32_char_random_string>
CORS_ORIGINS=["https://your-domain.com"]

# Snowflake
SNOWFLAKE_ACCOUNT=<account_id>
SNOWFLAKE_USER=<username>
SNOWFLAKE_PRIVATE_KEY_PASSWORD=<key_password>
SNOWFLAKE_ROLE=ACCOUNTADMIN
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
SNOWFLAKE_DATABASE=<database_name>
SNOWFLAKE_SCHEMA=PUBLIC

# External APIs
IDICORE_CLIENT_ID=<client_id>
IDICORE_CLIENT_SECRET=<client_secret>
CCC_API_KEY=<api_key>

# Optional
NTFY_ENABLED=true
NTFY_BASE_URL=http://ntfy:80
ETL_BATCH_SIZE=200
LOG_LEVEL=INFO
```

### Required Secret Files

| File | Description |
|------|-------------|
| `backend/secrets/rsa_key.p8` | Snowflake private key (PKCS#8) |
| `backend/secrets/google_credentials.json` | Google Service Account (deprecated) |
| `/home/ubuntu/etl_app/dnc_database.db` | SQLite DNC database (20GB+, host mount) |

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Production Stack                        │
├─────────────────────────────────────────────────────────┤
│  Frontend (Nginx:80)  ←→  Backend API (FastAPI:8000)   │
│         │                         │                     │
│         └─────────┬───────────────┘                     │
│                   │                                     │
│         ┌─────────▼─────────┐                          │
│         │   Redis (6380)    │                          │
│         │   Celery Broker   │                          │
│         └─────────┬─────────┘                          │
│                   │                                     │
│         ┌─────────▼─────────┐   ┌──────────────────┐   │
│         │  Celery Worker    │   │  PostgreSQL      │   │
│         │  ETL Execution    │   │  (5433)          │   │
│         └───────────────────┘   └──────────────────┘   │
│                                                         │
│  External: Snowflake, idiCORE API, CCC API, SQLite DNC │
└─────────────────────────────────────────────────────────┘
```

### Port Mappings

| Port | Service | Purpose |
|------|---------|---------|
| 80 | Frontend (Nginx) | Web UI |
| 8000 | Backend API | REST + WebSocket |
| 5433 | PostgreSQL | Database |
| 6380 | Redis | Celery broker |
| 7777 | NTFY | Push notifications |

### Server Locations

| Environment | Server | Application Directory |
|-------------|--------|----------------------|
| Staging | ubuntu@13.218.65.240 | `/home/ubuntu/etl-staging` |
| Production | TBD | TBD |

**DNC Database Location:** `/home/ubuntu/etl_app/dnc_database.db` (20GB+ SQLite file)

---

## API Quick Reference

### Authentication
```
POST /api/v1/auth/login     - Login (returns JWT)
POST /api/v1/auth/refresh   - Refresh token
POST /api/v1/auth/logout    - Logout
GET  /api/v1/auth/me        - Current user
```

### Jobs
```
POST /api/v1/jobs/            - Start ETL job
GET  /api/v1/jobs/            - List jobs
GET  /api/v1/jobs/{id}        - Get job status
POST /api/v1/jobs/{id}/cancel - Cancel job
POST /api/v1/jobs/preview     - Preview data (dry run)
```

### SQL Scripts
```
GET    /api/v1/scripts/       - List scripts
POST   /api/v1/scripts/       - Create script
GET    /api/v1/scripts/{id}   - Get script
PUT    /api/v1/scripts/{id}   - Update script
DELETE /api/v1/scripts/{id}   - Delete script
```

### Health
```
GET /health                   - Backend health check
GET /api/v1/health/system     - System health details
```

### WebSocket Events
```
join_job       - Subscribe to job updates
leave_job      - Unsubscribe from job
job_progress   - Progress update (%)
job_log        - Log entry
job_complete   - Job finished
job_error      - Job failed
```

---

## Default Credentials

| User | Password | Role |
|------|----------|------|
| admin@p1lending.com | admin123 | Superuser |

**Change immediately after deployment!**

---

## Useful Commands

```bash
# Create new user
docker compose -f docker-compose.prod.yml exec backend python scripts/create_user.py

# Backup SQL scripts
docker compose -f docker-compose.prod.yml exec backend python scripts/backup_sql_scripts.py

# View logs
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f celery-worker

# Database backup
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U p1lending p1lending_etl > backup.sql
```

---

## Patterns & Conventions

### Backend
- **Async/Await** - All database operations are async
- **Dependency Injection** - `deps.py` for auth and db sessions
- **Service Layer** - Business logic in `services/`, not endpoints
- **Pydantic Settings** - All config via environment variables

### Frontend
- **Zustand** - Client state (auth)
- **TanStack Query** - Server state (API data)
- **Protected Routes** - `<ProtectedRoute>` wraps authenticated pages
- **Material UI** - Consistent theming via `theme/index.ts`

### Naming
- Python: `snake_case` functions, `PascalCase` classes
- TypeScript: `camelCase` functions, `PascalCase` components
- Database: `snake_case` columns
- API: kebab-case URLs, snake_case JSON

### Concurrency & Rate Limiting
- **Dynamic Threading** - Worker count calculated based on workload size
- **Exponential Backoff** - 1s, 2s, 4s, 8s delays with ±20% jitter
- **Circuit Breaker** - Protects against cascading failures (5-10 failures → OPEN)
- **Configuration** - All parameters tunable via environment variables
- **Observability** - Worker decisions and retry events logged for monitoring

---

## ETL Performance Optimizations

### Overview

The ETL engine has been optimized for 4-8x overall performance improvement through three coordinated optimizations targeting critical bottlenecks.

**Implementation Date:** December 2024
**Version:** 2.0
**Expected Performance:** 4-8x faster for typical 200-record batches

### Priority 1: Snowflake Pre-Filtering (10-15x faster)

**Problem:** Python-side filtering loaded entire PERSON_CACHE table into memory, causing 5-30 second delays for medium caches.

**Solution:** Database-side filtering using SQL NOT EXISTS subquery with indexed lookups.

**Implementation:**
- New methods in `engine.py`: `_detect_address_column()`, `_build_filtered_query()`
- Index created: `idx_person_cache_address_normalized` on `PERSON_CACHE.address`
- Feature flag: `ETL_USE_DATABASE_FILTERING` (default: true)

**Performance:**
| Cache Size | Before | After | Improvement |
|------------|--------|-------|-------------|
| 10k records | 5s | 0.5s | 10x |
| 100k records | 30s | 1.2s | 25x |
| 1M records | 300s | 2.5s | 120x |

**Key Files:**
- `backend/app/services/etl/engine.py` - Core logic
- `backend/app/services/etl/cache_service.py` - Index creation

---

### Priority 2: DNC Batch Queries (6-10x faster)

**Problem:** Sequential SQLite queries (1 per phone) resulted in 6-30 second delays for 600-phone batches.

**Solution:** Batched WHERE IN queries using `full_phone` column with chunking for SQLite 999-parameter limit.

**Implementation:**
- New method in `dnc_service.py`: `_normalize_to_full_phone()`
- Replaced `check_multiple_phones()` with batched implementation
- Feature flag: `DNC_USE_BATCHED_QUERY` (default: true)

**Performance:**
| Batch Size | Before | After | Improvement |
|------------|--------|-------|-------------|
| 600 phones | 6-30s | 1-3s | 6-10x |
| 1000 phones | 10-50s | 3-5s | 3-10x |
| 2000 phones | 20-100s | 6-10s | 3-10x |

**Key Files:**
- `backend/app/services/etl/dnc_service.py` - Batch query logic

---

### Priority 3: Dynamic Threading & Rate Limiting (1.5-2x faster + resilience)

**Problem:** Hardcoded thread counts (8 for CCC, 150 for idiCORE) were suboptimal for variable workloads.

**Solution:** Dynamic worker calculation based on workload size with exponential backoff retry and circuit breaker pattern.

**Implementation:**
- New utilities: `backend/app/core/concurrency.py`, `backend/app/core/retry.py`
- Dynamic worker calculation formula: `min(max((workload_size / batch_size) * workers_per_batch, min_workers), max_workers)`
- Exponential backoff: 1s → 2s → 4s → 8s (with jitter)
- Circuit breaker: Opens after 5 failures (CCC) / 10 failures (idiCORE), stays open for 60s

**Configuration:**
```bash
# CCC API
CCC_MIN_WORKERS=2
CCC_MAX_WORKERS=16
CCC_WORKERS_PER_BATCH=1.5
CCC_MAX_RETRIES=4
CCC_RETRY_BASE_DELAY=1.0
CCC_RETRY_MAX_DELAY=30.0

# idiCORE API
IDICORE_MIN_WORKERS=10
IDICORE_MAX_WORKERS=200
IDICORE_WORKERS_SCALING=1.0
IDICORE_MAX_RETRIES=4
IDICORE_RETRY_BASE_DELAY=1.0
IDICORE_RETRY_MAX_DELAY=30.0
```

**Performance:**
| Service | Scenario | Before | After | Improvement |
|---------|----------|--------|-------|-------------|
| CCC | 600 phones (12 batches) | 12s | 6s | 2x |
| idiCORE | 50 people | 5s | 3s | 1.7x |
| idiCORE | 300 people | 20s | 15s | 1.3x |

**Key Files:**
- `backend/app/core/concurrency.py` - Worker calculation
- `backend/app/core/retry.py` - Retry decorator + circuit breaker
- `backend/app/services/etl/ccc_service.py` - CCC integration
- `backend/app/services/etl/idicore_service.py` - idiCORE integration
- `backend/app/services/etl/engine.py` - Orchestration

---

### Combined Performance Impact

**200-Record Batch (Typical Workload):**

| Stage | Before | After | Improvement |
|-------|--------|-------|-------------|
| Pre-filtering | 5-30s | 0.5-2s | 10-15x |
| idiCORE Enrichment | 500-1000ms | 500-1000ms | - |
| Litigator Check | 200-500ms | 150-300ms | 1.5x |
| DNC Check | 6-30s | 1-3s | 6-10x |
| Results Upload | 500-2000ms | 500-2000ms | - |
| **TOTAL** | **12-35s** | **2-8s** | **4-8x** |

---

### Rollback Strategy

All optimizations have feature flags for instant rollback:

```bash
# Disable Snowflake pre-filtering
ETL_USE_DATABASE_FILTERING=false

# Disable DNC batch queries
DNC_USE_BATCHED_QUERY=false

# Revert to hardcoded thread counts
CCC_MIN_WORKERS=8
CCC_MAX_WORKERS=8
IDICORE_MIN_WORKERS=150
IDICORE_MAX_WORKERS=150
```

Restart backend service after changing environment variables.

---

### Monitoring

**Key Metrics to Watch:**
- Query execution time (logged in "Data Filtering" steps)
- Worker count decisions (logged with 🔧 emoji)
- Circuit breaker events (logged with 🔴 emoji for OPEN state)
- Rate limit events (logged with ⚠️ emoji and [RATE LIMIT] tag)

**Example Log Messages:**
```
[ETL] 🔧 Calculated 12 workers for 600 phones (12 batches of 50) - CCC litigator check
[ETL] ⚠️ Attempt 2/4 failed: HTTP 429 Too Many Requests. Retrying in 2.18s... [RATE LIMIT]
[ETL] 🔴 Circuit breaker OPENED after 5 consecutive failures
[ETL] ✅ DNC check completed (batched): 45/600 phones found in DNC list
```

---

### Testing Recommendations

1. **Verify Index Creation:**
   ```sql
   SHOW INDEXES ON PROCESSED_DATA_DB.PUBLIC.PERSON_CACHE;
   ```

2. **Monitor First Few Jobs:**
   - Check logs for worker decision messages
   - Verify no circuit breaker activations (unless API is down)
   - Compare execution times with historical data

3. **Load Testing:**
   - Test with varying batch sizes (50, 100, 200, 500 records)
   - Verify dynamic worker scaling
   - Monitor resource usage (CPU, memory, network)

4. **Rollback Testing:**
   - Disable one optimization at a time
   - Verify fallback behavior works correctly
   - Re-enable and verify performance returns

---

---

## Claude Code Integration

### CRITICAL: Deployment Workflow

**Claude MUST follow this workflow for all code changes:**

1. **Make code changes** - Edit files as needed
2. **Commit and push to GitHub** - Always push changes to the repository
3. **DO NOT deploy** - The user will handle deployment manually

**Never:**
- Run deployment scripts (`deploy.sh`, `deploy-staging.sh`, etc.)
- Restart Docker containers on remote servers
- SSH into servers to deploy changes

The user controls when and how deployments happen.

---

### MANDATORY: Agent & Command Usage

**Claude MUST use these optimizations during implementation:**

#### 1. Use Specialized Agents for Complex Tasks
- **Explore Agent**: Use `Task(subagent_type="Explore")` for codebase exploration, finding patterns, understanding existing implementations
- **Plan Agent**: Use `Task(subagent_type="Plan")` for designing implementation approaches before coding
- **Run agents in PARALLEL** when exploring multiple areas (up to 3 concurrent agents)

```
Example: When implementing a new feature that touches backend + frontend:
1. Launch Explore agent for backend patterns
2. Launch Explore agent for frontend patterns
3. Launch Explore agent for similar existing implementations
(All 3 in parallel in a single message)
```

#### 2. Use Slash Commands Instead of Manual Implementation
| Task | MUST Use Command |
|------|------------------|
| Create new API endpoint | `/add-endpoint <name> <method>` |
| Create database migration | `/add-migration <description>` |
| Create new React page | `/add-react-page <name>` |
| Debug ETL issues | `/debug-etl <job-id>` |
| Pre-deployment checks | `/pre-deploy` |
| Security audit | `/security-review` |

#### 3. Follow Rules Automatically
Rules in `.claude/rules/` are auto-applied by file path:
- `code-style.md` → All Python/TypeScript files
- `api-design.md` → API endpoints (Pydantic schemas, auth, error handling)
- `database.md` → SQLAlchemy models (relationships, indexes)
- `react.md` → React components (MUI patterns, hooks)
- `security.md` → Security requirements

#### 4. Leverage Hooks
- `auto-format.sh` runs after edits (Black, Ruff, Prettier)
- `protect-secrets.py` blocks editing sensitive files
- No need to manually format code

#### 5. Use TodoWrite for Task Tracking
- Create todos at start of multi-step tasks
- Update status as you progress (pending → in_progress → completed)
- Keeps user informed of progress

#### 6. Parallel Tool Calls
- When making independent changes, use parallel tool calls
- Example: Read 3 files simultaneously, create 3 services in parallel
- Reduces latency significantly

### Available Slash Commands

#### Development Commands
| Command | Description | Usage |
|---------|-------------|-------|
| `/add-endpoint` | Create new FastAPI endpoint | `/add-endpoint users POST` |
| `/add-migration` | Create Alembic migration | `/add-migration add_user_preferences` |
| `/add-react-page` | Create new React page | `/add-react-page UserSettings` |
| `/add-full-stack-feature` | **NEW** Create complete full-stack feature (backend + frontend) | `/add-full-stack-feature notifications` |
| `/debug-etl` | Debug ETL job issues | `/debug-etl 123` |
| `/trace-job` | Trace job through pipeline | `/trace-job 456` |

#### Database Commands
| Command | Description | Usage |
|---------|-------------|-------|
| `/db-manage` | **NEW** Unified database operations (backup, restore, migrations, etc.) | `/db-manage backup` |

#### Deployment Commands
| Command | Description | Usage |
|---------|-------------|-------|
| `/quick-deploy` | **NEW** Streamlined deployment workflow with safety checks | `/quick-deploy staging` |

#### Quality Commands
| Command | Description |
|---------|-------------|
| `/security-review` | Comprehensive security audit |
| `/pre-deploy` | Pre-deployment checklist |

#### Meta Commands (Sustainability)
| Command | Description |
|---------|-------------|
| `/health-check` | Check Claude Code setup and codebase health |
| `/self-update` | Update Claude Code setup with latest best practices |
| `/weekly-review` | Weekly Claude Code setup review |
| `/feedback` | Record command feedback for improvement |
| `/improve-setup` | Analyze usage and improve setup |

### Hooks

| Hook | Trigger | Action |
|------|---------|--------|
| `auto-format.sh` | After Edit/Write | Runs Black/Ruff (Python), Prettier (TypeScript) |
| `protect-secrets.py` | Before Edit/Write | Blocks editing .env, secrets, credentials |
| `post-merge-check.sh` | After git merge | Alerts if structure changed significantly |

### Rules (Auto-applied by path)

| Rule File | Applies To | Purpose |
|-----------|------------|---------|
| `code-style.md` | `**/*.py, **/*.ts, **/*.tsx` | Naming conventions, formatting |
| `security.md` | `**/*.py, **/*.ts` | Security requirements |
| `api-design.md` | `backend/app/api/**/*.py` | REST API patterns |
| `database.md` | `backend/app/db/**/*.py` | SQLAlchemy patterns |
| `react.md` | `frontend/src/**/*.tsx` | React/MUI patterns |

### Protected Files (Claude Cannot Read/Edit)

- `.env`, `.env.*` files
- `backend/secrets/` directory
- `*.pem`, `*.key`, `*.p8` files
- `credentials.json` files

### CI/CD Pipeline

GitHub Actions runs on push/PR to `main`, `staging`, `develop`:
- **backend-lint**: Ruff + Black checks
- **backend-test**: pytest with PostgreSQL/Redis services
- **frontend-lint**: ESLint + TypeScript build
- **security-scan**: Trivy + Bandit security scanning

### Sustainability Schedule

| Frequency | Action |
|-----------|--------|
| Weekly | Run `/weekly-review` to check command effectiveness |
| Monthly | Run `/self-update` to incorporate new Claude Code features |
| Per Sprint | Run `/health-check` and review score trends |
| On Demand | Use `/feedback` to log command issues for improvement |

---

## MANDATORY: Claude's Decision Framework

### CRITICAL - READ BEFORE EVERY TASK

**This section is ENFORCED by hooks. Violations will BLOCK your operations.**

Claude MUST follow this decision framework for EVERY implementation task:

#### 1. Reference CLAUDE.md

Before implementing ANYTHING:
- Identify the relevant section in this file (Tech Stack, Security, Patterns, etc.)
- Explicitly cite the section name in your response
- Example: "Referencing CLAUDE.md section 'Patterns & Conventions' for backend service patterns"

#### 2. Evaluate Available Tools

Check for existing automation:

| Tool Type | Location | When to Check |
|-----------|----------|---------------|
| **Slash Commands** | `.claude/commands/` | For well-defined tasks (add endpoint, create migration, deploy) |
| **Specialized Agents** | `.claude/agents/` | For analysis/review tasks (API design, ETL performance) |
| **Rules** | `.claude/rules/` | For implementation patterns (code style, security, etc.) |

#### 3. Decision Matrix

**Use this table to choose the right tool:**

| Task Type | First Check | Second Check | Fallback |
|-----------|-------------|--------------|----------|
| **New API endpoint** | `/add-endpoint` | `.claude/rules/api-design.md` | Direct Edit |
| **New database model** | `/add-db-model` | `.claude/rules/database.md` | Direct Edit |
| **New React page** | `/add-react-page` | `.claude/rules/react.md` | Direct Edit |
| **New full-stack feature** | `/add-full-stack-feature` | Both API + React agents | Direct Edit |
| **Database migration** | `/add-migration` | Alembic patterns | Direct Edit |
| **ETL service** | `/add-etl-service` | `.claude/rules/etl-patterns.md` | Direct Edit |
| **API design review** | API Architect agent | `.claude/rules/api-design.md` | Manual review |
| **ETL performance issue** | ETL Specialist agent | `/debug-etl` | Manual review |
| **Security audit** | `/security-review` | `.claude/rules/security.md` | Manual review |
| **Pre-deployment checks** | `/pre-deploy` | - | Manual checks |
| **Quick deployment** | `/quick-deploy` | - | Manual deployment |
| **Bug fix** | Check relevant rule file | - | Direct Edit |
| **Refactoring** | Check relevant rule file | - | Direct Edit |

#### 4. Implementation Checklist

Before writing ANY code (Edit/Write/Task):

- [ ] **Referenced** specific CLAUDE.md section (cite it explicitly)
- [ ] **Checked** `.claude/commands/` for applicable slash command
- [ ] **Checked** `.claude/agents/` for analysis/review needs
- [ ] **Checked** `.claude/rules/` for file-specific patterns
- [ ] **Justified** chosen approach (command vs agent vs direct edit)
- [ ] **Ready** to implement

**FAILURE TO COMPLETE THIS CHECKLIST WILL BLOCK YOUR OPERATIONS.**

#### 5. Enforcement

This decision framework is enforced by `.claude/hooks/mandate-claudemd-check.py`:

- **Triggered by:** Edit, Write, Task, and certain Bash operations
- **Validation:** Checks conversation history for CLAUDE.md reference, tool evaluation, and decision justification
- **On Failure:** Blocks operation with exit code 2, logs violation to `feedback.log`
- **Exempt Operations:** Read, Glob, Grep (exploration is always allowed)

#### 6. Example Compliance

**❌ NON-COMPLIANT (will be blocked):**
```
User: Add a new endpoint for user preferences
Claude: I'll create backend/app/api/v1/endpoints/preferences.py
[Attempts Edit operation]
→ BLOCKED: No CLAUDE.md reference, no command evaluation
```

**✅ COMPLIANT (will succeed):**
```
User: Add a new endpoint for user preferences
Claude:
Referencing CLAUDE.md section "Patterns & Conventions" for backend service patterns.

I've checked .claude/commands/ and found `/add-endpoint` command which handles:
- Endpoint creation with auth patterns
- Schema generation
- Router registration

I'll use `/add-endpoint preferences GET` instead of manual implementation.

[Invokes SlashCommand tool]
→ ALLOWED: CLAUDE.md referenced, command evaluated, decision justified
```

---

*Last updated: December 2024*
