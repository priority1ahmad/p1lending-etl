---
allowed-tools: Read, Write, Edit, Glob
description: Create a new ETL service with circuit breaker and retry patterns
argument-hint: <service-name>
---

## Task
Create a new ETL service following the patterns established in `ccc_service.py` and `idicore_service.py`, including circuit breaker, exponential backoff retry, dynamic worker calculation, and proper logging.

## Supported Arguments
- `<service-name>` - Name of the service (e.g., "lexisnexis", "experian", "secondary_phone")

## Workflow

### Step 1: Analyze Existing Patterns
Read reference implementations:
- `@backend/app/services/etl/ccc_service.py` - Circuit breaker + batch processing
- `@backend/app/services/etl/idicore_service.py` - Async retry + ThreadPoolExecutor
- `@backend/app/core/retry.py` - Exponential backoff decorator
- `@backend/app/core/concurrency.py` - Dynamic worker calculation

Key patterns:
- Circuit breaker for external API protection
- Exponential backoff with jitter
- Dynamic thread pool sizing
- JobLogger for structured logging
- Batch processing with configurable size

### Step 2: Create Service File
Create `backend/app/services/etl/{service_name}_service.py`:

```python
"""
{ServiceName} Service - External API integration for ETL pipeline.

Implements:
- Circuit breaker pattern for fault tolerance
- Exponential backoff retry with jitter
- Dynamic worker calculation based on workload
- Comprehensive logging with JobLogger
"""
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

import httpx

from app.core.config import settings
from app.core.logger import JobLogger
from app.core.retry import with_retry, CircuitBreaker
from app.core.concurrency import calculate_workers


class {ServiceName}Service:
    """
    Service for {service_name} API integration.

    Environment Variables:
        {SERVICE_NAME}_API_URL: Base URL for the API
        {SERVICE_NAME}_API_KEY: API authentication key
        {SERVICE_NAME}_BATCH_SIZE: Records per batch (default: 50)
        {SERVICE_NAME}_MIN_WORKERS: Minimum thread count (default: 2)
        {SERVICE_NAME}_MAX_WORKERS: Maximum thread count (default: 16)
        {SERVICE_NAME}_MAX_RETRIES: Retry attempts (default: 4)
        {SERVICE_NAME}_RETRY_BASE_DELAY: Initial retry delay in seconds (default: 1.0)
    """

    def __init__(self, logger: JobLogger | None = None):
        self.logger = logger
        self.api_url = getattr(settings, '{SERVICE_NAME}_API_URL', '')
        self.api_key = getattr(settings, '{SERVICE_NAME}_API_KEY', '')
        self.batch_size = getattr(settings, '{SERVICE_NAME}_BATCH_SIZE', 50)
        self.min_workers = getattr(settings, '{SERVICE_NAME}_MIN_WORKERS', 2)
        self.max_workers = getattr(settings, '{SERVICE_NAME}_MAX_WORKERS', 16)
        self.max_retries = getattr(settings, '{SERVICE_NAME}_MAX_RETRIES', 4)
        self.retry_base_delay = getattr(settings, '{SERVICE_NAME}_RETRY_BASE_DELAY', 1.0)

        # Circuit breaker: Opens after 5 failures, stays open for 60 seconds
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=5,
            recovery_timeout=60,
            name="{ServiceName}"
        )

    def _log(self, message: str, level: str = "info") -> None:
        """Log message using JobLogger if available."""
        if self.logger:
            getattr(self.logger, level)(message)
        else:
            print(f"[{level.upper()}] {message}")

    @with_retry(max_retries=4, base_delay=1.0, max_delay=30.0)
    def _api_call(self, endpoint: str, payload: dict) -> dict:
        """
        Make API call with retry logic.

        Args:
            endpoint: API endpoint path
            payload: Request payload

        Returns:
            API response as dictionary

        Raises:
            httpx.HTTPStatusError: On non-2xx response
            CircuitBreakerOpen: If circuit breaker is open
        """
        self.circuit_breaker.check()

        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    f"{self.api_url}/{endpoint}",
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    }
                )
                response.raise_for_status()
                self.circuit_breaker.record_success()
                return response.json()
        except Exception as e:
            self.circuit_breaker.record_failure()
            raise

    def process_single(self, record: dict) -> dict:
        """
        Process a single record through the API.

        Args:
            record: Input record to process

        Returns:
            Processed record with API response data
        """
        try:
            result = self._api_call("process", record)
            return {**record, "{service_name}_result": result, "{service_name}_success": True}
        except Exception as e:
            self._log(f"Failed to process record: {e}", "warning")
            return {**record, "{service_name}_error": str(e), "{service_name}_success": False}

    def process_batch(self, records: list[dict]) -> list[dict]:
        """
        Process multiple records with dynamic threading.

        Args:
            records: List of records to process

        Returns:
            List of processed records
        """
        if not records:
            return []

        # Calculate optimal worker count
        num_batches = (len(records) + self.batch_size - 1) // self.batch_size
        num_workers = calculate_workers(
            workload_size=len(records),
            batch_size=self.batch_size,
            min_workers=self.min_workers,
            max_workers=self.max_workers,
            workers_per_batch=1.5
        )

        self._log(
            f"Processing {len(records)} records with {num_workers} workers "
            f"({num_batches} batches of {self.batch_size})"
        )

        results = []
        start_time = time.time()

        with ThreadPoolExecutor(max_workers=num_workers) as executor:
            futures = {
                executor.submit(self.process_single, record): record
                for record in records
            }

            for future in as_completed(futures):
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    original = futures[future]
                    results.append({
                        **original,
                        "{service_name}_error": str(e),
                        "{service_name}_success": False
                    })

        elapsed = time.time() - start_time
        success_count = sum(1 for r in results if r.get("{service_name}_success"))

        self._log(
            f"Completed {len(results)} records in {elapsed:.2f}s "
            f"({success_count} success, {len(results) - success_count} failed)"
        )

        return results


# Singleton instance for use in ETL engine
{service_name}_service = {ServiceName}Service()
```

### Step 3: Add Configuration
Add to `backend/app/core/config.py`:

```python
# {ServiceName} API Settings
{SERVICE_NAME}_API_URL: str = ""
{SERVICE_NAME}_API_KEY: str = ""
{SERVICE_NAME}_BATCH_SIZE: int = 50
{SERVICE_NAME}_MIN_WORKERS: int = 2
{SERVICE_NAME}_MAX_WORKERS: int = 16
{SERVICE_NAME}_MAX_RETRIES: int = 4
{SERVICE_NAME}_RETRY_BASE_DELAY: float = 1.0
```

### Step 4: Update Environment Template
Add to `env.example`:

```bash
# {ServiceName} API
{SERVICE_NAME}_API_URL=https://api.example.com
{SERVICE_NAME}_API_KEY=your_api_key_here
{SERVICE_NAME}_BATCH_SIZE=50
{SERVICE_NAME}_MIN_WORKERS=2
{SERVICE_NAME}_MAX_WORKERS=16
```

### Step 5: Integration Point
Note where to integrate in `backend/app/services/etl/engine.py`:

```python
# Add import
from app.services.etl.{service_name}_service import {service_name}_service

# Add processing step in ETLEngine.run()
# After existing enrichment steps:
# records = {service_name}_service.process_batch(records)
```

## Output
- Created: `backend/app/services/etl/{service_name}_service.py`
- Updated: `backend/app/core/config.py` (manual)
- Updated: `env.example` (manual)
- Note: Integration point in engine.py

## Error Handling
- If service already exists, warn and ask before overwriting
- If config settings missing, create stub with defaults

## Related Commands
- For testing: `/test-etl-service`
- For debugging: `/debug-etl`
- For full feature: `/add-full-stack-feature`

## Example
```
/add-etl-service lexisnexis
```
Creates LexisNexis API integration service with all patterns.
