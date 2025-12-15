"""
Concurrency utilities for dynamic worker calculation and threading metrics.
"""
import time
from typing import Optional
import logging


def calculate_optimal_workers(
    workload_size: int,
    batch_size: int,
    min_workers: int,
    max_workers: int,
    workers_per_batch: float = 1.5
) -> int:
    """
    Calculate optimal thread count based on workload.

    Formula: min(max((workload_size / batch_size) * workers_per_batch, min_workers), max_workers)

    Args:
        workload_size: Total items to process (e.g., phone count)
        batch_size: Items per API request batch
        min_workers: Minimum threads to use (avoid over-threading small batches)
        max_workers: Maximum threads (CPU/network limit)
        workers_per_batch: Thread multiplier per batch (default 1.5 for I/O-bound)

    Returns:
        Optimal worker count

    Examples:
        >>> calculate_optimal_workers(600, 50, 2, 16, 1.5)
        16  # 600/50 = 12 batches * 1.5 = 18, capped at 16

        >>> calculate_optimal_workers(50, 50, 2, 16, 1.5)
        2   # 50/50 = 1 batch * 1.5 = 1.5, raised to min 2
    """
    if workload_size <= 0:
        return min_workers

    if batch_size <= 0:
        batch_size = 1

    # Calculate number of batches needed
    num_batches = max(1, (workload_size + batch_size - 1) // batch_size)

    # Calculate workers based on batches
    calculated_workers = int(num_batches * workers_per_batch)

    # Apply min/max bounds
    optimal_workers = max(min_workers, min(calculated_workers, max_workers))

    return optimal_workers


def log_worker_decision(
    logger: logging.Logger,
    workload_size: int,
    batch_size: int,
    calculated_workers: int,
    reason: str
) -> None:
    """
    Log why specific worker count was chosen for observability.

    Args:
        logger: Logger instance
        workload_size: Total items being processed
        batch_size: Items per batch
        calculated_workers: Worker count chosen
        reason: Description of what this work is for
    """
    num_batches = max(1, (workload_size + batch_size - 1) // batch_size)

    logger.info(
        f"🔧 Calculated {calculated_workers} workers for {workload_size} items "
        f"({num_batches} batches of {batch_size}) - {reason}"
    )


class ThreadingMetrics:
    """Track threading and rate limiting metrics for monitoring"""

    def __init__(self):
        self.decisions = []
        self.rate_limit_events = []
        self.circuit_breaker_events = []

    def log_worker_decision(self, workload_size: int, batch_size: int, workers: int, service: str):
        """Record a worker count decision"""
        self.decisions.append({
            'timestamp': time.time(),
            'service': service,
            'workload_size': workload_size,
            'batch_size': batch_size,
            'workers_chosen': workers
        })

    def log_rate_limit_event(self, service: str, attempt: int, delay: float):
        """Record a rate limit event (HTTP 429)"""
        self.rate_limit_events.append({
            'timestamp': time.time(),
            'service': service,
            'attempt': attempt,
            'delay': delay
        })

    def log_circuit_breaker_event(self, service: str, state: str, failures: int):
        """Record a circuit breaker state change"""
        self.circuit_breaker_events.append({
            'timestamp': time.time(),
            'service': service,
            'state': state,
            'failure_count': failures
        })

    def get_summary(self):
        """Return metrics summary for job logs"""
        return {
            'total_worker_decisions': len(self.decisions),
            'rate_limit_hits': len(self.rate_limit_events),
            'circuit_breaker_opens': len([e for e in self.circuit_breaker_events if e['state'] == 'OPEN'])
        }
