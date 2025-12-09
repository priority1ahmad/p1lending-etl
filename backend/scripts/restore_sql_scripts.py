"""
Script to restore SQL scripts from JSON backup file
This allows restoring scripts after a database reset or volume loss.
"""

import asyncio
import json
import sys
from pathlib import Path
from uuid import UUID

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
    sys.exit(1)


async def restore_sql_scripts(backup_file_path: str):
    """Restore SQL scripts from JSON backup file"""
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    # Find backup file - try multiple possible locations
    possible_paths = [
        Path("/app/backups") / backup_file_path,  # Docker container path
        Path(__file__).parent.parent / "backups" / backup_file_path,  # Local development path
        Path(__file__).parent.parent.parent / "backend" / "backups" / backup_file_path,  # Alternative local path
        Path(backup_file_path),  # Absolute or relative path
    ]
    
    backup_file = None
    for path in possible_paths:
        if path.exists() and path.is_file():
            backup_file = path
            break
    
    if not backup_file:
        print("=" * 60)
        print("ERROR: Backup file not found!")
        print("=" * 60)
        print(f"Tried paths:")
        for path in possible_paths:
            print(f"  - {path}")
        print("")
        sys.exit(1)
    
    # Read backup file
    try:
        with open(backup_file, 'r', encoding='utf-8') as f:
            backup_data = json.load(f)
    except Exception as e:
        print(f"ERROR: Failed to read backup file: {e}")
        sys.exit(1)
    
    scripts_data = backup_data.get("scripts", [])
    if not scripts_data:
        print("ERROR: No scripts found in backup file!")
        sys.exit(1)
    
    print(f"Found {len(scripts_data)} scripts in backup file")
    print(f"Backup date: {backup_data.get('backup_date', 'Unknown')}")
    print("")
    
    async with async_session() as session:
        restored_count = 0
        skipped_count = 0
        updated_count = 0
        
        for script_data in scripts_data:
            script_name = script_data["name"]
            
            # Check if script already exists
            result = await session.execute(select(SQLScript).where(SQLScript.name == script_name))
            existing = result.scalar_one_or_none()
            
            if existing:
                # Update existing script
                existing.content = script_data["content"]
                if script_data.get("description"):
                    existing.description = script_data["description"]
                updated_count += 1
                print(f"✓ Updated: {script_name}")
            else:
                # Create new script
                script = SQLScript(
                    name=script_name,
                    description=script_data.get("description"),
                    content=script_data["content"],
                    created_by=UUID(script_data["created_by"]) if script_data.get("created_by") else None,
                )
                session.add(script)
                restored_count += 1
                print(f"✓ Restored: {script_name}")
        
        await session.commit()
        
        print("")
        print("=" * 60)
        print("✅ Restore completed successfully!")
        print("=" * 60)
        print(f"   Restored: {restored_count} scripts")
        print(f"   Updated: {updated_count} scripts")
        print(f"   Skipped: {skipped_count} scripts")
        print("")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python restore_sql_scripts.py <backup_file>")
        print("")
        print("Example:")
        print("  python restore_sql_scripts.py sql_scripts_backup_20240101_120000.json")
        print("")
        sys.exit(1)
    
    backup_file = sys.argv[1]
    asyncio.run(restore_sql_scripts(backup_file))

