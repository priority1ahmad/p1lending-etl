"""
Script to clear a corrupted config value from the database
"""

import asyncio
import sys
import os
from pathlib import Path

# Fix Windows console encoding
if sys.platform == "win32":
    os.system("chcp 65001 >nul 2>&1")

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.db.models.config import AppConfig
from app.core.config import settings


async def clear_config_value(key: str):
    """Clear a configuration value from the database"""
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Check if the value exists
        result = await session.execute(select(AppConfig).where(AppConfig.key == key))
        config_item = result.scalar_one_or_none()

        if config_item:
            print(
                f"Found config item: key='{config_item.key}', is_encrypted={config_item.is_encrypted}"
            )
            await session.delete(config_item)
            await session.commit()
            print(f"Successfully deleted config value for key '{key}'")
        else:
            # Try to list all config keys to help debug
            all_configs = await session.execute(select(AppConfig))
            all_items = all_configs.scalars().all()
            if all_items:
                print(f"No config value found for key '{key}'")
                print(f"Existing config keys: {[item.key for item in all_items]}")
            else:
                print(f"No config value found for key '{key}' (no config items in database)")

    await engine.dispose()


if __name__ == "__main__":
    if len(sys.argv) > 1:
        key = sys.argv[1]
    else:
        key = "idicore_client_secret"

    print(f"Clearing config value for key: {key}")
    asyncio.run(clear_config_value(key))
    print("\nYou can now re-enter the value in the Configuration page.")
