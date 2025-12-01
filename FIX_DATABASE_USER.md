# Fix "p1lending does not exist in the database" Error

This error occurs when the PostgreSQL user specified in `DATABASE_URL` doesn't exist in the database.

## Quick Fix Options

### Option 1: Recreate the Database Container (Recommended if you can lose data)

```bash
cd ~/new_app

# Stop containers
docker compose -f docker-compose.prod.yml down

# Remove the postgres volume (WARNING: This deletes all data!)
docker volume rm p1lending-new-postgres-data

# Start containers again - this will create the user automatically
docker compose -f docker-compose.prod.yml up -d

# Wait for database to be ready
sleep 15

# Run migrations
docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head

# Create admin user
docker compose -f docker-compose.prod.yml exec -T backend python scripts/create_initial_user.py
```

### Option 2: Create the User Manually (Keep existing data)

```bash
# Connect to the postgres container
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres

# In the PostgreSQL prompt, run:
CREATE USER p1lending WITH PASSWORD 'your_password_from_env';
CREATE DATABASE p1lending_etl OWNER p1lending;
GRANT ALL PRIVILEGES ON DATABASE p1lending_etl TO p1lending;

# Exit PostgreSQL
\q
```

### Option 3: Update DATABASE_URL to Use Existing User

If you have an existing PostgreSQL user, update your `.env` file:

```bash
cd ~/new_app
nano .env

# Update DATABASE_URL to use an existing user, for example:
# DATABASE_URL=postgresql+asyncpg://postgres:your_password@postgres:5432/p1lending_etl
# Or use whatever user exists in your database

# Restart backend
docker compose -f docker-compose.prod.yml restart backend
```

### Option 4: Check Current Database User

First, check what users exist:

```bash
# Connect to postgres as superuser
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d postgres

# List all users
\du

# List all databases
\l

# Exit
\q
```

## Verify the Fix

After applying one of the fixes above:

```bash
# Test database connection
docker compose -f docker-compose.prod.yml exec backend python -c "
from app.core.config import settings
from sqlalchemy.ext.asyncio import create_async_engine
import asyncio

async def test():
    engine = create_async_engine(settings.database_url)
    async with engine.connect() as conn:
        result = await conn.execute('SELECT 1')
        print('Database connection successful!')

asyncio.run(test())
"

# Check backend logs
docker compose -f docker-compose.prod.yml logs backend | grep -i "database\|error"
```

## Common Causes

1. **Database container was recreated** - The user needs to be recreated
2. **Wrong DATABASE_URL in .env** - User in URL doesn't match actual database user
3. **Database was created manually** - User wasn't created during manual setup
4. **Environment variables not set** - POSTGRES_USER/POSTGRES_PASSWORD not in .env

## Prevention

Make sure your `.env` file has:

```bash
POSTGRES_USER=p1lending
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=p1lending_etl
DATABASE_URL=postgresql+asyncpg://p1lending:your_secure_password@postgres:5432/p1lending_etl
```

The docker-compose.prod.yml will automatically create the user when the container starts if these are set correctly.

