# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Environment

**IMPORTANT:** The user develops this application on a **remote development server**, not locally.

- **Connection Method**: VS Code Remote SSH from local machine
- **Server IP**: 173.255.232.167 (IPv4) / 2600:3c03::2000:70ff:fea7:2c46 (IPv6)
- **User**: aallouch
- **Working Directory**: `/home/aallouch/projects/LodasoftETL/new_app`

### Implications for Claude Code:
- When providing URLs for services (Storybook, Vite dev server, API, etc.), **always use the public IP address**, not `localhost`
- URLs should be in format: `http://173.255.232.167:PORT` (not `http://localhost:PORT`)
- Example: Storybook runs on `http://173.255.232.167:6006` (not `http://localhost:6006`)
- Example: Vite dev server runs on `http://173.255.232.167:5173` (not `http://localhost:5173`)
- Example: FastAPI backend runs on `http://173.255.232.167:8000` (not `http://localhost:8000`)
- User accesses these services from their local machine's browser via the public IP
- Commands run on the remote server, but URLs are accessed from the user's local browser

## Project Overview

**P1Lending ETL** is a mortgage lead data enrichment and compliance scrubbing system. It extracts lead data from Snowflake, enriches it with real phone numbers and emails via idiCORE API, validates against DNC (Do Not Call) lists and litigator databases, and stores results in Snowflake.

## Feature Status

### Active Features ✓
- **Snowflake SQL Script Execution** - Core ETL workflow
- **idiCORE Enrichment** - Phone/email lookup via idiCORE API
- **CCC Litigator Check** - Compliance validation against litigator database
- **DNC Validation** - Do Not Call list checking (20GB+ SQLite)
- **Dual-Layer Caching** - PERSON_CACHE (Snowflake) + CSV caches for performance
- **Real-Time Progress** - WebSocket live job monitoring
- **Results Viewing** - ETL Results page with export to CSV
- **Full Mortgage Schema** - 42 columns including lead info, property data, loan details

### Disabled Features
- **File Source Upload** (CSV/Excel) - Temporarily disabled
  - Backend: API routes commented in `backend/app/api/v1/router.py:29-30`
  - Frontend: Route commented in `frontend/src/App.tsx:111-122`
  - Frontend: Sidebar item removed from `Sidebar.tsx:160`

**To Re-enable:** Uncomment the 3 locations above and redeploy

### Business Flow
1. User selects **SQL script(s)** defining lead criteria from Snowflake
2. System queries Snowflake for raw lead data (bulk_property_data_private_share_usa)
3. Each record is enriched via idiCORE API (real phone numbers, emails)
4. Phone numbers are checked against CCC Litigator API and local DNC database
5. Enriched, validated data is stored in **MASTER_PROCESSED_DB** table in Snowflake (42 columns)
6. Processed records are cached to avoid reprocessing

**Note:** File upload feature (CSV/Excel) is currently disabled. See "Feature Status" above.

## Tech Stack

**Backend:** FastAPI 0.115, Python 3.11+, SQLAlchemy (async) 2.0+, Pydantic 2.12+, Celery 5.4, Redis 5.2, PostgreSQL 15, Alembic

**Frontend:** React 19, Vite 7.2, Material UI 7.3, React Router 7.9, TanStack Query 5.90+, Zustand 5.0, TypeScript 5.9

**External:** Snowflake (data warehouse), idiCORE API (phone/email lookup), CCC API (litigator check), SQLite DNC database (20GB+), NTFY (push notifications)

## Build & Run Commands

### Development
```bash
# Start infrastructure
docker compose up -d

# Backend (terminal 1)
cd backend && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Celery worker (terminal 2)
celery -A app.workers.celery_app worker --loglevel=info

# Frontend (terminal 3)
cd frontend && npm install && npm run dev
```

### Linting
```bash
# Backend
cd backend && ruff check . && black --check .

# Frontend
cd frontend && npm run lint

# Or use the slash command
/lint all --fix
```

### Testing
```bash
# Backend (in container or local)
cd backend && pytest --cov=app

# ETL service tests
python scripts/test_both_lists.py
```

### Production
```bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## Architecture

### Key Files
| File | Purpose |
|------|---------|
| `backend/app/services/etl/engine.py` | **Main ETL orchestrator** - coordinates all services |
| `backend/app/workers/etl_tasks.py` | Celery task that executes ETL jobs |
| `backend/app/api/v1/deps.py` | Dependency injection (auth, db sessions) |
| `backend/app/core/config.py` | Pydantic Settings (all env vars) |
| `frontend/src/App.tsx` | React root with routing |
| `frontend/src/stores/authStore.ts` | Zustand auth state |

### ETL Pipeline Flow
```
Snowflake Query → idiCORE Enrichment → CCC Litigator Check → DNC Check → Snowflake Results
     ↓                    ↓                     ↓                ↓             ↓
  engine.py         idicore_service.py    ccc_service.py   dnc_service.py  results_service.py
```

### API Endpoints
```
POST /api/v1/auth/login      - Login (JWT)
POST /api/v1/jobs/           - Start ETL job
GET  /api/v1/jobs/{id}       - Job status
POST /api/v1/jobs/preview    - Dry run
GET  /api/v1/scripts/        - SQL scripts CRUD
GET  /health                 - Health check
```

### WebSocket Events
`join_job`, `job_progress`, `job_log`, `job_complete`, `job_error`

## Patterns & Conventions

### Backend
- **Async/Await** - All database operations use async
- **Service Layer** - Business logic in `services/`, not endpoints
- **Dependency Injection** - Auth and DB via `deps.py`

### Frontend
- **Zustand** - Client state (auth)
- **TanStack Query** - Server state (API data)
- **Protected Routes** - `<ProtectedRoute>` wraps authenticated pages

### Naming
- Python: `snake_case` functions, `PascalCase` classes
- TypeScript: `camelCase` functions, `PascalCase` components
- Database: `snake_case` columns

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to `main`, `staging`, `develop`:
- **backend-lint**: Ruff + Black
- **backend-test**: pytest with PostgreSQL/Redis
- **frontend-lint**: ESLint + TypeScript build
- **security-scan**: Trivy + Bandit

## Deployment

| Environment | Server | Directory |
|-------------|--------|-----------|
| Staging | ubuntu@13.218.65.240 | `/home/ubuntu/etl-staging` |
| Production | TBD | TBD |

**DNC Database:** `/home/ubuntu/etl_app/dnc_database.db` (host mount, 20GB+)

## ETL Performance Features

The ETL engine includes performance optimizations with feature flags:
- **Snowflake Pre-Filtering** (`ETL_USE_DATABASE_FILTERING=true`) - Database-side filtering vs Python
- **DNC Batch Queries** (`DNC_USE_BATCHED_QUERY=true`) - Batched WHERE IN queries
- **Dynamic Threading** - Worker count scales with workload

Key tuning env vars: `CCC_MIN_WORKERS`, `CCC_MAX_WORKERS`, `IDICORE_MIN_WORKERS`, `IDICORE_MAX_WORKERS`

## Snowflake Direct Access

For direct Snowflake queries (schema changes, data migrations, debugging), use RSA key authentication:

**Connection Details:**
| Setting | Value |
|---------|-------|
| Account | `HTWNYRU-CL36377` |
| User | `SDABABNEH` |
| Role | `ACCOUNTADMIN` |
| Warehouse | `COMPUTE_WH` |
| Database | `PROCESSED_DATA_DB` (for results) |
| Schema | `PUBLIC` |
| Private Key | `/home/aallouch/projects/LodasoftETL/new_app/rsa_key.p8` |
| Key Password | `$SNOWFLAKE_PRIVATE_KEY_PASSWORD` (from .env) |

**Quick Python Connection:**
```python
import os
import snowflake.connector
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, NoEncryption

key_path = '/home/aallouch/projects/LodasoftETL/new_app/rsa_key.p8'
with open(key_path, 'rb') as f:
    private_key_obj = serialization.load_pem_private_key(f.read(), password=os.environ['SNOWFLAKE_PRIVATE_KEY_PASSWORD'].encode())
private_key_der = private_key_obj.private_bytes(encoding=Encoding.DER, format=PrivateFormat.PKCS8, encryption_algorithm=NoEncryption())

conn = snowflake.connector.connect(
    account='HTWNYRU-CL36377',
    user='SDABABNEH',
    authenticator='snowflake',
    private_key=private_key_der,
    role='ACCOUNTADMIN',
    warehouse='COMPUTE_WH',
    database='PROCESSED_DATA_DB',
    schema='PUBLIC',
    autocommit=True,
    insecure_mode=True,
    ocsp_fail_open=True,
)
cursor = conn.cursor()
# Run queries...
conn.close()
```

**Key Tables:**
- `PROCESSED_DATA_DB.PUBLIC.MASTER_PROCESSED_DB` - ETL results (53 columns)
- `BULK_PROPERTY_DATA__NATIONAL_PRIVATE_SHARE.PUBLIC.*` - Source property data

**Utility Script:** `backend/scripts/analyze_master_processed_db.py` - Table analysis and JSON migration

## Claude Code Integration

### Deployment Workflow
1. Make code changes
2. Commit and push to GitHub
3. **DO NOT deploy** - User handles deployment manually

### Slash Commands
| Command | Purpose |
|---------|---------|
| `/recommend` | Interactive agent for feature planning and recommendations |
| `/add-endpoint <name> <method>` | Create FastAPI endpoint |
| `/add-migration <desc>` | Create Alembic migration |
| `/add-react-page <name>` | Create React page |
| `/add-full-stack-feature <name>` | Complete full-stack feature |
| `/debug-etl <job-id>` | Debug ETL job |
| `/lint [backend\|frontend\|all]` | Run linters |
| `/pre-deploy` | Pre-deployment checks |
| `/security-review` | Security audit |

### Rules (Auto-applied)
Rules in `.claude/rules/` apply by file path:
- `code-style.md` → Python/TypeScript
- `api-design.md` → API endpoints
- `database.md` → SQLAlchemy models
- `react.md` → React components
- `security.md` → All code

### Hooks
- `auto-format.sh` - Runs Black/Ruff/Prettier after edits
- `protect-secrets.py` - Blocks editing .env, secrets

### Protected Files (Cannot Edit)
`.env`, `backend/secrets/`, `*.pem`, `*.key`, `*.p8`, `credentials.json`

### Frontend Development Tools

**Recommendation Agent** (`/recommend`)
- Interactive AI assistant for feature planning
- Asks clarifying questions about requirements
- Suggests components, patterns, and implementation approach
- Provides step-by-step plan with file references
- Use for any new feature to ensure best practices

**Storybook Component Playground** ⭐
```bash
cd frontend && npm run storybook  # Opens on port 6006
# Access at: http://173.255.232.167:6006
```

**IMPORTANT - Storybook Requirement:**
- **ALWAYS create `.stories.tsx` files for ALL new React components**
- This is MANDATORY, not optional
- Stories serve as:
  - Visual documentation
  - Component testing playground
  - Design system reference
  - Development workflow tool

**Current Component Library:**
- `src/components/ui/` - Base UI components (Card, Button, StatusBadge)
- `src/components/features/dashboard/` - Dashboard components (DashboardMetricCard, QuickActionCard, ProcessingTrendsChart, ComplianceDonutChart)
- `src/components/features/jobs/` - Job management components (JobCreationCard, ActiveJobMonitor)
- `src/components/features/results/` - Results page components (various)
- `src/components/features/etl/` - ETL control components

**When Creating New Components:**
1. Create the component file: `ComponentName.tsx`
2. Create the story file: `ComponentName.stories.tsx` (REQUIRED)
3. Add both files to the appropriate directory
4. Include minimum 3-5 story variants (default, states, in-context example)
5. Export from `index.ts` for clean imports
6. Run Storybook to verify rendering

**Story Patterns to Follow:**
- See `src/components/features/dashboard/*.stories.tsx` for reference
- Include grid/layout examples for components used in groups
- Show all prop variations
- Include loading/disabled/error states
- Add "InContext" story showing real-world usage

**Complete Guide:** See `.claude/docs/feature-development-guide.md` for detailed workflows

### Decision Framework

Before implementing ANY task:
1. Check `.claude/commands/` for applicable slash command
2. Check `.claude/rules/` for patterns
3. Use Explore agent for codebase understanding
4. Use parallel tool calls for independent operations

| Task Type | Use |
|-----------|-----|
| Planning new feature | `/recommend` (get recommendations first) |
| New endpoint | `/add-endpoint` |
| New migration | `/add-migration` |
| New React page | `/add-react-page` |
| Full-stack feature | `/add-full-stack-feature` |
| Preview UI components | Storybook (`npm run storybook`) |
| ETL debugging | `/debug-etl` or ETL Specialist agent |
| API review | API Architect agent |

*Last updated: December 2024*
