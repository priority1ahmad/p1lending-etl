"""
Script to migrate SQL scripts from old_app to database
This script MUST be run inside the Docker container where dependencies are installed.
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
    from sqlalchemy import select
    from app.db.models.sql_script import SQLScript
    from app.core.config import settings
except ImportError as e:
    print("=" * 60)
    print("ERROR: Missing required dependencies!")
    print("=" * 60)
    print(f"Error: {e}")
    print("")
    print("This script must be run inside the Docker container.")
    print("")
    print("To run the migration, use one of these commands:")
    print("")
    print(
        "  docker compose -f docker-compose.prod.yml exec -T backend python scripts/migrate_sql_scripts.py"
    )
    print("")
    print("OR if using docker-compose (v1):")
    print("")
    print(
        "  docker-compose -f docker-compose.prod.yml exec -T backend python scripts/migrate_sql_scripts.py"
    )
    print("")
    sys.exit(1)


async def migrate_sql_scripts():
    """Migrate SQL scripts from backend/sql/ directory to database"""
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    # Path to SQL scripts - try multiple possible locations
    # In Docker: /app/sql (mounted volume)
    # In local dev: backend/sql (relative to scripts directory)
    possible_paths = [
        Path("/app/sql"),  # Docker container path
        Path(__file__).parent.parent / "sql",  # Local development path
        Path(__file__).parent.parent.parent / "backend" / "sql",  # Alternative local path
    ]

    script_dir = None
    for path in possible_paths:
        if path.exists() and path.is_dir():
            script_dir = path
            print(f"Found SQL scripts directory at: {script_dir}")
            break

    if not script_dir:
        print(f"Warning: SQL scripts directory not found. Tried paths: {possible_paths}")
        return

    async with async_session() as session:
        sql_files = list(script_dir.glob("*.sql"))

        if not sql_files:
            print(f"No SQL files found in {script_dir}")
            return

        print(f"Found {len(sql_files)} SQL files to migrate")

        for sql_file in sql_files:
            script_name = sql_file.stem  # Filename without extension

            # Check if script already exists
            result = await session.execute(select(SQLScript).where(SQLScript.name == script_name))
            existing = result.scalar_one_or_none()

            if existing:
                print(f"Script '{script_name}' already exists, skipping...")
                continue

            # Read SQL content
            try:
                with open(sql_file, "r", encoding="utf-8") as f:
                    content = f.read()

                # Create script
                script = SQLScript(
                    name=script_name, description=f"Migrated from {sql_file.name}", content=content
                )

                session.add(script)
                print(f"Migrated: {script_name}")

            except Exception as e:
                print(f"Error migrating {script_name}: {e}")

        await session.commit()
        print("Migration completed!")


if __name__ == "__main__":
    asyncio.run(migrate_sql_scripts())
