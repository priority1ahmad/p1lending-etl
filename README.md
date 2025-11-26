# P1Lending ETL System

Modern full-stack ETL system for mortgage lead data enrichment and compliance scrubbing.

## Technology Stack

### Frontend
- React 18+ with TypeScript
- Vite for build tooling
- Material UI (MUI) v5+
- React Router v6
- TanStack Query for server state
- Zustand for client state
- Socket.io-client for real-time updates

### Backend
- FastAPI (Python 3.11+)
- SQLAlchemy with async support
- Pydantic v2 for validation
- Celery with Redis for background jobs
- Socket.io for WebSocket communication

### Database & Infrastructure
- PostgreSQL for application data
- Redis for Celery broker and caching
- Snowflake for source data and cache tables
- Google Sheets API for output
- SQLite for DNC list lookup
- Docker & Docker Compose for deployment

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Clone & Deploy (Production)

```bash
# Clone the repository
git clone https://github.com/priority1ahmad/p1lending-etl.git
cd p1lending-etl

# Configure environment
cp env.example .env
nano .env  # Edit with your credentials

# Set up secrets
mkdir -p backend/secrets
cp /path/to/rsa_key.p8 backend/secrets/
cp /path/to/google_credentials.json backend/secrets/

# Deploy with Docker
chmod +x deploy.sh
./deploy.sh
```

Access the app at: **http://localhost:8080**

Default credentials: `admin@p1lending.com` / `admin123` (change immediately!)

---

## Local Development

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker and Docker Compose (for PostgreSQL & Redis)

### Installation

1. **Start infrastructure services**
   ```bash
   docker-compose up -d
   ```

2. **Set up backend**
   ```bash
   cd backend
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   # On Linux/Mac:
   source venv/bin/activate
   
   pip install -r requirements.txt
   alembic upgrade head
   python scripts/create_initial_user.py
   ```

3. **Set up frontend**
   ```bash
   cd frontend
   npm install
   ```

### Running Development Servers

**Backend** (runs on http://localhost:8000):
```bash
cd backend
uvicorn app.main:app --reload
```

**Celery Worker** (for background ETL jobs):
```bash
cd backend
celery -A app.workers.celery_app worker --loglevel=info
```

**Frontend** (runs on http://localhost:3000):
```bash
cd frontend
npm run dev
```

Or use the batch files (Windows):
- `start-backend.bat`
- `start-celery.bat`
- `start-frontend.bat`

---

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed EC2 deployment instructions.

### Port Summary

| Service    | Development | Production (Docker) |
|------------|-------------|---------------------|
| Frontend   | 3000        | 8080                |
| Backend    | 8000        | 8000                |
| PostgreSQL | 5432        | 5433                |
| Redis      | 6379        | 6380                |

### Docker Commands

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down

# Rebuild after code changes
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

---

## API Documentation

Once the backend is running:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## Project Structure

```
p1lending-etl/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API endpoints
│   │   ├── core/            # Configuration, security, logging
│   │   ├── db/models/       # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/etl/    # ETL business logic
│   │   ├── websockets/      # Socket.io events
│   │   └── workers/         # Celery tasks
│   ├── alembic/             # Database migrations
│   ├── scripts/             # Utility scripts
│   ├── sql/                 # SQL query files
│   ├── secrets/             # Credentials (git-ignored)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/api/    # API client
│   │   ├── stores/          # Zustand stores
│   │   └── theme/           # MUI theme
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml       # Development infrastructure
├── docker-compose.prod.yml  # Production deployment
├── deploy.sh                # Deployment script
├── env.example              # Environment template
├── nginx-host.conf          # Optional host nginx config
├── DEPLOYMENT.md            # Deployment guide
└── README.md
```

---

## Environment Variables

Copy `env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | Database password |
| `SECRET_KEY` | JWT signing key (generate with `python -c "import secrets; print(secrets.token_urlsafe(32))"`) |
| `SNOWFLAKE_*` | Snowflake connection settings |
| `GOOGLE_SHEET_ID` | Target Google Sheet ID |
| `CCC_API_KEY` | CCC/DNC scrubbing API key |
| `IDICORE_*` | idiCORE API credentials |

---

## Migration from Old Flask App

This application modernizes the legacy Flask-based ETL system:

| Feature | Old App | New App |
|---------|---------|---------|
| Authentication | Flask sessions | JWT tokens |
| Database | File-based | PostgreSQL |
| Background Jobs | Threading | Celery + Redis |
| Real-time Updates | Polling | WebSocket (Socket.io) |
| Frontend | Flask templates | React + MUI |
| Deployment | Manual | Docker Compose |

### Migrating Data

```bash
# Copy cache files
cp old_app/person_cache.csv backend/secrets/
cp old_app/phone_cache.csv backend/secrets/
cp old_app/dnc_database.db backend/secrets/
```

---

## License

Proprietary - Priority1 Lending
