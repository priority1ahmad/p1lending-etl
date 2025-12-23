---
allowed-tools: Bash, Read, AskUserQuestion, TodoWrite
description: Unified database management operations
argument-hint: <operation> [args]
---

## Task
Execute database management operation: **$1** $2

## Available Operations

### 1. backup
**Purpose**: Backup SQL scripts to JSON file
**Usage**: `/db-manage backup`

**Actions**:
- Creates timestamped backup in `backend/backups/sql_scripts_YYYYMMDD_HHMMSS.json`
- Includes all SQL scripts from database
- Safe to run anytime (read-only operation)

**Command**:
```bash
docker compose -f docker-compose.prod.yml exec backend python scripts/backup_sql_scripts.py
```

---

### 2. restore
**Purpose**: Restore SQL scripts from JSON backup
**Usage**: `/db-manage restore [backup-file]`

**Actions**:
- **REQUIRES CONFIRMATION** via AskUserQuestion
- Lists available backups in `backend/backups/`
- Restores SQL scripts from specified backup
- Overwrites existing scripts with matching names

**Safety checks**:
- Ask user to confirm which backup file to restore
- Warn about overwriting existing data
- Show backup file timestamp and size

**Commands**:
```bash
# List backups
ls -lh backend/backups/sql_scripts_*.json

# Restore (after confirmation)
docker compose -f docker-compose.prod.yml exec backend python scripts/restore_sql_scripts.py
```

---

### 3. verify-snowflake
**Purpose**: Verify Snowflake table structure and connectivity
**Usage**: `/db-manage verify-snowflake`

**Actions**:
- Tests Snowflake connection
- Shows `MASTER_PROCESSED_DB` table structure
- Displays row count
- Shows sample records (first 5 rows)
- Verifies all required columns exist

**Command**:
```bash
docker compose -f docker-compose.prod.yml exec backend python scripts/verify_snowflake_table.py
```

---

### 4. migrations
**Purpose**: Show database migration status
**Usage**: `/db-manage migrations`

**Actions**:
- Show current migration version
- Show pending migrations (if any)
- List recent migration history
- Display migration details

**Commands**:
```bash
# Current version
cd backend && alembic current

# Check for pending migrations
cd backend && alembic check

# Show history
cd backend && alembic history | head -20
```

---

### 5. migrate-up
**Purpose**: Run pending database migrations
**Usage**: `/db-manage migrate-up`

**Actions**:
- Shows current version first
- Runs all pending migrations
- Shows new current version
- **REQUIRES CONFIRMATION** for production

**Safety checks**:
- Ask user to confirm environment (dev/staging/production)
- Warn about production migrations
- Show which migrations will be applied

**Commands**:
```bash
# Development
cd backend && alembic upgrade head

# Production (in container)
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

---

### 6. migrate-down
**Purpose**: Rollback last migration
**Usage**: `/db-manage migrate-down [steps]`

**Actions**:
- **REQUIRES CONFIRMATION** via AskUserQuestion
- Shows which migration will be rolled back
- Rolls back specified number of steps (default: 1)
- Shows new current version

**Safety checks**:
- **NEVER run in production without explicit user request**
- Ask for confirmation with migration details
- Warn about data loss potential

**Commands**:
```bash
# Rollback 1 step (after confirmation)
cd backend && alembic downgrade -1

# Rollback N steps
cd backend && alembic downgrade -N
```

---

### 7. reset-dev
**Purpose**: Reset development database (DROP ALL DATA)
**Usage**: `/db-manage reset-dev`

**Actions**:
- **REQUIRES CONFIRMATION** via AskUserQuestion
- **ONLY works in development environment**
- Drops all tables
- Runs all migrations from scratch
- Creates initial admin user

**Safety checks**:
- Verify not running in production (check docker-compose file)
- Ask for EXPLICIT confirmation
- Show warning about data loss
- Require user to type "RESET" to confirm

**Commands**:
```bash
# Stop services
docker compose down

# Remove volume
docker volume rm new_app_postgres_data

# Restart services
docker compose up -d postgres redis

# Wait for postgres
sleep 5

# Run migrations
cd backend && alembic upgrade head

# Create initial user
cd backend && python scripts/create_initial_user.py
```

---

### 8. test-connections
**Purpose**: Test all database and API connections
**Usage**: `/db-manage test-connections`

**Actions**:
- Test PostgreSQL connection
- Test Redis connection
- Test Snowflake connection
- Test idiCORE API
- Test CCC Litigator API
- Test DNC database (SQLite)
- Show status for each

**Commands**:
```bash
# PostgreSQL
docker compose -f docker-compose.prod.yml exec postgres pg_isready

# Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli ping

# All external APIs
docker compose -f docker-compose.prod.yml exec backend python scripts/test_both_lists.py
```

---

### 9. pg-backup
**Purpose**: Create PostgreSQL database backup
**Usage**: `/db-manage pg-backup`

**Actions**:
- Creates full database dump
- Saves to `backups/postgres_YYYYMMDD_HHMMSS.sql`
- Compresses with gzip
- Shows backup file size

**Commands**:
```bash
# Create backup directory
mkdir -p backups

# Create backup
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U p1lending p1lending_etl | gzip > backups/postgres_$(date +%Y%m%d_%H%M%S).sql.gz

# Show size
ls -lh backups/postgres_*.sql.gz | tail -5
```

---

### 10. pg-restore
**Purpose**: Restore PostgreSQL database from backup
**Usage**: `/db-manage pg-restore [backup-file]`

**Actions**:
- **REQUIRES CONFIRMATION** via AskUserQuestion
- Lists available backups
- Restores database from specified backup
- **DESTRUCTIVE OPERATION** - drops existing database

**Safety checks**:
- **NEVER run in production without explicit confirmation**
- Ask user to select backup file
- Show backup timestamp and size
- Require explicit confirmation

**Commands**:
```bash
# List backups
ls -lh backups/postgres_*.sql.gz

# Restore (after confirmation)
gunzip -c [backup-file] | docker compose -f docker-compose.prod.yml exec -T postgres psql -U p1lending p1lending_etl
```

---

## Operation Selection Logic

If no operation specified, ask user via AskUserQuestion:

**Question**: "Which database operation would you like to perform?"

**Options**:
1. **backup** - Backup SQL scripts
2. **migrations** - Check migration status
3. **verify-snowflake** - Test Snowflake connection
4. **test-connections** - Test all connections
5. **Other operations** - Show full menu

## Safety Matrix

| Operation | Confirmation Required | Production Safe | Data Risk |
|-----------|----------------------|-----------------|-----------|
| backup | No | Yes | None (read-only) |
| restore | Yes | Caution | Medium (overwrites) |
| verify-snowflake | No | Yes | None (read-only) |
| migrations | No | Yes | None (read-only) |
| migrate-up | Yes (production) | Yes | Low (schema change) |
| migrate-down | Yes (always) | No | High (data loss) |
| reset-dev | Yes (always) | **NO** | **CRITICAL** (drops all) |
| test-connections | No | Yes | None (read-only) |
| pg-backup | No | Yes | None (read-only) |
| pg-restore | Yes (always) | Caution | **CRITICAL** (replaces all) |

## Example Usage

```bash
# Safe operations (no confirmation needed)
/db-manage backup
/db-manage migrations
/db-manage verify-snowflake
/db-manage test-connections

# Operations requiring confirmation
/db-manage restore
/db-manage migrate-up
/db-manage migrate-down
/db-manage pg-restore

# DANGEROUS - Development only
/db-manage reset-dev
```

## Error Handling

- If operation not recognized, show available operations
- If script files missing, show helpful error message
- If docker containers not running, suggest starting them
- If in production, block dangerous operations with clear warnings

## Output Format

Always provide:
1. **Operation summary** - What was done
2. **Command output** - Full output from scripts
3. **Next steps** - What user should do next (if applicable)
4. **Verification** - How to verify operation succeeded
