"""
Script to backup SQL scripts from database to JSON file
This allows restoring scripts after a database reset or volume loss.
"""

import asyncio
import json
import sys
from pathlib import Path
from datetime import datetime

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
    print("To run the backup, use:")
    print("  docker compose -f docker-compose.prod.yml exec -T backend python scripts/backup_sql_scripts.py")
    print("")
    sys.exit(1)


async def backup_sql_scripts():
    """Backup all SQL scripts from database to JSON file"""
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    # Backup file location - try multiple possible locations
    possible_paths = [
        Path("/app/backups"),  # Docker container path
        Path(__file__).parent.parent / "backups",  # Local development path
        Path(__file__).parent.parent.parent / "backend" / "backups",  # Alternative local path
    ]
    
    backup_dir = None
    for path in possible_paths:
        if path.exists() or path.parent.exists():
            backup_dir = path
            break
    
    # If no existing directory, use the first one
    if not backup_dir:
        backup_dir = possible_paths[0]
    
    # Create backup directory if it doesn't exist
    backup_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate backup filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = backup_dir / f"sql_scripts_backup_{timestamp}.json"
    
    async with async_session() as session:
        # Get all SQL scripts
        result = await session.execute(select(SQLScript).order_by(SQLScript.created_at))
        scripts = result.scalars().all()
        
        if not scripts:
            print("No SQL scripts found in database.")
            return
        
        # Convert to JSON-serializable format
        scripts_data = []
        for script in scripts:
            scripts_data.append({
                "id": str(script.id),
                "name": script.name,
                "description": script.description,
                "content": script.content,
                "created_by": str(script.created_by) if script.created_by else None,
                "created_at": script.created_at.isoformat() if script.created_at else None,
                "updated_at": script.updated_at.isoformat() if script.updated_at else None,
            })
        
        # Write to JSON file
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump({
                "backup_date": datetime.now().isoformat(),
                "script_count": len(scripts_data),
                "scripts": scripts_data
            }, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Backup completed successfully!")
        print(f"   Backed up {len(scripts_data)} SQL scripts")
        print(f"   Backup file: {backup_file}")
        print("")
        print("To restore this backup, run:")
        print(f"   python scripts/restore_sql_scripts.py {backup_file.name}")


if __name__ == "__main__":
    asyncio.run(backup_sql_scripts())

