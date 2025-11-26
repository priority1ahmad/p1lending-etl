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

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker and Docker Compose
- Snowflake account and credentials
- Google Sheets API credentials
- idiCORE API credentials
- CCC API credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd new_app
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Start infrastructure services**
   ```bash
   docker-compose up -d
   ```

4. **Set up backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   alembic upgrade head
   ```

5. **Set up frontend**
   ```bash
   cd frontend
   npm install
   ```

### Development

**Backend:**
```bash
cd backend
uvicorn app.main:app --reload
```

**Celery Worker:**
```bash
cd backend
celery -A app.workers.celery_app worker --loglevel=info
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## Migration from Old Flask App

This application is a modernization of the Flask-based ETL system. Key changes:

- **Authentication**: Migrated from Flask sessions to JWT tokens
- **Database**: SQL scripts moved from file-based to PostgreSQL storage
- **Background Jobs**: Replaced Flask threading with Celery workers
- **Real-time Updates**: Replaced polling with WebSocket (Socket.io)
- **Frontend**: Replaced Flask templates with React + MUI

### Initial Setup

1. **Create initial admin user:**
   ```bash
   cd backend
   python scripts/create_initial_user.py
   ```
   Default credentials: `admin@p1lending.com` / `admin123` (change immediately!)

2. **Run database migrations:**
   ```bash
   cd backend
   alembic upgrade head
   ```

3. **Migrate SQL Scripts:**
   ```bash
   cd backend
   python scripts/migrate_sql_scripts.py
   ```

### Migrating Cache Data (Optional)

If you have existing cache files:
```bash
# Copy cache files to backend/data/
cp old_app/person_cache.csv backend/data/
cp old_app/phone_cache.csv backend/data/
cp old_app/dnc_database.db backend/data/
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
new_app/
├── frontend/          # React + Vite frontend
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/      # API endpoints
│   │   ├── core/     # Core configuration
│   │   ├── db/       # Database models
│   │   ├── services/ # Business logic
│   │   └── workers/  # Celery tasks
│   └── sql/          # SQL script files
├── docker-compose.yml
└── README.md
```

## License

Proprietary - Priority1 Lending

