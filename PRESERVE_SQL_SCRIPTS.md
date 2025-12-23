# Preserving SQL Scripts Between Rebuilds

SQL scripts are stored in the PostgreSQL database and are automatically preserved between container rebuilds **as long as the database volume is not deleted**.

## How It Works

- SQL scripts are stored in the `sql_scripts` table in PostgreSQL
- PostgreSQL data is stored in a Docker named volume: `p1lending-new-postgres-data`
- This volume persists even when containers are rebuilt or stopped

## ⚠️ Important: Don't Delete Volumes

**NEVER run these commands** as they will delete your SQL scripts:

```bash
# ❌ DON'T DO THIS - Deletes all data including SQL scripts
docker compose -f docker-compose.prod.yml down -v

# ❌ DON'T DO THIS - Deletes the database volume
docker volume rm p1lending-new-postgres-data
```

## Safe Commands for Updates

These commands preserve your SQL scripts:

```bash
# ✅ Safe - Stops containers but keeps volumes
docker compose -f docker-compose.prod.yml down

# ✅ Safe - Rebuilds and restarts, keeps volumes
docker compose -f docker-compose.prod.yml up -d --build

# ✅ Safe - Restarts containers, keeps volumes
docker compose -f docker-compose.prod.yml restart
```

## Backup and Restore SQL Scripts

### Creating a Backup

Before any major changes, create a backup of your SQL scripts:

```bash
# Create backup
docker compose -f docker-compose.prod.yml exec -T backend python scripts/backup_sql_scripts.py
```

This creates a JSON file in `backend/backups/sql_scripts_backup_YYYYMMDD_HHMMSS.json`

### Restoring from Backup

If you ever lose your SQL scripts, restore them from a backup:

```bash
# List available backups
ls -lh backend/backups/

# Restore from backup
docker compose -f docker-compose.prod.yml exec -T backend python scripts/restore_sql_scripts.py sql_scripts_backup_20240101_120000.json
```

## Automatic Backup Before Updates

You can add a backup step to your update process. Create a script like this:

```bash
#!/bin/bash
# backup-before-update.sh

echo "Creating backup of SQL scripts..."
docker compose -f docker-compose.prod.yml exec -T backend python scripts/backup_sql_scripts.py

echo "Backup complete. Proceeding with update..."
# ... rest of your update script
```

## Verifying Your Scripts Are Preserved

After a rebuild, verify your scripts are still there:

```bash
# Check database volume exists
docker volume ls | grep p1lending-new-postgres-data

# List SQL scripts in database
docker compose -f docker-compose.prod.yml exec -T backend python -c "
import asyncio
from app.db.session import async_session
from app.db.models.sql_script import SQLScript
from sqlalchemy import select

async def list_scripts():
    async with async_session() as session:
        result = await session.execute(select(SQLScript))
        scripts = result.scalars().all()
        print(f'Found {len(scripts)} SQL scripts:')
        for script in scripts:
            print(f'  - {script.name}')

asyncio.run(list_scripts())
"
```

## Troubleshooting

### Scripts Are Missing After Rebuild

1. **Check if the volume was deleted:**
   ```bash
   docker volume ls | grep p1lending-new-postgres-data
   ```
   If it's not listed, the volume was deleted and data is lost.

2. **Restore from backup:**
   ```bash
   docker compose -f docker-compose.prod.yml exec -T backend python scripts/restore_sql_scripts.py <backup_file>
   ```

3. **If no backup exists:**
   - Check if you have SQL files in `backend/sql/` directory
   - Run the migration script to recreate scripts from files:
     ```bash
     docker compose -f docker-compose.prod.yml exec -T backend python scripts/migrate_sql_scripts.py
     ```
   - Note: This only creates scripts that don't exist. It won't restore modified scripts.

### Prevent Future Data Loss

1. **Always backup before major changes:**
   ```bash
   docker compose -f docker-compose.prod.yml exec -T backend python scripts/backup_sql_scripts.py
   ```

2. **Set up automated backups** (cron job):
   ```bash
   # Add to crontab (runs daily at 2 AM)
   0 2 * * * cd /path/to/new_app && docker compose -f docker-compose.prod.yml exec -T backend python scripts/backup_sql_scripts.py
   ```

3. **Document your update process** to avoid accidental volume deletion

## Summary

- ✅ SQL scripts are stored in PostgreSQL (persistent)
- ✅ Database uses Docker named volume (survives rebuilds)
- ⚠️ Never use `docker compose down -v` (deletes volumes)
- 💾 Always backup before major changes
- 🔄 Use restore script if data is lost

