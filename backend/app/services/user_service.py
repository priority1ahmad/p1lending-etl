"""
User management service - business logic for admin user operations

This service handles:
- User creation with auto-generated passwords
- User deletion (hard delete)
- Password resets by admin
- Audit logging for all user management actions
"""

import secrets
import string
from typing import Optional, Tuple, List
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.user import User
from app.db.models.audit import LoginAuditLog
from app.core.security import get_password_hash
from app.core.logger import etl_logger


# Audit event types for user management (extends login_status column usage)
AUDIT_USER_CREATED = "user_created"
AUDIT_USER_DELETED = "user_deleted"
AUDIT_PASSWORD_RESET = "password_reset_by_admin"


class UserService:
    """
    Service class for user management operations.

    All methods are static and async, following the pattern used by other services
    in this codebase (e.g., ETLService, CacheService).
    """

    @staticmethod
    def generate_temporary_password(length: int = 16) -> str:
        """
        Generate a cryptographically secure random password.

        Uses secrets module for secure random generation.
        Password includes uppercase, lowercase, digits, and special characters.

        Args:
            length: Password length (default 16 characters)

        Returns:
            Random password string
        """
        # Character set for password generation
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"

        # Ensure password has at least one of each type
        password = [
            secrets.choice(string.ascii_uppercase),
            secrets.choice(string.ascii_lowercase),
            secrets.choice(string.digits),
            secrets.choice("!@#$%^&*"),
        ]

        # Fill remaining length with random characters
        password += [secrets.choice(alphabet) for _ in range(length - 4)]

        # Shuffle to randomize position of required characters
        secrets.SystemRandom().shuffle(password)

        return "".join(password)

    @staticmethod
    async def log_user_action(
        db: AsyncSession,
        action: str,
        target_email: str,
        admin_user: User,
        ip_address: Optional[str] = None,
        target_user_id: Optional[UUID] = None,
        details: Optional[str] = None,
    ) -> None:
        """
        Log a user management action to the audit table.

        Uses the existing LoginAuditLog table with extended event types
        for user management actions.

        Args:
            db: Database session
            action: Event type (user_created, user_deleted, password_reset_by_admin)
            target_email: Email of the user being acted upon
            admin_user: The admin performing the action
            ip_address: Admin's IP address
            target_user_id: ID of user being acted upon (if exists)
            details: Additional details about the action
        """
        try:
            audit_log = LoginAuditLog(
                user_id=target_user_id,
                email=target_email.lower(),
                ip_address=ip_address,
                login_status=action,
                failure_reason=details or f"Action performed by {admin_user.email}",
            )
            db.add(audit_log)
            await db.flush()  # Don't commit yet - let caller handle transaction
            etl_logger.info(f"Audit: {action} for {target_email} by {admin_user.email}")
        except Exception as e:
            etl_logger.error(f"Failed to log user action: {e}")
            # Don't fail the operation because of audit log failure
            pass

    @staticmethod
    async def list_users(db: AsyncSession) -> Tuple[List[User], int]:
        """
        List all users in the system.

        Returns:
            Tuple of (list of users, total count)
        """
        # Get total count
        count_result = await db.execute(select(func.count(User.id)))
        total = count_result.scalar() or 0

        # Get all users ordered by created_at desc
        result = await db.execute(select(User).order_by(User.created_at.desc()))
        users = list(result.scalars().all())

        return users, total

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: UUID) -> Optional[User]:
        """Get a user by their ID."""
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        """Get a user by their email."""
        result = await db.execute(select(User).where(User.email == email.lower()))
        return result.scalar_one_or_none()

    @staticmethod
    async def create_user(
        db: AsyncSession,
        email: str,
        first_name: Optional[str],
        last_name: Optional[str],
        is_superuser: bool,
        admin_user: User,
        ip_address: Optional[str] = None,
    ) -> Tuple[User, str]:
        """
        Create a new user with an auto-generated temporary password.

        Args:
            db: Database session
            email: New user's email
            first_name: New user's first name
            last_name: New user's last name
            is_superuser: Whether user should have admin privileges
            admin_user: The admin creating the user
            ip_address: Admin's IP address for audit

        Returns:
            Tuple of (created user, temporary password)

        Raises:
            ValueError: If email already exists
        """
        # Check if email already exists
        existing = await UserService.get_user_by_email(db, email)
        if existing:
            raise ValueError(f"User with email {email} already exists")

        # Generate temporary password
        temp_password = UserService.generate_temporary_password()
        hashed_password = get_password_hash(temp_password)

        # Build full_name for backward compatibility
        full_name = None
        if first_name or last_name:
            full_name = f"{first_name or ''} {last_name or ''}".strip()

        # Create user
        user = User(
            email=email.lower(),
            hashed_password=hashed_password,
            first_name=first_name,
            last_name=last_name,
            full_name=full_name,
            is_active=True,
            is_superuser=is_superuser,
        )
        db.add(user)
        await db.flush()  # Get user ID for audit log

        # Log the action
        await UserService.log_user_action(
            db=db,
            action=AUDIT_USER_CREATED,
            target_email=email,
            admin_user=admin_user,
            ip_address=ip_address,
            target_user_id=user.id,
            details=f"User created by {admin_user.email}",
        )

        await db.commit()
        await db.refresh(user)

        etl_logger.info(f"User {email} created by admin {admin_user.email}")
        return user, temp_password

    @staticmethod
    async def delete_user(
        db: AsyncSession, user_id: UUID, admin_user: User, ip_address: Optional[str] = None
    ) -> bool:
        """
        Permanently delete a user (hard delete).

        Audit logs are preserved with user_id set to NULL (FK ON DELETE SET NULL).

        Args:
            db: Database session
            user_id: ID of user to delete
            admin_user: The admin performing the deletion
            ip_address: Admin's IP address for audit

        Returns:
            True if user was deleted

        Raises:
            ValueError: If user not found or trying to delete self
        """
        # Get user to delete
        user = await UserService.get_user_by_id(db, user_id)
        if not user:
            raise ValueError("User not found")

        # Prevent self-deletion
        if user.id == admin_user.id:
            raise ValueError("Cannot delete your own account")

        user_email = user.email  # Store before deletion

        # Log the action BEFORE deletion (so we can reference the user)
        await UserService.log_user_action(
            db=db,
            action=AUDIT_USER_DELETED,
            target_email=user_email,
            admin_user=admin_user,
            ip_address=ip_address,
            target_user_id=None,  # Will be NULL after delete anyway
            details=f"User deleted by {admin_user.email}",
        )

        # Delete the user
        await db.delete(user)
        await db.commit()

        etl_logger.info(f"User {user_email} deleted by admin {admin_user.email}")
        return True

    @staticmethod
    async def reset_password(
        db: AsyncSession,
        user_id: UUID,
        new_password: str,
        admin_user: User,
        ip_address: Optional[str] = None,
    ) -> User:
        """
        Reset a user's password (admin sets the new password).

        Args:
            db: Database session
            user_id: ID of user whose password to reset
            new_password: The new password to set
            admin_user: The admin performing the reset
            ip_address: Admin's IP address for audit

        Returns:
            Updated user object

        Raises:
            ValueError: If user not found
        """
        # Get user
        user = await UserService.get_user_by_id(db, user_id)
        if not user:
            raise ValueError("User not found")

        # Update password
        user.hashed_password = get_password_hash(new_password)

        # Log the action
        await UserService.log_user_action(
            db=db,
            action=AUDIT_PASSWORD_RESET,
            target_email=user.email,
            admin_user=admin_user,
            ip_address=ip_address,
            target_user_id=user.id,
            details=f"Password reset by {admin_user.email}",
        )

        await db.commit()
        await db.refresh(user)

        etl_logger.info(f"Password reset for {user.email} by admin {admin_user.email}")
        return user

    @staticmethod
    async def get_audit_logs(
        db: AsyncSession, limit: int = 100, offset: int = 0
    ) -> Tuple[List[LoginAuditLog], int]:
        """
        Get audit logs (login events + user management events).

        Args:
            db: Database session
            limit: Maximum number of logs to return
            offset: Number of logs to skip

        Returns:
            Tuple of (list of audit logs, total count)
        """
        # Get total count
        count_result = await db.execute(select(func.count(LoginAuditLog.id)))
        total = count_result.scalar() or 0

        # Get logs ordered by timestamp desc
        result = await db.execute(
            select(LoginAuditLog)
            .order_by(LoginAuditLog.timestamp.desc())
            .limit(limit)
            .offset(offset)
        )
        logs = list(result.scalars().all())

        return logs, total
