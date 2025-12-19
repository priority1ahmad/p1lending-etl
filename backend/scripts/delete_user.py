"""
Script to delete a user
Usage:
    python scripts/delete_user.py
    python scripts/delete_user.py --email user@example.com
    python scripts/delete_user.py --id 123e4567-e89b-12d3-a456-426614174000
"""

import asyncio
import sys
import argparse
from pathlib import Path
from uuid import UUID

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.db.models.user import User
from app.core.config import settings


async def list_all_users(db: AsyncSession):
    """List all users in the system"""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


async def delete_user_by_email(email: str, confirm: bool = True) -> bool:
    """Delete a user by email"""
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Find user
        result = await session.execute(select(User).where(User.email == email.lower()))
        user = result.scalar_one_or_none()

        if not user:
            print(f"❌ User with email '{email}' not found!")
            return False

        # Show user info
        print()
        print("=" * 60)
        print("User to be deleted:")
        print("=" * 60)
        print(f"   ID: {user.id}")
        print(f"   Email: {user.email}")
        print(f"   Name: {user.display_name}")
        print(f"   Superuser: {'Yes' if user.is_superuser else 'No'}")
        print(f"   Active: {'Yes' if user.is_active else 'No'}")
        print(f"   Created: {user.created_at}")
        print()

        # Confirm deletion
        if confirm:
            confirmation = (
                input("⚠️  Are you sure you want to DELETE this user? (yes/no): ").strip().lower()
            )
            if confirmation != "yes":
                print("❌ Deletion cancelled")
                return False

        # Delete user
        await session.delete(user)
        await session.commit()

        print("✅ User deleted successfully!")
        return True


async def delete_user_by_id(user_id: str, confirm: bool = True) -> bool:
    """Delete a user by ID"""
    try:
        uuid_obj = UUID(user_id)
    except ValueError:
        print(f"❌ Invalid UUID format: {user_id}")
        return False

    engine = create_async_engine(settings.database_url, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Find user
        result = await session.execute(select(User).where(User.id == uuid_obj))
        user = result.scalar_one_or_none()

        if not user:
            print(f"❌ User with ID '{user_id}' not found!")
            return False

        # Show user info
        print()
        print("=" * 60)
        print("User to be deleted:")
        print("=" * 60)
        print(f"   ID: {user.id}")
        print(f"   Email: {user.email}")
        print(f"   Name: {user.display_name}")
        print(f"   Superuser: {'Yes' if user.is_superuser else 'No'}")
        print(f"   Active: {'Yes' if user.is_active else 'No'}")
        print(f"   Created: {user.created_at}")
        print()

        # Confirm deletion
        if confirm:
            confirmation = (
                input("⚠️  Are you sure you want to DELETE this user? (yes/no): ").strip().lower()
            )
            if confirmation != "yes":
                print("❌ Deletion cancelled")
                return False

        # Delete user
        await session.delete(user)
        await session.commit()

        print("✅ User deleted successfully!")
        return True


async def interactive_delete_user():
    """Interactively delete a user"""
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    print("=" * 60)
    print("Delete User")
    print("=" * 60)
    print()

    # List all users
    async with async_session() as session:
        users = await list_all_users(session)

    if not users:
        print("❌ No users found in the database!")
        return False

    print("Current users:")
    print()
    for i, user in enumerate(users, 1):
        status = "✓ Active" if user.is_active else "✗ Inactive"
        role = "Admin" if user.is_superuser else "User"
        print(f"{i}. [{status}] [{role}] {user.email}")
        print(f"   Name: {user.display_name}")
        print(f"   ID: {user.id}")
        print()

    # Get selection
    while True:
        try:
            selection = input("Select user number to delete (or 'q' to quit): ").strip()
            if selection.lower() == "q":
                print("❌ Deletion cancelled")
                return False

            index = int(selection) - 1
            if 0 <= index < len(users):
                selected_user = users[index]
                break
            else:
                print(f"❌ Invalid selection. Please enter a number between 1 and {len(users)}")
        except ValueError:
            print("❌ Please enter a valid number or 'q' to quit")

    # Show selected user
    print()
    print("=" * 60)
    print("User to be deleted:")
    print("=" * 60)
    print(f"   ID: {selected_user.id}")
    print(f"   Email: {selected_user.email}")
    print(f"   Name: {selected_user.display_name}")
    print(f"   Superuser: {'Yes' if selected_user.is_superuser else 'No'}")
    print(f"   Active: {'Yes' if selected_user.is_active else 'No'}")
    print(f"   Created: {selected_user.created_at}")
    print()

    # Confirm deletion
    confirmation = input("⚠️  Type 'DELETE' in capital letters to confirm: ").strip()
    if confirmation != "DELETE":
        print("❌ Deletion cancelled")
        return False

    # Delete user
    async with async_session() as session:
        # Re-fetch to ensure we have the latest state
        result = await session.execute(select(User).where(User.id == selected_user.id))
        user = result.scalar_one_or_none()

        if not user:
            print("❌ User no longer exists!")
            return False

        await session.delete(user)
        await session.commit()

    print()
    print("✅ User deleted successfully!")
    return True


def main():
    parser = argparse.ArgumentParser(description="Delete a user from the database")
    parser.add_argument("--email", type=str, help="User email address")
    parser.add_argument("--id", type=str, help="User ID (UUID)")
    parser.add_argument("--yes", action="store_true", help="Skip confirmation prompt")

    args = parser.parse_args()

    # If email provided, delete by email
    if args.email:
        asyncio.run(delete_user_by_email(args.email, confirm=not args.yes))
    # If ID provided, delete by ID
    elif args.id:
        asyncio.run(delete_user_by_id(args.id, confirm=not args.yes))
    # Otherwise, use interactive mode
    else:
        asyncio.run(interactive_delete_user())


if __name__ == "__main__":
    main()
