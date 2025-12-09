# CLAUDE.md - P1Lending ETL System

> This document provides comprehensive context for Claude (or future developers) working on this codebase.

---

# OPERATING FRAMEWORK

> **This framework fundamentally changes how Claude approaches every task. Follow these principles strictly.**

---

## Section 1: Core Operating Principles

### 1. Clarity Over Speed
**Never proceed with ambiguity.** If the request is unclear, ask clarifying questions. It's better to slow down and get it right than to build the wrong thing fast.

- Rate every request on a clarity scale of 0-10
- If clarity < 7, invoke `/clarify` before proceeding
- Document what you understand and what's unclear

### 2. Think First, Code Second
**Before any implementation, fully understand the problem.** If you can't explain the solution clearly, you're not ready to build it.

- Articulate the problem in your own words
- Identify the root cause, not just symptoms
- Consider alternative approaches before committing

### 3. Comprehensive Planning
**Every task requires a prioritized implementation plan before any code is written.** No exceptions.

- Use `/plan` for any non-trivial task
- Break complex tasks into numbered, prioritized steps
- Identify dependencies and potential blockers
- Await user confirmation before executing

### 4. User Story Thinking
**For every feature, think through ALL possible user stories and edge cases.**

Consider:
- Who uses this? (all user types)
- How do they use it? (happy paths)
- What could go wrong? (sad paths)
- What are the boundary conditions? (edge cases)
- How do they recover from errors?

### 5. Red Team Your Own Work
**Before presenting any solution, critique it from multiple angles.** Find the weaknesses before they become problems.

- What could break this?
- How could this be misused?
- What are the performance implications?
- What are the security implications?
- What would a skeptical reviewer say?

---

## Section 2: Task Intake Template

For complex tasks, request that the user fill out the template at:
```
.claude/templates/task-intake.md
```

This template covers:
- **What I Need** - Goal in plain language
- **Context** - Current state, relevant files, constraints
- **Success Looks Like** - Definition of done
- **Priority** - Must have / Nice to have / Out of scope

**Claude's Responsibility:** Derive user stories, edge cases, security considerations, and select appropriate expertise. If any section is unclear or missing critical information, ask before proceeding.

---

## Section 3: Response Protocol

**Before responding to ANY implementation request, you MUST:**

### Step 1: Assess Clarity (0-10 scale)
```
Clarity Score: [X/10]

What I understand:
- [Point 1]
- [Point 2]

What's unclear:
- [Question 1]
- [Question 2]
```

**If clarity < 7:** Ask targeted questions before proceeding. Use `/clarify`.

### Step 2: Present Implementation Plan
```
## Implementation Plan

| # | Task | Complexity | Dependencies | Risk |
|---|------|------------|--------------|------|
| 1 | [Description] | Low/Med/High | None | [Risk] |
| 2 | [Description] | Low/Med/High | #1 | [Risk] |

Estimated total complexity: [Simple/Medium/Complex/Epic]
```

### Step 3: User Story Analysis
```
## User Stories Identified

1. As a [user], I want [goal] so that [benefit]
   - Happy path: [description]
   - Edge cases: [list]
   - Error states: [list]
```

### Step 4: Agent Assignment
```
## Execution Workflow

1. /plan → Create detailed plan
2. [Implementation] → Write code
3. /security → Security review (automatic)
4. /docs → Documentation update (automatic)
5. /test → Generate tests
6. /review → Final critique
```

### Step 5: Await Confirmation
```
Please review the plan above.
- Reply "proceed" or "go" to execute
- Reply with modifications to adjust

⚠️ I will NOT proceed until you confirm.
```

**Exception:** If user says "just do it" or "proceed", execute immediately.

---

## Section 4: Mandatory Agents

The following agents are available via slash commands:

| Agent | Command | Purpose | When to Use |
|-------|---------|---------|-------------|
| Orchestrator | `/plan` | Creates implementation plans | First on complex tasks |
| Questioner | `/clarify` | Generates clarifying questions | When request is ambiguous |
| Documentation | `/docs` | Updates all documentation | After any code changes |
| Security | `/security` | OWASP security review | After any code changes |
| Testing | `/test` | Generates comprehensive tests | For new functionality |
| Critic | `/review` | Red team review | Before considering work done |
| Product | `/user-stories` | Generates user stories | For feature requests |

### Agent Locations
```
.claude/commands/
├── plan.md          # The Orchestrator
├── clarify.md       # The Questioner
├── docs.md          # Documentation Agent
├── security.md      # Security Agent
├── test.md          # Testing Agent
├── review.md        # The Critic
└── user-stories.md  # Product Thinker
```

---

## Section 5: Automatic Workflows

### On Any Code Change
```
[Code Change Complete]
        │
        ├──▶ /security (automatic)
        │         │
        │         ▼
        │    [Security Report]
        │         │
        │         ├── Critical issues? → BLOCK
        │         └── No issues? → Continue
        │
        └──▶ /docs (automatic)
                  │
                  ▼
             [Docs Updated]
```

### On Feature Request
```
[Feature Request]
        │
        ▼
   /clarify (if ambiguous)
        │
        ▼
      /plan
        │
        ▼
   /user-stories
        │
        ▼
   [AWAIT APPROVAL]
        │
        ▼
   [Implementation]
        │
        ├──▶ /security
        ├──▶ /docs
        │
        ▼
     /review
        │
        ▼
     [DONE]
```

### On Bug Report
```
[Bug Report]
        │
        ▼
   /clarify (get repro steps)
        │
        ▼
      /plan (identify fix)
        │
        ▼
   /security (check if security-related)
        │
        ▼
   [Implement Fix]
        │
        ▼
     /test (add regression test)
        │
        ▼
     [DONE]
```

---

## Section 6: Interaction Style

### Be Direct About Uncertainty
- Say: "I need more information about X"
- Don't say: "I'll make some assumptions about X"

### Present Plans Visually
Use tables, numbered lists, and ASCII diagrams when helpful.

### Always Explain WHY
Don't just say what to do—explain the reasoning.

### Challenge Mistakes Clearly
If the user is making a mistake, say so directly and explain why.

### Celebrate Wins Briefly
Acknowledge success, then move on to the next task.

### No Time Estimates
Never suggest timelines. Focus on WHAT needs to be done, not WHEN.

---

## Section 7: Quality Gates

### Before Starting Implementation
- [ ] Clarity score ≥ 7
- [ ] Implementation plan approved
- [ ] User stories documented
- [ ] Edge cases identified

### Before Considering Code Complete
- [ ] All planned tasks completed
- [ ] /security passed (no critical/high issues)
- [ ] /docs ran and documentation updated
- [ ] /test generated appropriate tests
- [ ] /review completed with no blocking issues

### Before Any Merge/Deploy
- [ ] All tests passing
- [ ] Security review approved
- [ ] Documentation current
- [ ] Code reviewed

---

# PROJECT DOCUMENTATION

> The following sections contain project-specific context for the P1Lending ETL system.

---

## Project Overview

**P1Lending ETL** is a mortgage lead data enrichment and compliance scrubbing system. It extracts lead data from Snowflake, enriches it with real phone numbers and emails via idiCORE API, validates against DNC (Do Not Call) lists and litigator databases, and outputs clean leads to Google Sheets.

### Problem Solved
- Automates the process of enriching mortgage lead data with verified contact information
- Performs compliance scrubbing (DNC lists, litigator lists) to avoid legal issues
- Replaces a legacy Flask-based application with a modern, scalable architecture

### Business Flow
1. User selects SQL script(s) defining lead criteria from Snowflake
2. System queries Snowflake for raw lead data
3. Each record is enriched via idiCORE API (real phone numbers, emails)
4. Phone numbers are checked against CCC Litigator API and local DNC database
5. Enriched, validated data is uploaded to Google Sheets
6. Processed records are cached in Snowflake to avoid reprocessing

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
| Snowflake | Source data warehouse + cache tables |
| idiCORE API | Real phone number & email lookup |
| CCC/DNC Scrub API | Litigator list checking |
| Google Sheets API | Output destination |
| SQLite | Local DNC database lookup |

---

## Architecture

### Directory Structure

```
new_app/
├── backend/
│   ├── app/
│   │   ├── api/v1/              # REST API endpoints
│   │   │   ├── endpoints/       # Route handlers
│   │   │   │   ├── auth.py      # Authentication (login, refresh, logout)
│   │   │   │   ├── jobs.py      # ETL job management
│   │   │   │   ├── sql_scripts.py # SQL script CRUD
│   │   │   │   ├── config.py    # Runtime configuration
│   │   │   │   └── health.py    # Health checks
│   │   │   ├── deps.py          # Dependency injection (auth, db)
│   │   │   └── router.py        # Router aggregation
│   │   ├── core/                # Core utilities
│   │   │   ├── config.py        # Pydantic Settings configuration
│   │   │   ├── security.py      # JWT token handling, password hashing
│   │   │   ├── logger.py        # ETL logging utilities
│   │   │   └── exceptions.py    # Custom exceptions
│   │   ├── db/                  # Database layer
│   │   │   ├── models/          # SQLAlchemy models
│   │   │   │   ├── user.py      # User model
│   │   │   │   ├── job.py       # ETLJob, JobLog models
│   │   │   │   ├── sql_script.py # SQLScript model
│   │   │   │   └── config.py    # Config model (key-value store)
│   │   │   ├── session.py       # Async database session
│   │   │   └── base.py          # SQLAlchemy Base
│   │   ├── schemas/             # Pydantic schemas (API validation)
│   │   ├── services/etl/        # ETL business logic (CORE)
│   │   │   ├── engine.py        # Main ETL orchestrator
│   │   │   ├── snowflake_service.py  # Snowflake connection
│   │   │   ├── idicore_service.py    # idiCORE API client
│   │   │   ├── ccc_service.py        # CCC Litigator API
│   │   │   ├── dnc_service.py        # DNC database checker
│   │   │   ├── google_sheets_service.py # Google Sheets upload
│   │   │   └── cache_service.py      # Person/phone caching
│   │   ├── websockets/          # Real-time communication
│   │   │   └── job_events.py    # Socket.io handlers + Redis pub/sub
│   │   ├── workers/             # Celery tasks
│   │   │   ├── celery_app.py    # Celery configuration
│   │   │   ├── etl_tasks.py     # ETL job execution task
│   │   │   └── db_helper.py     # Sync DB operations for Celery
│   │   └── main.py              # FastAPI app entry point
│   ├── alembic/                 # Database migrations
│   │   └── versions/            # Migration files
│   ├── scripts/                 # Utility scripts
│   │   ├── create_initial_user.py
│   │   ├── migrate_sql_scripts.py
│   │   └── test_*.py            # Test scripts
│   ├── sql/                     # SQL query files (templates)
│   ├── secrets/                 # Credentials (git-ignored)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── layout/          # AppBar, ProtectedRoute
│   │   │   └── common/          # Shared components
│   │   ├── pages/               # Page components
│   │   │   ├── Dashboard.tsx    # Main ETL dashboard
│   │   │   ├── SqlFiles.tsx     # SQL script management
│   │   │   ├── SqlEditor.tsx    # Monaco SQL editor
│   │   │   ├── Configuration.tsx # Settings page
│   │   │   └── Login.tsx        # Authentication
│   │   ├── services/api/        # API client functions
│   │   ├── stores/              # Zustand state stores
│   │   │   └── authStore.ts     # Authentication state
│   │   ├── utils/               # Utility functions
│   │   │   └── api.ts           # Axios instance
│   │   ├── theme/               # MUI theme configuration
│   │   ├── App.tsx              # Root component with routing
│   │   └── main.tsx             # Entry point
│   ├── Dockerfile               # Multi-stage build (build + nginx)
│   ├── nginx.conf               # Nginx configuration
│   └── package.json
├── docker-compose.yml           # Development (postgres, redis only)
├── docker-compose.prod.yml      # Production (all services)
├── deploy.sh                    # Deployment script
├── .env                         # Environment variables (git-ignored)
└── env.example                  # Environment template
```

### Data Flow

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Frontend  │───▶│   FastAPI    │───▶│   Celery    │
│   (React)   │◀───│   Backend    │◀───│   Worker    │
└─────────────┘    └──────────────┘    └─────────────┘
       │                  │                   │
       │ WebSocket        │ REST API          │
       │ (Socket.io)      │                   │
       │                  ▼                   │
       │           ┌──────────────┐           │
       └──────────▶│    Redis     │◀──────────┘
                   │  (pub/sub)   │
                   └──────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │  PostgreSQL  │
                   │   (jobs,     │
                   │   scripts)   │
                   └──────────────┘
```

### ETL Pipeline Flow

```
1. SQL Query (Snowflake) ──▶ Raw Leads DataFrame
                                    │
2. Filter Already Processed ◀───────┤ (Check PERSON_CACHE)
                                    │
3. idiCORE API Lookup ◀─────────────┤ (Batch: 150 records)
   - Get real phone numbers         │
   - Get email addresses            │
                                    │
4. Litigator Check ◀────────────────┤ (CCC API, 8 threads)
                                    │
5. DNC Check ◀──────────────────────┤ (SQLite local DB)
                                    │
6. Upload to Google Sheets ◀────────┤ (Batch upload)
                                    │
7. Cache in Snowflake ◀─────────────┘ (UNIQUE_CONSOLIDATED_DATA)
```

---

## Key Files

### Entry Points
| File | Description |
|------|-------------|
| `backend/app/main.py` | FastAPI application entry, CORS, Socket.io mount |
| `frontend/src/main.tsx` | React entry point |
| `frontend/src/App.tsx` | Root component with routing |

### Core Business Logic
| File | Description |
|------|-------------|
| `backend/app/services/etl/engine.py` | **Main ETL orchestrator** - coordinates all services |
| `backend/app/workers/etl_tasks.py` | Celery task that executes ETL jobs |
| `backend/app/services/etl/idicore_service.py` | idiCORE API integration for phone/email lookup |
| `backend/app/services/etl/snowflake_service.py` | Snowflake database operations |

### Configuration
| File | Description |
|------|-------------|
| `backend/app/core/config.py` | Pydantic Settings (all env vars) |
| `env.example` | Environment variable template |
| `docker-compose.prod.yml` | Production Docker configuration |

### Database
| File | Description |
|------|-------------|
| `backend/app/db/models/job.py` | ETLJob model (status, progress, stats) |
| `backend/alembic/versions/` | Database migrations |

---

## Patterns & Conventions

### Backend Patterns

1. **Dependency Injection** (`deps.py`)
   ```python
   async def get_current_user(token: str = Depends(oauth2_scheme)) -> User
   async def get_db() -> AsyncSession
   ```

2. **Pydantic Settings** - All configuration via environment variables
   ```python
   class Settings(BaseSettings):
       model_config = SettingsConfigDict(env_file=".env")
   ```

3. **Async/Await** - All database operations are async (SQLAlchemy async mode)

4. **Celery for Background Jobs** - Long-running ETL tasks execute in Celery workers

5. **Redis Pub/Sub for Real-time** - Celery publishes events, WebSocket subscribes

6. **Service Layer Pattern** - Business logic in `services/etl/`, not in endpoints

### Frontend Patterns

1. **Zustand for State** - Simple, minimal state management
   ```typescript
   const useAuthStore = create<AuthState>()(persist(...))
   ```

2. **TanStack Query for Server State** - API data fetching/caching

3. **Protected Routes** - `<ProtectedRoute>` component wraps authenticated pages

4. **Material UI v7** - Consistent theming via `theme/index.ts`

### Naming Conventions

- **Python**: snake_case for variables/functions, PascalCase for classes
- **TypeScript**: camelCase for variables/functions, PascalCase for components/types
- **Files**: snake_case (Python), PascalCase (React components)
- **Database columns**: snake_case
- **API endpoints**: kebab-case URLs, snake_case JSON keys

---

## Git History Analysis

### Recent Activity Themes (Last 2 weeks)
1. **Preview Feature** - Added mandatory preview before ETL execution
2. **DNC Database Fixes** - Production path configuration, volume mounting
3. **Real-time Updates** - Fix logging and row-by-row progress
4. **Performance** - Limit preview display to 100 rows for RAM savings

### Commit Message Patterns
- `Fix ...` - Bug fixes
- `Add ...` - New features
- `Update ...` - Modifications to existing features
- Descriptive, imperative mood

---

## Build & Run

### Development Setup

```bash
# 1. Start infrastructure (PostgreSQL, Redis)
docker-compose up -d

# 2. Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
python scripts/create_initial_user.py

# 3. Frontend setup
cd frontend
npm install

# 4. Run services (3 terminals)
# Terminal 1: Backend
uvicorn app.main:app --reload

# Terminal 2: Celery Worker
celery -A app.workers.celery_app worker --loglevel=info

# Terminal 3: Frontend
npm run dev
```

### Production Deployment

```bash
# Configure environment
cp env.example .env
nano .env  # Edit credentials

# Set up secrets
mkdir -p backend/secrets
cp /path/to/rsa_key.p8 backend/secrets/
cp /path/to/google_credentials.json backend/secrets/

# Deploy
./deploy.sh
```

### Docker Commands

```bash
# Production
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml logs -f
docker-compose -f docker-compose.prod.yml down

# Access container shell
docker-compose -f docker-compose.prod.yml exec backend bash
```

### URLs

| Environment | Frontend | Backend API | API Docs |
|-------------|----------|-------------|----------|
| Development | http://localhost:3000 | http://localhost:8000 | http://localhost:8000/docs |
| Production | http://host:80 | http://host:8000 | http://host:8000/docs |

---

## Testing

### Manual Testing Scripts

Located in `backend/scripts/`:

```bash
# Test DNC list lookup
python scripts/test_dnc_list.py

# Test litigator API
python scripts/test_litigator_list.py

# Test both
python scripts/test_both_lists.py
```

### Running Tests in Container

```bash
docker-compose -f docker-compose.prod.yml exec backend python scripts/test_both_lists.py
```

### No Automated Test Suite
Currently, there are no automated unit/integration tests. The codebase has test scripts for manual verification of external services.

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | PostgreSQL password | `secure_password` |
| `SECRET_KEY` | JWT signing key | `generate-with-secrets-module` |
| `SNOWFLAKE_PRIVATE_KEY_PASSWORD` | Snowflake key password | `your_password` |
| `GOOGLE_SHEET_ID` | Target Google Sheet | `19NHuPsT...` |
| `CCC_API_KEY` | CCC/DNC scrubbing API key | `010E6C...` |
| `IDICORE_CLIENT_ID` | idiCORE API client ID | `api-client@p1l` |
| `IDICORE_CLIENT_SECRET` | idiCORE API secret | `RGemru...` |

### Secrets Files

| File | Description |
|------|-------------|
| `backend/secrets/rsa_key.p8` | Snowflake private key |
| `backend/secrets/google_credentials.json` | Google Service Account |
| `dnc_database.db` | SQLite DNC database (production: `/home/ubuntu/etl_app/`) |

---

## Dependencies Notes

### Backend Key Dependencies
- `snowflake-connector-python` - Snowflake database driver
- `google-api-python-client` - Google Sheets API
- `pandas` - Data manipulation
- `python-socketio` - WebSocket support
- `psycopg2-binary` - Sync PostgreSQL for Celery

### Frontend Key Dependencies
- `@monaco-editor/react` - SQL code editor
- `socket.io-client` - Real-time job updates
- `axios` - HTTP client

### No Outdated Dependencies Detected
Dependencies appear to be recent versions as of the project creation.

---

## Known Issues & Technical Debt

### No TODO/FIXME Comments Found
The codebase is clean of inline TODO markers.

### Potential Areas for Improvement

1. **No Automated Tests** - Consider adding pytest for backend, Vitest for frontend

2. **Hardcoded Defaults in Config** - Some API credentials have defaults in `config.py` (should only be in `.env`)

3. **Windows Compatibility** - Celery uses `solo` pool on Windows (limited parallelism)

4. **DNC Database Size** - 20GB+ SQLite database mounted in production

5. **Duplicate WebSocket Connect Handler** - `backend/app/websockets/job_events.py` has duplicate `@sio.event async def connect` decorators

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
POST /api/v1/jobs/          - Start ETL job
GET  /api/v1/jobs/          - List jobs
GET  /api/v1/jobs/{id}      - Get job status
POST /api/v1/jobs/{id}/cancel - Cancel job
POST /api/v1/jobs/preview   - Preview data (dry run)
```

### SQL Scripts
```
GET  /api/v1/scripts/       - List scripts
POST /api/v1/scripts/       - Create script
GET  /api/v1/scripts/{id}   - Get script
PUT  /api/v1/scripts/{id}   - Update script
DELETE /api/v1/scripts/{id} - Delete script
```

### WebSocket Events
```
join_job      - Subscribe to job updates
leave_job     - Unsubscribe from job
job_progress  - Progress update (%)
job_log       - Log entry
job_complete  - Job finished successfully
job_error     - Job failed
batch_progress - Batch processing update
row_processed - Individual row update
```

---

## Default Credentials

**Initial Admin User:**
- Email: `admin@p1lending.com`
- Password: `admin123`

**Change immediately after deployment!**

---

## Useful Commands

```bash
# Create new user
docker-compose -f docker-compose.prod.yml exec backend python scripts/create_user.py

# Run Alembic migration
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# View Celery worker logs
docker-compose -f docker-compose.prod.yml logs -f celery-worker

# Migrate SQL scripts to database
docker-compose -f docker-compose.prod.yml exec backend python scripts/migrate_sql_scripts.py
```

---

*Last updated: December 2024*
