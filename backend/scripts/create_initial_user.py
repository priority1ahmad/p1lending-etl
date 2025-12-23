"""
Script to create initial admin users
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


# Initial users to create on deployment
INITIAL_USERS = [
    {
        "email": "admin@p1lending.com",
        "password": "admin123",
        "full_name": "Admin User",
        "is_superuser": True,
    },
    {
        "email": "aallouch@priority1lending.com",
        "password": "TempPass2024!",
        "full_name": "Ahmad Allouch",
        "is_superuser": True,
    },
]


async def create_initial_users():
    """Create initial admin users"""
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        for user_data in INITIAL_USERS:
            email = user_data["email"].lower()

            # Check if user already exists
            result = await session.execute(select(User).where(User.email == email))
            existing_user = result.scalar_one_or_none()

            if existing_user:
                print(f"User {email} already exists - skipping")
                continue

            # Create user
            new_user = User(
                email=email,
                hashed_password=get_password_hash(user_data["password"]),
                full_name=user_data["full_name"],
                is_active=True,
                is_superuser=user_data["is_superuser"],
            )

            session.add(new_user)
            await session.commit()
            print(f"✅ User created: {email}")
            print(f"   Password: {user_data['password']}")
            print("   ⚠️  Please change password after first login!")
            print()


if __name__ == "__main__":
    asyncio.run(create_initial_users())
