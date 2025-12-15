"""
Unit tests for Concurrency and Retry Utilities

Tests the dynamic worker calculation and circuit breaker/retry patterns
that provide adaptive threading and failure resilience.

Run with: pytest tests/test_concurrency_retry.py -v
"""

import pytest
from unittest.mock import Mock, MagicMock, patch
import time
import threading
import requests


# ============================================
# Tests for concurrency.py
# ============================================

class TestCalculateOptimalWorkers:
    """Tests for calculate_optimal_workers() function"""

    def test_small_workload_uses_min_workers(self):
        """Small workloads should use minimum workers"""
        from app.core.concurrency import calculate_optimal_workers

        result = calculate_optimal_workers(
            workload_size=50,
            batch_size=50,
            min_workers=2,
            max_workers=16,
            workers_per_batch=1.5
        )

        # 50/50 = 1 batch * 1.5 = 1.5, rounded and min-capped to 2
        assert result == 2

    def test_medium_workload_scales_workers(self):
        """Medium workloads should scale workers appropriately"""
        from app.core.concurrency import calculate_optimal_workers

        result = calculate_optimal_workers(
            workload_size=300,
            batch_size=50,
            min_workers=2,
            max_workers=16,
            workers_per_batch=1.5
        )

        # 300/50 = 6 batches * 1.5 = 9 workers
        assert result == 9

    def test_large_workload_caps_at_max_workers(self):
        """Large workloads should be capped at max workers"""
        from app.core.concurrency import calculate_optimal_workers

        result = calculate_optimal_workers(
            workload_size=1200,
            batch_size=50,
            min_workers=2,
            max_workers=16,
            workers_per_batch=1.5
        )

        # 1200/50 = 24 batches * 1.5 = 36, capped at 16
        assert result == 16

    def test_zero_workload_uses_min_workers(self):
        """Zero workload should return min workers"""
        from app.core.concurrency import calculate_optimal_workers

        result = calculate_optimal_workers(
            workload_size=0,
            batch_size=50,
            min_workers=2,
            max_workers=16,
            workers_per_batch=1.5
        )

        assert result == 2

    def test_negative_workload_uses_min_workers(self):
        """Negative workload should return min workers"""
        from app.core.concurrency import calculate_optimal_workers

        result = calculate_optimal_workers(
            workload_size=-100,
            batch_size=50,
            min_workers=2,
            max_workers=16,
            workers_per_batch=1.5
        )

        assert result == 2

    def test_zero_batch_size_handles_gracefully(self):
        """Zero batch size should be handled gracefully"""
        from app.core.concurrency import calculate_optimal_workers

        # Should not raise ZeroDivisionError
        result = calculate_optimal_workers(
            workload_size=100,
            batch_size=0,
            min_workers=2,
            max_workers=16,
            workers_per_batch=1.5
        )

        assert result >= 2  # Should return at least min_workers

    def test_custom_workers_per_batch(self):
        """Should respect custom workers_per_batch value"""
        from app.core.concurrency import calculate_optimal_workers

        result = calculate_optimal_workers(
            workload_size=200,
            batch_size=50,
            min_workers=2,
            max_workers=20,
            workers_per_batch=2.0  # Higher multiplier
        )

        # 200/50 = 4 batches * 2.0 = 8 workers
        assert result == 8

    def test_idicore_scenario_individual_calls(self):
        """Should handle idiCORE scenario (batch_size=1)"""
        from app.core.concurrency import calculate_optimal_workers

        result = calculate_optimal_workers(
            workload_size=150,
            batch_size=1,  # Individual API calls
            min_workers=10,
            max_workers=200,
            workers_per_batch=1.0
        )

        # 150/1 = 150 batches * 1.0 = 150 workers
        assert result == 150


class TestLogWorkerDecision:
    """Tests for log_worker_decision() function"""

    def test_logs_worker_decision(self):
        """Should log worker decision with details"""
        from app.core.concurrency import log_worker_decision

        mock_logger = Mock()
        mock_logger.info = Mock()

        log_worker_decision(
            logger=mock_logger,
            workload_size=600,
            batch_size=50,
            calculated_workers=12,
            reason="CCC litigator check"
        )

        mock_logger.info.assert_called_once()
        call_args = str(mock_logger.info.call_args)

        assert "12" in call_args  # workers
        assert "600" in call_args  # workload
        assert "50" in call_args or "batch" in call_args.lower()


class TestThreadingMetrics:
    """Tests for ThreadingMetrics class"""

    def test_logs_worker_decision(self):
        """Should track worker decisions"""
        from app.core.concurrency import ThreadingMetrics

        metrics = ThreadingMetrics()
        metrics.log_worker_decision(600, 50, 12, "CCC")

        assert len(metrics.decisions) == 1
        assert metrics.decisions[0]['workload_size'] == 600
        assert metrics.decisions[0]['workers_chosen'] == 12

    def test_logs_rate_limit_event(self):
        """Should track rate limit events"""
        from app.core.concurrency import ThreadingMetrics

        metrics = ThreadingMetrics()
        metrics.log_rate_limit_event("CCC", 2, 4.5)

        assert len(metrics.rate_limit_events) == 1
        assert metrics.rate_limit_events[0]['service'] == "CCC"
        assert metrics.rate_limit_events[0]['delay'] == 4.5

    def test_logs_circuit_breaker_event(self):
        """Should track circuit breaker events"""
        from app.core.concurrency import ThreadingMetrics

        metrics = ThreadingMetrics()
        metrics.log_circuit_breaker_event("idiCORE", "OPEN", 5)

        assert len(metrics.circuit_breaker_events) == 1
        assert metrics.circuit_breaker_events[0]['state'] == "OPEN"

    def test_get_summary(self):
        """Should return correct summary"""
        from app.core.concurrency import ThreadingMetrics

        metrics = ThreadingMetrics()
        metrics.log_worker_decision(100, 50, 4, "test")
        metrics.log_worker_decision(200, 50, 6, "test")
        metrics.log_rate_limit_event("test", 1, 1.0)
        metrics.log_circuit_breaker_event("test", "OPEN", 5)

        summary = metrics.get_summary()

        assert summary['total_worker_decisions'] == 2
        assert summary['rate_limit_hits'] == 1
        assert summary['circuit_breaker_opens'] == 1


# ============================================
# Tests for retry.py
# ============================================

class TestExponentialBackoffRetry:
    """Tests for exponential_backoff_retry decorator"""

    def test_returns_result_on_success(self):
        """Should return result on successful call"""
        from app.core.retry import exponential_backoff_retry

        @exponential_backoff_retry(max_retries=3)
        def successful_func():
            return "success"

        result = successful_func()

        assert result == "success"

    def test_retries_on_exception(self):
        """Should retry on specified exceptions"""
        from app.core.retry import exponential_backoff_retry

        call_count = 0

        @exponential_backoff_retry(
            max_retries=3,
            base_delay=0.01,  # Fast for testing
            retry_on=(ValueError,)
        )
        def flaky_func():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise ValueError("Simulated failure")
            return "success"

        result = flaky_func()

        assert result == "success"
        assert call_count == 3

    def test_raises_after_max_retries(self):
        """Should raise exception after max retries exceeded"""
        from app.core.retry import exponential_backoff_retry

        @exponential_backoff_retry(
            max_retries=2,
            base_delay=0.01,
            retry_on=(ValueError,)
        )
        def always_fails():
            raise ValueError("Always fails")

        with pytest.raises(ValueError):
            always_fails()

    def test_exponential_delay_increases(self):
        """Should increase delay exponentially"""
        from app.core.retry import exponential_backoff_retry

        delays = []
        original_sleep = time.sleep

        def mock_sleep(seconds):
            delays.append(seconds)
            # Don't actually sleep

        with patch('time.sleep', mock_sleep):
            call_count = 0

            @exponential_backoff_retry(
                max_retries=3,
                base_delay=1.0,
                max_delay=30.0,
                jitter=False,  # Disable jitter for predictable testing
                retry_on=(ValueError,)
            )
            def failing_func():
                nonlocal call_count
                call_count += 1
                if call_count <= 3:
                    raise ValueError("Fail")
                return "success"

            try:
                failing_func()
            except:
                pass

            # Should have delays: 1, 2, 4 (exponential)
            assert len(delays) == 3
            assert delays[0] == pytest.approx(1.0, rel=0.3)
            assert delays[1] == pytest.approx(2.0, rel=0.3)
            assert delays[2] == pytest.approx(4.0, rel=0.3)

    def test_respects_max_delay(self):
        """Should cap delay at max_delay"""
        from app.core.retry import exponential_backoff_retry

        delays = []

        def mock_sleep(seconds):
            delays.append(seconds)

        with patch('time.sleep', mock_sleep):
            @exponential_backoff_retry(
                max_retries=5,
                base_delay=10.0,
                max_delay=15.0,
                jitter=False,
                retry_on=(ValueError,)
            )
            def failing_func():
                raise ValueError("Fail")

            try:
                failing_func()
            except:
                pass

            # All delays should be <= max_delay
            for delay in delays:
                assert delay <= 15.0

    def test_does_not_retry_on_unspecified_exceptions(self):
        """Should not retry on exceptions not in retry_on"""
        from app.core.retry import exponential_backoff_retry

        call_count = 0

        @exponential_backoff_retry(
            max_retries=3,
            retry_on=(ValueError,)  # Only retry on ValueError
        )
        def raises_type_error():
            nonlocal call_count
            call_count += 1
            raise TypeError("Different exception")

        with pytest.raises(TypeError):
            raises_type_error()

        # Should only be called once (no retries)
        assert call_count == 1


class TestRateLimitExceeded:
    """Tests for RateLimitExceeded exception"""

    def test_rate_limit_exception_raised_on_429(self):
        """Should raise RateLimitExceeded on HTTP 429"""
        from app.core.retry import exponential_backoff_retry, RateLimitExceeded

        # Create mock 429 response
        mock_response = Mock()
        mock_response.status_code = 429

        mock_error = requests.exceptions.HTTPError()
        mock_error.response = mock_response

        @exponential_backoff_retry(
            max_retries=2,
            base_delay=0.01,
            retry_on=(requests.exceptions.HTTPError,)
        )
        def rate_limited_func():
            raise mock_error

        with pytest.raises(RateLimitExceeded):
            rate_limited_func()


class TestCircuitBreaker:
    """Tests for CircuitBreaker class"""

    def test_initial_state_is_closed(self):
        """Circuit should start in CLOSED state"""
        from app.core.retry import CircuitBreaker

        cb = CircuitBreaker(failure_threshold=3)

        assert cb._state == "CLOSED"

    def test_opens_after_failure_threshold(self):
        """Should open after reaching failure threshold"""
        from app.core.retry import CircuitBreaker

        cb = CircuitBreaker(failure_threshold=3)

        def failing_func():
            raise Exception("Failure")

        for _ in range(3):
            try:
                cb.call(failing_func)
            except:
                pass

        assert cb._state == "OPEN"

    def test_blocks_calls_when_open(self):
        """Should block calls when circuit is OPEN"""
        from app.core.retry import CircuitBreaker, CircuitBreakerOpen

        cb = CircuitBreaker(failure_threshold=2, recovery_timeout=60)

        def failing_func():
            raise Exception("Failure")

        # Trigger circuit to open
        for _ in range(2):
            try:
                cb.call(failing_func)
            except CircuitBreakerOpen:
                pass
            except:
                pass

        # Next call should be blocked
        with pytest.raises(CircuitBreakerOpen):
            cb.call(lambda: "success")

    def test_transitions_to_half_open_after_timeout(self):
        """Should transition to HALF_OPEN after recovery timeout"""
        from app.core.retry import CircuitBreaker

        cb = CircuitBreaker(
            failure_threshold=2,
            recovery_timeout=0.1  # 100ms for fast testing
        )

        def failing_func():
            raise Exception("Failure")

        # Trigger circuit to open
        for _ in range(2):
            try:
                cb.call(failing_func)
            except:
                pass

        assert cb._state == "OPEN"

        # Wait for recovery timeout
        time.sleep(0.15)

        # Try a call - should transition to HALF_OPEN
        try:
            cb.call(lambda: "success")
        except:
            pass

        # State should be HALF_OPEN or CLOSED (if success)
        assert cb._state in ["HALF_OPEN", "CLOSED"]

    def test_closes_after_success_threshold_in_half_open(self):
        """Should close after success threshold met in HALF_OPEN"""
        from app.core.retry import CircuitBreaker

        cb = CircuitBreaker(
            failure_threshold=2,
            recovery_timeout=0.05,
            success_threshold=2
        )

        def failing_func():
            raise Exception("Failure")

        # Trigger circuit to open
        for _ in range(2):
            try:
                cb.call(failing_func)
            except:
                pass

        # Wait for recovery
        time.sleep(0.1)

        # Successful calls should close circuit
        cb.call(lambda: "success")
        cb.call(lambda: "success")

        assert cb._state == "CLOSED"

    def test_reopens_on_failure_in_half_open(self):
        """Should reopen on failure while in HALF_OPEN"""
        from app.core.retry import CircuitBreaker

        cb = CircuitBreaker(
            failure_threshold=2,
            recovery_timeout=0.05,
            success_threshold=3
        )

        def failing_func():
            raise Exception("Failure")

        # Trigger circuit to open
        for _ in range(2):
            try:
                cb.call(failing_func)
            except:
                pass

        # Wait for recovery
        time.sleep(0.1)

        # First call succeeds (transitions to HALF_OPEN)
        cb.call(lambda: "success")

        # Failure should reopen circuit
        try:
            cb.call(failing_func)
        except:
            pass

        assert cb._state == "OPEN"

    def test_resets_failure_count_on_success(self):
        """Should reset failure count on successful call"""
        from app.core.retry import CircuitBreaker

        cb = CircuitBreaker(failure_threshold=3)

        def failing_func():
            raise Exception("Failure")

        # Accumulate some failures
        for _ in range(2):
            try:
                cb.call(failing_func)
            except:
                pass

        assert cb._failure_count == 2

        # Successful call should reset
        cb.call(lambda: "success")

        assert cb._failure_count == 0

    def test_thread_safety(self):
        """Circuit breaker should be thread-safe"""
        from app.core.retry import CircuitBreaker

        cb = CircuitBreaker(failure_threshold=100)
        results = []

        def thread_func():
            for _ in range(10):
                try:
                    result = cb.call(lambda: "success")
                    results.append(result)
                except:
                    pass

        threads = [threading.Thread(target=thread_func) for _ in range(10)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        # All calls should succeed
        assert len(results) == 100


class TestCircuitBreakerOpen:
    """Tests for CircuitBreakerOpen exception"""

    def test_exception_has_message(self):
        """CircuitBreakerOpen should have informative message"""
        from app.core.retry import CircuitBreakerOpen

        exc = CircuitBreakerOpen("Circuit is open, retry in 30s")

        assert "Circuit" in str(exc) or "open" in str(exc).lower()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
