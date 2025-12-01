# How to Migrate SQL Scripts to Database

If SQL scripts are not showing in the frontend, you need to run the migration script **inside the Docker container**.

## Quick Fix

Run this command from the project root directory:

```bash
docker compose -f docker-compose.prod.yml exec -T backend python scripts/migrate_sql_scripts.py
```

Or use the helper script:

```bash
bash migrate-sql-scripts.sh
```

## Important Notes

⚠️ **The migration script MUST be run inside the Docker container**, not directly on the server.

The script requires Python dependencies (sqlalchemy, etc.) that are installed in the Docker container, not on the host system.

## Troubleshooting

### Error: "ModuleNotFoundError: No module named 'sqlalchemy'"

This means you're running the script outside the Docker container. Use one of these commands:

```bash
# Using docker compose (v2)
docker compose -f docker-compose.prod.yml exec -T backend python scripts/migrate_sql_scripts.py

# Using docker-compose (v1)
docker-compose -f docker-compose.prod.yml exec -T backend python scripts/migrate_sql_scripts.py
```

### Error: "Backend container is not running"

Start the containers first:

```bash
docker compose -f docker-compose.prod.yml up -d
```

### Verify Migration Worked

After running the migration, you should see output like:

```
Found SQL scripts directory at: /app/sql
Found 7 SQL files to migrate
Migrated: VA
Migrated: arms_expiring
Migrated: Conventional
Migrated: FHA
Migrated: FHA_6_month
Migrated: VA 6 months Ryan States
Migrated: VA 6 months
Migration completed!
```

Then refresh your browser - the SQL scripts should appear in the frontend.

## Automatic Migration

The migration script is automatically run during deployment by:
- `deploy.sh`
- `deploy-remote.sh`
- `deploy-on-server.sh`

So if you're deploying fresh, the scripts will be migrated automatically.

