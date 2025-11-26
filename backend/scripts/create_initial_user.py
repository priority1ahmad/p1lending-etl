"""
Script to create initial admin user
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.db.models.user import User
from app.core.config import settings
from app.core.security import get_password_hash


async def create_initial_user():
    """Create initial admin user"""
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check if user already exists
        result = await session.execute(select(User).where(User.email == "admin@p1lending.com"))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print("Admin user already exists!")
            return
        
        # Create admin user
        admin_user = User(
            email="admin@p1lending.com",
            hashed_password=get_password_hash("admin123"),  # Change this in production!
            full_name="Admin User",
            is_active=True,
            is_superuser=True
        )
        
        session.add(admin_user)
        await session.commit()
        print("Admin user created successfully!")
        print("Email: admin@p1lending.com")
        print("Password: admin123")
        print("WARNING: Please change the password after first login!")


if __name__ == "__main__":
    asyncio.run(create_initial_user())

