"""
NTFY Push Notification Service

Self-hosted NTFY integration for sending push notifications to admins.
Topics:
- p1-auth: Login events
- p1-jobs: ETL job events
- p1-errors: Error alerts (urgent priority)
- p1-system: System events
"""

import httpx
import asyncio
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime
from app.core.config import settings
from app.core.logger import etl_logger


class NtfyPriority(str, Enum):
    """NTFY Priority levels"""
    MIN = "1"
    LOW = "2"
    DEFAULT = "3"
    HIGH = "4"
    URGENT = "5"  # Bypasses Do Not Disturb


class NtfyClient:
    """
    Async NTFY notification client for self-hosted instance
    """

    def __init__(
        self,
        base_url: str = None,
        token: Optional[str] = None,
        timeout: int = 10,
        enabled: bool = True,
    ):
        self.base_url = (base_url or settings.ntfy.base_url).rstrip("/")
        self.token = token or settings.ntfy.token
        self.timeout = timeout
        self.enabled = enabled and settings.ntfy.enabled
        self.headers = {}
        self.logger = etl_logger.logger.getChild("NTFY")

        if self.token:
            self.headers["Authorization"] = f"Bearer {self.token}"

    async def send(
        self,
        topic: str,
        message: str,
        title: Optional[str] = None,
        priority: NtfyPriority = NtfyPriority.DEFAULT,
        tags: Optional[List[str]] = None,
        click: Optional[str] = None,
        markdown: bool = True,
    ) -> bool:
        """
        Send notification to NTFY topic

        Args:
            topic: NTFY topic name (e.g., 'p1-errors')
            message: Notification message
            title: Optional title
            priority: Priority level (default: DEFAULT)
            tags: Optional list of emoji tags
            click: Optional URL to open on tap
            markdown: Enable markdown formatting (default: True)

        Returns:
            bool: True if successful, False otherwise
        """
        if not self.enabled:
            self.logger.debug(f"NTFY disabled, skipping notification to {topic}")
            return True

        try:
            url = f"{self.base_url}/{topic}"

            headers = self.headers.copy()
            headers["X-Priority"] = priority.value

            if title:
                headers["X-Title"] = title

            if tags:
                headers["X-Tags"] = ",".join(tags)

            if click:
                headers["Click"] = click

            if markdown:
                headers["X-Markdown"] = "yes"

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    url,
                    content=message,
                    headers=headers,
                )

                if response.status_code in (200, 201):
                    self.logger.info(f"NTFY sent to {topic}: {title or message[:50]}")
                    return True
                else:
                    self.logger.error(
                        f"NTFY failed to {topic}: {response.status_code} - {response.text}"
                    )
                    return False

        except Exception as e:
            self.logger.error(f"NTFY error: {str(e)}")
            return False

    def send_sync(
        self,
        topic: str,
        message: str,
        title: Optional[str] = None,
        priority: NtfyPriority = NtfyPriority.DEFAULT,
        tags: Optional[List[str]] = None,
    ) -> bool:
        """
        Synchronous version for use in Celery tasks
        """
        if not self.enabled:
            return True

        try:
            import requests

            url = f"{self.base_url}/{topic}"

            headers = self.headers.copy()
            headers["X-Priority"] = priority.value
            headers["X-Markdown"] = "yes"

            if title:
                headers["X-Title"] = title

            if tags:
                headers["X-Tags"] = ",".join(tags)

            response = requests.post(
                url,
                data=message,
                headers=headers,
                timeout=self.timeout,
            )

            if response.status_code in (200, 201):
                self.logger.info(f"NTFY sent to {topic}: {title or message[:50]}")
                return True
            else:
                self.logger.error(f"NTFY failed: {response.status_code}")
                return False

        except Exception as e:
            self.logger.error(f"NTFY sync error: {str(e)}")
            return False


class NtfyEventService:
    """
    High-level service for sending application-specific notifications
    """

    def __init__(self, client: NtfyClient = None):
        self.ntfy = client or NtfyClient()
        self.topics = settings.ntfy

    # =====================
    # Authentication Events
    # =====================

    async def notify_login(
        self,
        email: str,
        ip_address: Optional[str] = None,
        status: str = "success",
    ) -> bool:
        """Notify on login attempt"""
        if status == "success":
            tags = ["white_check_mark", "login"]
            title = "Login Successful"
            message = f"**{email}** logged in"
            priority = NtfyPriority.DEFAULT
        else:
            tags = ["warning", "login"]
            title = "Failed Login Attempt"
            message = f"**Failed login** for {email}"
            priority = NtfyPriority.HIGH

        if ip_address:
            message += f"\nIP: `{ip_address}`"

        message += f"\nTime: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC"

        return await self.ntfy.send(
            topic=self.topics.topic_auth,
            message=message,
            title=title,
            priority=priority,
            tags=tags,
        )

    # =====================
    # ETL Job Events
    # =====================

    def notify_job_started_sync(
        self,
        job_id: str,
        script_name: str,
        user_email: str,
        row_limit: Optional[int] = None,
    ) -> bool:
        """Notify when ETL job starts (sync for Celery)"""
        message = (
            f"**ETL Job Started**\n\n"
            f"Script: {script_name}\n"
            f"Job ID: `{job_id}`\n"
            f"User: {user_email}"
        )
        if row_limit:
            message += f"\nRow Limit: {row_limit}"

        return self.ntfy.send_sync(
            topic=self.topics.topic_jobs,
            message=message,
            title="Job Started",
            priority=NtfyPriority.DEFAULT,
            tags=["rocket", "etl"],
        )

    def notify_job_progress_sync(
        self,
        job_id: str,
        progress: int,
        message_text: str,
    ) -> bool:
        """Notify job progress at 50% (sync for Celery)"""
        if progress != 50:
            return True  # Only notify at 50%

        message = (
            f"**ETL Job 50% Complete**\n\n"
            f"Job ID: `{job_id}`\n"
            f"Status: {message_text}"
        )

        return self.ntfy.send_sync(
            topic=self.topics.topic_jobs,
            message=message,
            title="Job Progress",
            priority=NtfyPriority.DEFAULT,
            tags=["hourglass", "progress"],
        )

    def notify_job_completed_sync(
        self,
        job_id: str,
        script_name: str,
        total_rows: int,
        clean_count: int,
        litigator_count: int,
        dnc_count: int,
        duration_seconds: float,
    ) -> bool:
        """Notify when ETL job completes (sync for Celery)"""
        minutes = int(duration_seconds // 60)
        seconds = int(duration_seconds % 60)

        message = (
            f"**ETL Job Completed**\n\n"
            f"Script: {script_name}\n"
            f"Job ID: `{job_id}`\n"
            f"Duration: {minutes}m {seconds}s\n\n"
            f"**Results:**\n"
            f"- Total Rows: {total_rows}\n"
            f"- Clean: {clean_count}\n"
            f"- Litigators: {litigator_count}\n"
            f"- DNC: {dnc_count}"
        )

        return self.ntfy.send_sync(
            topic=self.topics.topic_jobs,
            message=message,
            title="Job Completed",
            priority=NtfyPriority.DEFAULT,
            tags=["white_check_mark", "success"],
        )

    def notify_job_failed_sync(
        self,
        job_id: str,
        script_name: str,
        error_message: str,
    ) -> bool:
        """Notify when ETL job fails (sync for Celery) - URGENT"""
        message = (
            f"**ETL Job FAILED**\n\n"
            f"Script: {script_name}\n"
            f"Job ID: `{job_id}`\n"
            f"Error: {error_message[:500]}"
        )

        return self.ntfy.send_sync(
            topic=self.topics.topic_errors,
            message=message,
            title="JOB FAILED",
            priority=NtfyPriority.URGENT,
            tags=["x", "error", "urgent"],
        )

    # =====================
    # Error Alerts
    # =====================

    def notify_error_sync(
        self,
        error_type: str,
        error_message: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Send urgent error alert (sync for Celery)"""
        message = (
            f"**ERROR ALERT**\n\n"
            f"Type: {error_type}\n"
            f"Message: {error_message[:500]}"
        )

        if context:
            message += "\n\n**Context:**"
            for key, value in context.items():
                message += f"\n- {key}: {value}"

        return self.ntfy.send_sync(
            topic=self.topics.topic_errors,
            message=message,
            title="ERROR - Action Required",
            priority=NtfyPriority.URGENT,
            tags=["rotating_light", "error", "urgent"],
        )

    async def notify_error(
        self,
        error_type: str,
        error_message: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Send urgent error alert (async)"""
        message = (
            f"**ERROR ALERT**\n\n"
            f"Type: {error_type}\n"
            f"Message: {error_message[:500]}"
        )

        if context:
            message += "\n\n**Context:**"
            for key, value in context.items():
                message += f"\n- {key}: {value}"

        return await self.ntfy.send(
            topic=self.topics.topic_errors,
            message=message,
            title="ERROR - Action Required",
            priority=NtfyPriority.URGENT,
            tags=["rotating_light", "error", "urgent"],
        )

    # =====================
    # System Events
    # =====================

    async def notify_system_event(
        self,
        event_type: str,
        message: str,
        priority: NtfyPriority = NtfyPriority.DEFAULT,
    ) -> bool:
        """Send system event notification"""
        return await self.ntfy.send(
            topic=self.topics.topic_system,
            message=message,
            title=f"System: {event_type}",
            priority=priority,
            tags=["gear", "system"],
        )


# Global instance
_ntfy_client: Optional[NtfyClient] = None
_ntfy_events: Optional[NtfyEventService] = None


def get_ntfy_client() -> NtfyClient:
    """Get or create NTFY client instance"""
    global _ntfy_client
    if _ntfy_client is None:
        _ntfy_client = NtfyClient()
    return _ntfy_client


def get_ntfy_events() -> NtfyEventService:
    """Get or create NTFY events service instance"""
    global _ntfy_events
    if _ntfy_events is None:
        _ntfy_events = NtfyEventService(get_ntfy_client())
    return _ntfy_events
