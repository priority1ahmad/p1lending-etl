"""
Script to create a new user
Usage:
    python scripts/create_user.py
    python scripts/create_user.py --email user@example.com --password pass123 --name "John Doe" --superuser
"""

import asyncio
import sys
import argparse
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.db.models.user import User
from app.core.config import settings
from app.core.security import get_password_hash


async def create_user(
    email: str,
    password: str,
    full_name: str = None,
    is_superuser: bool = False,
    is_active: bool = True
):
    """Create a new user"""
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check if user already exists
        result = await session.execute(select(User).where(User.email == email.lower()))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print(f"❌ User with email '{email}' already exists!")
            return False
        
        # Create user
        new_user = User(
            email=email.lower(),
            hashed_password=get_password_hash(password),
            full_name=full_name,
            is_active=is_active,
            is_superuser=is_superuser
        )
        
        session.add(new_user)
        await session.commit()
        
        print("✅ User created successfully!")
        print(f"   Email: {email.lower()}")
        print(f"   Full Name: {full_name or 'N/A'}")
        print(f"   Superuser: {'Yes' if is_superuser else 'No'}")
        print(f"   Active: {'Yes' if is_active else 'No'}")
        print(f"   Password: {password}")
        print("\n⚠️  WARNING: Please change the password after first login!")
        
        return True


async def interactive_create_user():
    """Interactively create a user"""
    print("=" * 60)
    print("Create New User")
    print("=" * 60)
    print()
    
    # Get email
    while True:
        email = input("Email: ").strip()
        if email:
            break
        print("❌ Email is required!")
    
    # Get password
    while True:
        password = input("Password: ").strip()
        if password:
            if len(password) < 6:
                print("⚠️  Warning: Password is less than 6 characters")
                confirm = input("Continue anyway? (y/n): ").strip().lower()
                if confirm != 'y':
                    continue
            break
        print("❌ Password is required!")
    
    # Get full name (optional)
    full_name = input("Full Name (optional): ").strip() or None
    
    # Get superuser status
    is_superuser_input = input("Make this user a superuser? (y/n) [n]: ").strip().lower()
    is_superuser = is_superuser_input == 'y'
    
    # Get active status
    is_active_input = input("Activate this user? (y/n) [y]: ").strip().lower()
    is_active = is_active_input != 'n'
    
    print()
    print("Creating user...")
    print()
    
    success = await create_user(
        email=email,
        password=password,
        full_name=full_name,
        is_superuser=is_superuser,
        is_active=is_active
    )
    
    return success


def main():
    parser = argparse.ArgumentParser(description="Create a new user")
    parser.add_argument("--email", type=str, help="User email address")
    parser.add_argument("--password", type=str, help="User password")
    parser.add_argument("--name", type=str, help="User full name")
    parser.add_argument("--superuser", action="store_true", help="Make user a superuser")
    parser.add_argument("--inactive", action="store_true", help="Create user as inactive")
    
    args = parser.parse_args()
    
    # If email and password provided, use command line mode
    if args.email and args.password:
        asyncio.run(create_user(
            email=args.email,
            password=args.password,
            full_name=args.name,
            is_superuser=args.superuser,
            is_active=not args.inactive
        ))
    else:
        # Otherwise, use interactive mode
        asyncio.run(interactive_create_user())


if __name__ == "__main__":
    main()

