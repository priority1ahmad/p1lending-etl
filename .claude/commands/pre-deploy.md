# Pre-Deployment Checklist

Run a comprehensive pre-deployment verification for production readiness.

## Deployment Target
$ARGUMENTS

(e.g., "EC2 production", "staging", or leave empty for general check)

## Instructions

### 1. Code Quality Checks

```bash
# Backend linting (if configured)
cd backend
pip install flake8 black isort
flake8 app/ --max-line-length=120
black app/ --check
isort app/ --check-only

# Frontend linting
cd frontend
npm run lint
npm run build  # Verify build succeeds
```

### 2. Environment Configuration

Verify `env.example` vs `.env`:

**Required variables** (must not be empty or default):
- [ ] `POSTGRES_PASSWORD` - Not "changeme" or default
- [ ] `SECRET_KEY` - Generated unique key
- [ ] `SNOWFLAKE_PRIVATE_KEY_PASSWORD`
- [ ] `CCC_API_KEY`
- [ ] `IDICORE_CLIENT_ID`
- [ ] `IDICORE_CLIENT_SECRET`
- [ ] `GOOGLE_SHEET_ID`
- [ ] `CORS_ORIGINS` - Includes production domain

### 3. Secrets Verification

Check files exist:
- [ ] `backend/secrets/rsa_key.p8` - Snowflake key
- [ ] `backend/secrets/google_credentials.json` - Google auth
- [ ] Verify permissions: `chmod 600 backend/secrets/*`

### 4. Docker Configuration

Review `docker-compose.prod.yml`:
- [ ] Correct image versions
- [ ] Volume mounts for persistence
- [ ] Health checks configured
- [ ] Resource limits set (if needed)
- [ ] DNC database path: `/home/ubuntu/etl_app/dnc_database.db`

### 5. Database Readiness

```bash
# Check migrations are up to date
cd backend
alembic history
alembic current

# Verify initial user exists (or will be created)
python scripts/create_initial_user.py --check
```

### 6. External Service Connectivity

Test from deployment environment:
```bash
# Snowflake
python scripts/test_snowflake_connection.py

# idiCORE API
curl -X POST https://login-api.idicore.com/apiclient \
  -H "Authorization: Basic <encoded_creds>" \
  -H "Content-Type: application/json" \
  -d '{"glba":"otheruse","dppa":"none"}'

# CCC API
curl "https://dataapi.dncscrub.com/v1.4/scrub/litigator?phoneNumbers=5551234567" \
  -H "x-api-key: $CCC_API_KEY"

# Google Sheets (test write access)
python -c "from app.services.etl.google_sheets_service import GoogleSheetsConnection; g = GoogleSheetsConnection(); print('OK' if g.connect() else 'FAIL')"
```

### 7. Security Checklist

- [ ] Default admin password changed from `admin123`
- [ ] No hardcoded credentials in committed code
- [ ] HTTPS enforced (nginx or load balancer)
- [ ] CORS properly restricted
- [ ] JWT secret is unique and strong
- [ ] Debug mode disabled in production

### 8. Resource Requirements

Verify server has:
- [ ] Minimum 4GB RAM (for ETL processing + pandas)
- [ ] 50GB+ disk (for DNC database + logs)
- [ ] Docker and Docker Compose installed
- [ ] Ports 80, 8000, 5433, 6380 available

### 9. Backup Strategy

- [ ] PostgreSQL backup configured
- [ ] DNC database backup plan
- [ ] Log rotation configured

### 10. Rollback Plan

Document:
- Previous working commit hash
- Database rollback procedure
- Quick revert commands

## Output

Provide a checklist report:
- **PASS**: Items verified OK
- **FAIL**: Items that need attention (with fix instructions)
- **WARN**: Recommendations for improvement

Include commands to fix any FAIL items.
