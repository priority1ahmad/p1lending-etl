---
allowed-tools: Read, Write, Edit, Glob, Bash(python -m pytest:*), Bash(pytest:*)
description: Generate pytest test scaffold for ETL services
argument-hint: <service-name>
---

## Task
Generate comprehensive pytest tests for an ETL service, including unit tests, integration tests, and mock configurations.

## Supported Arguments
- `<service-name>` - Name of the service to test (e.g., "ccc", "idicore", "dnc")

## Workflow

### Step 1: Analyze Service
Read the service implementation:
- `@backend/app/services/etl/{service_name}_service.py`

Identify:
- Public methods to test
- External dependencies to mock
- Configuration requirements
- Error scenarios

### Step 2: Analyze Test Patterns
Read existing test patterns:
- `@backend/tests/conftest.py` - Fixtures and configuration
- `@backend/tests/test_concurrency_retry.py` - Retry/circuit breaker tests
- `@backend/tests/test_dnc_batch_optimization.py` - Batch processing tests

### Step 3: Create Test File
Create `backend/tests/test_{service_name}_service.py`:

```python
"""
Tests for {ServiceName} Service.

Run with: pytest tests/test_{service_name}_service.py -v
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from concurrent.futures import ThreadPoolExecutor

from app.services.etl.{service_name}_service import {ServiceName}Service
from app.core.retry import CircuitBreakerOpen


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def mock_logger():
    """Create a mock JobLogger for testing."""
    logger = Mock()
    logger.info = Mock()
    logger.warning = Mock()
    logger.error = Mock()
    return logger


@pytest.fixture
def service(mock_logger):
    """Create service instance with mock logger."""
    return {ServiceName}Service(logger=mock_logger)


@pytest.fixture
def sample_records():
    """Sample records for batch processing tests."""
    return [
        {"id": "1", "name": "Test 1", "data": "value1"},
        {"id": "2", "name": "Test 2", "data": "value2"},
        {"id": "3", "name": "Test 3", "data": "value3"},
    ]


# ============================================================================
# Unit Tests - Single Record Processing
# ============================================================================

class TestProcessSingle:
    """Tests for single record processing."""

    @patch.object({ServiceName}Service, '_api_call')
    def test_process_single_success(self, mock_api, service):
        """Test successful single record processing."""
        mock_api.return_value = {"status": "success", "enriched": True}

        result = service.process_single({"id": "1", "name": "Test"})

        assert result["{service_name}_success"] is True
        assert "{service_name}_result" in result
        mock_api.assert_called_once()

    @patch.object({ServiceName}Service, '_api_call')
    def test_process_single_api_error(self, mock_api, service):
        """Test handling of API errors."""
        mock_api.side_effect = Exception("API Error")

        result = service.process_single({"id": "1", "name": "Test"})

        assert result["{service_name}_success"] is False
        assert "{service_name}_error" in result

    @patch.object({ServiceName}Service, '_api_call')
    def test_process_single_preserves_original_data(self, mock_api, service):
        """Test that original record data is preserved."""
        mock_api.return_value = {"status": "success"}
        original = {"id": "1", "name": "Test", "custom_field": "preserved"}

        result = service.process_single(original)

        assert result["id"] == "1"
        assert result["name"] == "Test"
        assert result["custom_field"] == "preserved"


# ============================================================================
# Unit Tests - Batch Processing
# ============================================================================

class TestProcessBatch:
    """Tests for batch processing."""

    @patch.object({ServiceName}Service, 'process_single')
    def test_process_batch_empty(self, mock_single, service):
        """Test handling of empty batch."""
        result = service.process_batch([])

        assert result == []
        mock_single.assert_not_called()

    @patch.object({ServiceName}Service, 'process_single')
    def test_process_batch_success(self, mock_single, service, sample_records):
        """Test successful batch processing."""
        mock_single.side_effect = lambda r: {**r, "{service_name}_success": True}

        results = service.process_batch(sample_records)

        assert len(results) == len(sample_records)
        assert all(r["{service_name}_success"] for r in results)

    @patch.object({ServiceName}Service, 'process_single')
    def test_process_batch_partial_failure(self, mock_single, service, sample_records):
        """Test batch with some failures."""
        def mock_process(record):
            if record["id"] == "2":
                return {**record, "{service_name}_success": False, "{service_name}_error": "Failed"}
            return {**record, "{service_name}_success": True}

        mock_single.side_effect = mock_process

        results = service.process_batch(sample_records)

        success_count = sum(1 for r in results if r["{service_name}_success"])
        assert success_count == 2
        assert len(results) == 3

    def test_process_batch_logs_summary(self, service, sample_records, mock_logger):
        """Test that batch processing logs summary."""
        with patch.object(service, 'process_single', return_value={"{service_name}_success": True}):
            service.process_batch(sample_records)

        # Verify logging was called
        assert mock_logger.info.called


# ============================================================================
# Unit Tests - Circuit Breaker
# ============================================================================

class TestCircuitBreaker:
    """Tests for circuit breaker behavior."""

    def test_circuit_breaker_opens_after_failures(self, service):
        """Test circuit breaker opens after threshold failures."""
        # Record failures up to threshold
        for _ in range(5):
            service.circuit_breaker.record_failure()

        # Should now be open
        with pytest.raises(CircuitBreakerOpen):
            service.circuit_breaker.check()

    def test_circuit_breaker_resets_on_success(self, service):
        """Test circuit breaker resets failure count on success."""
        # Record some failures
        for _ in range(3):
            service.circuit_breaker.record_failure()

        # Record success
        service.circuit_breaker.record_success()

        # Should not raise
        service.circuit_breaker.check()


# ============================================================================
# Integration Tests
# ============================================================================

class TestIntegration:
    """Integration tests (require external services or mocks)."""

    @pytest.mark.integration
    @pytest.mark.skip(reason="Requires external API - run manually")
    def test_real_api_call(self, service):
        """Test against real API (manual run only)."""
        result = service.process_single({"id": "test", "data": "integration"})
        assert "{service_name}_success" in result


# ============================================================================
# Performance Tests
# ============================================================================

class TestPerformance:
    """Performance and load tests."""

    @patch.object({ServiceName}Service, 'process_single')
    def test_batch_processing_time(self, mock_single, service):
        """Test batch processing completes in reasonable time."""
        import time

        # Simulate API latency
        def slow_process(record):
            time.sleep(0.01)  # 10ms per record
            return {**record, "{service_name}_success": True}

        mock_single.side_effect = slow_process

        # Create large batch
        records = [{"id": str(i)} for i in range(100)]

        start = time.time()
        results = service.process_batch(records)
        elapsed = time.time() - start

        # With threading, should be much faster than sequential (100 * 0.01 = 1s)
        assert elapsed < 0.5  # Should complete in under 500ms with parallelism
        assert len(results) == 100
```

### Step 4: Update conftest.py (if needed)
Add shared fixtures to `backend/tests/conftest.py`:

```python
@pytest.fixture
def mock_{service_name}_api():
    """Mock {ServiceName} API responses."""
    with patch('app.services.etl.{service_name}_service.httpx.Client') as mock:
        yield mock
```

### Step 5: Run Tests
```bash
cd backend && python -m pytest tests/test_{service_name}_service.py -v
```

## Output
- Created: `backend/tests/test_{service_name}_service.py`
- Optional: Updated `backend/tests/conftest.py`

## Test Categories
| Category | Marker | Purpose |
|----------|--------|---------|
| Unit | (none) | Fast, isolated tests |
| Integration | `@pytest.mark.integration` | External service tests |
| Performance | (none) | Load and timing tests |

## Error Handling
- If test file exists, warn and ask before overwriting
- If service doesn't exist, error with suggestion

## Related Commands
- For service creation: `/add-etl-service`
- For debugging: `/debug-etl`
- For full checks: `/lint`

## Example
```
/test-etl-service ccc
```
Creates comprehensive tests for CCC service.
