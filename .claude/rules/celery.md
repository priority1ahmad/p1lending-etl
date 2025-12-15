---
paths: backend/app/workers/**/*.py
---

# Celery Background Job Rules

## Task Definition

### Structure
```python
from app.workers.celery_app import celery_app

@celery_app.task(
    bind=True,
    name="app.workers.tasks.task_name",
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(ConnectionError, TimeoutError),
    retry_backoff=True,
    retry_jitter=True,
)
def task_name(self, arg1: str, arg2: int) -> dict:
    """
    Task description.

    Args:
        arg1: Description
        arg2: Description

    Returns:
        Result dictionary
    """
    try:
        result = do_work(arg1, arg2)
        return {"status": "success", "data": result}
    except Exception as exc:
        self.retry(exc=exc)
```

### Task Naming
- Use full module path: `app.workers.etl_tasks.run_etl_job`
- Descriptive names: `process_batch`, `send_notification`
- Prefix with domain: `etl_`, `email_`, `cleanup_`

## Error Handling

### Retry Logic
```python
@celery_app.task(bind=True, max_retries=3)
def task_with_retry(self, data):
    try:
        return process(data)
    except TransientError as exc:
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
    except PermanentError as exc:
        # Don't retry, log and fail
        logger.error(f"Permanent failure: {exc}")
        raise
```

### Progress Updates
```python
@celery_app.task(bind=True)
def long_task(self, items):
    total = len(items)
    for i, item in enumerate(items):
        process(item)
        # Update progress
        self.update_state(
            state='PROGRESS',
            meta={'current': i + 1, 'total': total}
        )
```

## Database Access

### Sync Database Helper
```python
# Use sync session for Celery tasks (not async)
from app.workers.db_helper import get_sync_db

@celery_app.task
def db_task():
    with get_sync_db() as db:
        result = db.execute(select(Model))
        return result.scalars().all()
```

### Transaction Management
```python
@celery_app.task
def transactional_task(data):
    with get_sync_db() as db:
        try:
            # Multiple operations in one transaction
            obj1 = create_obj1(db, data)
            obj2 = create_obj2(db, data)
            db.commit()
        except Exception:
            db.rollback()
            raise
```

## WebSocket Integration

### Emit Progress Events
```python
from app.websockets.job_events import emit_job_progress

@celery_app.task(bind=True)
def task_with_ws(self, job_id, data):
    emit_job_progress(job_id, {"status": "started"})

    result = process(data)

    emit_job_progress(job_id, {"status": "completed", "result": result})
    return result
```

## Examples in Codebase
- ETL task: `backend/app/workers/etl_tasks.py`
- Celery config: `backend/app/workers/celery_app.py`
- DB helper: `backend/app/workers/db_helper.py`

## NEVER DO
- Use async/await in Celery tasks (use sync)
- Store large data in task result (use database)
- Run tasks synchronously with `.delay().get()` in request handlers
- Ignore task failures silently

## ALWAYS DO
- Set `bind=True` for access to `self`
- Configure retries for network operations
- Log task start/completion with task ID
- Use task result backend for debugging
- Set reasonable time limits
