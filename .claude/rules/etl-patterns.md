---
paths: backend/app/services/etl/**/*.py
---

# ETL Service Patterns

## Service Structure

### Base Pattern
```python
class ServiceName:
    """
    Service description.

    Environment Variables:
        SERVICE_API_URL: API endpoint
        SERVICE_BATCH_SIZE: Records per batch
    """

    def __init__(self, logger: JobLogger | None = None):
        self.logger = logger
        self.batch_size = settings.SERVICE_BATCH_SIZE
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=5,
            recovery_timeout=60
        )

    def _log(self, message: str, level: str = "info"):
        if self.logger:
            getattr(self.logger, level)(message)
```

## External API Integration

### Circuit Breaker Pattern
```python
from app.core.retry import CircuitBreaker, CircuitBreakerOpen

class ExternalService:
    def __init__(self):
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=5,    # Open after 5 failures
            recovery_timeout=60,    # Stay open for 60s
            name="ServiceName"
        )

    def call_api(self, data):
        self.circuit_breaker.check()  # Raises if open
        try:
            result = make_api_call(data)
            self.circuit_breaker.record_success()
            return result
        except Exception as e:
            self.circuit_breaker.record_failure()
            raise
```

### Exponential Backoff Retry
```python
from app.core.retry import with_retry

@with_retry(max_retries=4, base_delay=1.0, max_delay=30.0)
def api_call_with_retry(endpoint, payload):
    """
    Retries with delays: 1s, 2s, 4s, 8s (with jitter)
    """
    response = httpx.post(endpoint, json=payload)
    response.raise_for_status()
    return response.json()
```

### Dynamic Worker Calculation
```python
from app.core.concurrency import calculate_workers

def process_batch(records):
    num_workers = calculate_workers(
        workload_size=len(records),
        batch_size=50,
        min_workers=2,
        max_workers=16,
        workers_per_batch=1.5
    )

    with ThreadPoolExecutor(max_workers=num_workers) as executor:
        futures = {executor.submit(process, r): r for r in records}
        # ... process results
```

## Batch Processing

### Standard Pattern
```python
def process_batch(self, records: list[dict]) -> list[dict]:
    if not records:
        return []

    self._log(f"Processing {len(records)} records")
    start_time = time.time()
    results = []

    # Process with threading
    with ThreadPoolExecutor(max_workers=self.num_workers) as executor:
        futures = {
            executor.submit(self.process_single, r): r
            for r in records
        }
        for future in as_completed(futures):
            try:
                results.append(future.result())
            except Exception as e:
                original = futures[future]
                results.append({**original, "error": str(e)})

    elapsed = time.time() - start_time
    self._log(f"Completed in {elapsed:.2f}s")
    return results
```

### Chunked Processing (for large batches)
```python
def process_large_batch(self, records, chunk_size=1000):
    results = []
    for i in range(0, len(records), chunk_size):
        chunk = records[i:i + chunk_size]
        chunk_results = self.process_batch(chunk)
        results.extend(chunk_results)
        self._log(f"Processed {min(i + chunk_size, len(records))}/{len(records)}")
    return results
```

## Database Operations

### Snowflake Queries
```python
async def query_snowflake(self, sql: str) -> list[dict]:
    """Execute query with connection pooling."""
    async with self.get_connection() as conn:
        cursor = conn.cursor(DictCursor)
        cursor.execute(sql)
        return cursor.fetchall()
```

### SQLite DNC Lookups (Batched)
```python
def check_phones_batch(self, phones: list[str]) -> set[str]:
    """
    Batch check phones against DNC list.
    Uses WHERE IN with chunking for SQLite 999-param limit.
    """
    found = set()
    for i in range(0, len(phones), 900):
        chunk = phones[i:i + 900]
        placeholders = ",".join("?" * len(chunk))
        query = f"SELECT full_phone FROM dnc_list WHERE full_phone IN ({placeholders})"
        result = self.conn.execute(query, chunk)
        found.update(row[0] for row in result)
    return found
```

## Logging

### JobLogger Usage
```python
def process(self, job_id: str, data):
    logger = JobLogger(job_id)

    logger.info("Starting processing")
    logger.progress(10, "Fetching data")

    try:
        result = do_work(data)
        logger.progress(100, "Complete")
        return result
    except Exception as e:
        logger.error(f"Failed: {e}")
        raise
```

## Examples in Codebase
- Circuit breaker: `backend/app/services/etl/ccc_service.py`
- Retry decorator: `backend/app/core/retry.py`
- Dynamic workers: `backend/app/core/concurrency.py`
- DNC batch: `backend/app/services/etl/dnc_service.py`
- Main orchestrator: `backend/app/services/etl/engine.py`

## NEVER DO
- Block on synchronous I/O without threading
- Ignore API rate limits
- Hardcode batch sizes (use config)
- Swallow exceptions silently
- Skip logging in long operations

## ALWAYS DO
- Use circuit breaker for external APIs
- Implement retry with exponential backoff
- Calculate workers dynamically
- Log timing metrics
- Handle partial failures gracefully
