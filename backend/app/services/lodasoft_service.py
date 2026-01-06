"""
Lodasoft CRM Integration Service for importing ETL records.

This service handles OAuth2 authentication and batch record imports
to the Lodasoft CRM system via their Contact List API.
"""

import time
import threading
import requests
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Callable
from datetime import datetime

from app.core.config import settings
from app.core.logger import etl_logger
from app.core.retry import CircuitBreaker, CircuitBreakerOpen


@dataclass
class ImportProgress:
    """Progress tracking for Lodasoft record imports"""

    total_records: int = 0
    processed_records: int = 0
    successful_records: int = 0
    failed_records: int = 0
    merged_records: int = 0
    duplicate_records: int = 0
    current_batch: int = 0
    total_batches: int = 0
    status: str = "pending"
    logs: List[str] = field(default_factory=list)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    def add_log(self, message: str, level: str = "INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.logs.append(f"[{timestamp}] [{level}] {message}")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_records": self.total_records,
            "processed_records": self.processed_records,
            "successful_records": self.successful_records,
            "failed_records": self.failed_records,
            "merged_records": self.merged_records,
            "duplicate_records": self.duplicate_records,
            "current_batch": self.current_batch,
            "total_batches": self.total_batches,
            "status": self.status,
            "logs": self.logs[-50:],
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "error_message": self.error_message,
            "progress_percent": (
                round((self.processed_records / self.total_records) * 100, 1)
                if self.total_records > 0 else 0
            ),
        }


class LodasoftCRMService:
    """Lodasoft CRM service for importing enriched ETL records."""

    INVALID_COLUMNS = {"Lead Campaign", "Mortgage Type"}
    PROPER_CASE_FIELDS = {
        "First Name", "Last Name", "Co Borrower Full Name",
        "Address", "City", "Current Lender",
    }

    def __init__(
        self,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        batch_size: Optional[int] = None,
    ):
        # Use config values, with optional overrides
        lodasoft_config = settings.lodasoft
        self.client_id = client_id or lodasoft_config.client_id
        self.client_secret = client_secret or lodasoft_config.client_secret
        self.auth_url = lodasoft_config.auth_url
        self.upload_url = lodasoft_config.upload_url
        self.batch_size = min(batch_size or lodasoft_config.batch_size, 200)
        self.timeout = lodasoft_config.timeout

        self.logger = etl_logger.logger.getChild("Lodasoft")
        self.session = requests.Session()
        self._access_token: Optional[str] = None
        self._token_expiry: Optional[float] = None
        self._token_lock = threading.RLock()
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=5, recovery_timeout=60.0,
            success_threshold=2, logger=self.logger,
        )

    def _proper_case(self, value: Any) -> str:
        if value is None:
            return ""
        if not isinstance(value, str):
            value = str(value)
        value = value.strip()
        if not value:
            return ""
        return " ".join(word.capitalize() for word in value.split())

    def _format_record_for_lodasoft(self, record: Dict[str, Any]) -> Dict[str, Any]:
        formatted = {}
        for key, value in record.items():
            if key in self.INVALID_COLUMNS:
                continue
            if key in self.PROPER_CASE_FIELDS:
                value = self._proper_case(value)
            if key == "Lead Number" and value is not None:
                try:
                    value = int(float(str(value).replace(",", "")))
                except (ValueError, TypeError):
                    self.logger.warning(f"Could not convert Lead Number: {value}")
                    value = 0
            if value is None:
                value = ""
            formatted[key] = value
        return formatted

    def _get_access_token(self) -> Optional[str]:
        if self._access_token and self._token_expiry:
            if time.time() < self._token_expiry:
                return self._access_token
        with self._token_lock:
            try:
                if self._access_token and self._token_expiry:
                    if time.time() < self._token_expiry:
                        return self._access_token
                self.logger.info("Requesting OAuth2 token from Lodasoft")
                payload = {
                    "grant_type": "client_credentials",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                }
                headers = {"Content-Type": "application/x-www-form-urlencoded"}
                response = self.session.post(
                    self.auth_url, data=payload, headers=headers, timeout=30
                )
                if response.status_code != 200:
                    self.logger.error(f"OAuth2 failed: {response.status_code}")
                    return None
                token_data = response.json()
                self._access_token = token_data.get("access_token")
                expires_in = token_data.get("expires_in", 3600)
                self._token_expiry = time.time() + expires_in - 60
                self.logger.info(f"Got OAuth2 token (expires in {expires_in}s)")
                return self._access_token
            except Exception as e:
                self.logger.error(f"OAuth2 failed: {e}")
                return None

    def _invalidate_token(self):
        with self._token_lock:
            self._access_token = None
            self._token_expiry = None

    def _upload_batch(self, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        try:
            token = self._get_access_token()
            if not token:
                raise Exception("Failed to obtain OAuth2 access token")
            formatted_records = [
                self._format_record_for_lodasoft(r) for r in records
            ]
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            }
            response = self.circuit_breaker.call(
                self.session.post, self.upload_url,
                json=formatted_records, headers=headers, timeout=self.timeout,
            )
            if response.status_code == 401:
                self._invalidate_token()
                raise requests.exceptions.HTTPError("Auth failed (401)")
            response.raise_for_status()
            result = response.json()
            return {
                "success": True,
                "records_submitted": len(records),
                "new_rows": result.get("newRows", 0),
                "merged": result.get("mergedRows", 0),
                "duplicates": result.get("duplicateRows", 0),
            }
        except CircuitBreakerOpen as e:
            return {"success": False, "records_submitted": len(records),
                    "new_rows": 0, "merged": 0, "duplicates": 0, "error": str(e)}
        except Exception as e:
            return {"success": False, "records_submitted": len(records),
                    "new_rows": 0, "merged": 0, "duplicates": 0, "error": str(e)}

    def test_connection(self) -> Dict[str, Any]:
        try:
            self.logger.info("Testing Lodasoft API connection...")
            self._invalidate_token()
            token = self._get_access_token()
            if token:
                return {"success": True, "message": "Connected to Lodasoft API"}
            return {"success": False, "message": "Failed to obtain token"}
        except Exception as e:
            return {"success": False, "message": str(e)}

    def import_records(
        self,
        records: List[Dict[str, Any]],
        progress_callback: Optional[Callable[[ImportProgress], None]] = None,
    ) -> ImportProgress:
        progress = ImportProgress(
            total_records=len(records),
            total_batches=(len(records) + self.batch_size - 1) // self.batch_size,
            status="in_progress", started_at=datetime.now(),
        )
        progress.add_log(f"Starting import of {len(records)} records")
        if not records:
            progress.status = "completed"
            progress.completed_at = datetime.now()
            return progress
        if progress_callback:
            progress_callback(progress)
        try:
            batches = [
                records[i : i + self.batch_size]
                for i in range(0, len(records), self.batch_size)
            ]
            for batch_idx, batch in enumerate(batches):
                progress.current_batch = batch_idx + 1
                progress.add_log(
                    f"Batch {progress.current_batch}/{progress.total_batches}"
                )
                result = self._upload_batch(batch)
                progress.processed_records += len(batch)
                progress.successful_records += result.get("new_rows", 0)
                progress.merged_records += result.get("merged", 0)
                progress.duplicate_records += result.get("duplicates", 0)
                if not result.get("success"):
                    progress.failed_records += len(batch)
                    progress.add_log(f"Batch failed: {result.get('error')}", "ERROR")
                else:
                    progress.add_log(
                        f"Batch: {result.get('new_rows', 0)} new, "
                        f"{result.get('merged', 0)} merged"
                    )
                if progress_callback:
                    progress_callback(progress)
            progress.status = "completed"
            progress.completed_at = datetime.now()
            duration = (progress.completed_at - progress.started_at).total_seconds()
            progress.add_log(f"Completed in {duration:.1f}s")
        except Exception as e:
            progress.status = "failed"
            progress.error_message = str(e)
            progress.completed_at = datetime.now()
            progress.add_log(f"Import failed: {e}", "ERROR")
        if progress_callback:
            progress_callback(progress)
        return progress


_lodasoft_service: Optional[LodasoftCRMService] = None
_service_lock = threading.Lock()


def get_lodasoft_service() -> LodasoftCRMService:
    global _lodasoft_service
    if _lodasoft_service is None:
        with _service_lock:
            if _lodasoft_service is None:
                _lodasoft_service = LodasoftCRMService()
    return _lodasoft_service
