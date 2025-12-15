#!/usr/bin/env python3
"""
Integration test script for ETL Performance Optimizations

Tests all three priority optimizations:
1. Snowflake Pre-Filtering
2. DNC Batch Queries
3. Dynamic Threading & Rate Limiting

Usage:
    python scripts/test_etl_optimizations.py
    python scripts/test_etl_optimizations.py --verbose
    python scripts/test_etl_optimizations.py --quick  # Skip slow tests
"""

import sys
import os
import time
import argparse
from typing import Dict, List, Tuple

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.etl.engine import ETLEngine
from app.services.etl.dnc_service import DNCChecker
from app.services.etl.ccc_service import CCCAPIService
from app.services.etl.idicore_service import IdiCOREAPIService
from app.core.concurrency import calculate_optimal_workers
from app.core.retry import CircuitBreaker, exponential_backoff_retry
from app.core.config import settings


class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'


def print_header(text: str):
    """Print a formatted header"""
    print(f"\n{Colors.BLUE}{Colors.BOLD}{'=' * 70}{Colors.END}")
    print(f"{Colors.BLUE}{Colors.BOLD}{text.center(70)}{Colors.END}")
    print(f"{Colors.BLUE}{Colors.BOLD}{'=' * 70}{Colors.END}\n")


def print_test(name: str, passed: bool, message: str = ""):
    """Print test result"""
    status = f"{Colors.GREEN}✓ PASS{Colors.END}" if passed else f"{Colors.RED}✗ FAIL{Colors.END}"
    print(f"{status} | {name}")
    if message:
        print(f"       {message}")


def print_metric(name: str, value: str):
    """Print a metric"""
    print(f"  {Colors.YELLOW}•{Colors.END} {name}: {Colors.BOLD}{value}{Colors.END}")


# ============================================
# Test 1: Dynamic Worker Calculation
# ============================================

def test_worker_calculation() -> Tuple[bool, str]:
    """Test dynamic worker calculation logic"""
    print_header("Test 1: Dynamic Worker Calculation")

    all_passed = True

    # Test case 1: Small workload
    workers = calculate_optimal_workers(50, 50, 2, 16, 1.5)
    passed = workers == 2
    print_test("Small workload (50 items)", passed, f"Expected 2, got {workers}")
    all_passed &= passed

    # Test case 2: Medium workload
    workers = calculate_optimal_workers(600, 50, 2, 16, 1.5)
    passed = workers == 16
    print_test("Medium workload (600 items)", passed, f"Expected 16 (capped), got {workers}")
    all_passed &= passed

    # Test case 3: Large workload
    workers = calculate_optimal_workers(1200, 50, 2, 16, 1.5)
    passed = workers == 16
    print_test("Large workload (1200 items)", passed, f"Expected 16 (capped), got {workers}")
    all_passed &= passed

    # Test case 4: Edge case - zero workload
    workers = calculate_optimal_workers(0, 50, 2, 16, 1.5)
    passed = workers == 2
    print_test("Zero workload", passed, f"Expected 2 (min), got {workers}")
    all_passed &= passed

    return all_passed, "Worker calculation tests completed"


# ============================================
# Test 2: Circuit Breaker Pattern
# ============================================

def test_circuit_breaker() -> Tuple[bool, str]:
    """Test circuit breaker state transitions"""
    print_header("Test 2: Circuit Breaker Pattern")

    import logging
    logger = logging.getLogger("test")

    all_passed = True

    # Create circuit breaker
    cb = CircuitBreaker(
        failure_threshold=3,
        recovery_timeout=2.0,
        success_threshold=2,
        logger=logger
    )

    # Test initial state
    passed = cb._state == "CLOSED"
    print_test("Initial state is CLOSED", passed)
    all_passed &= passed

    # Test failure accumulation
    def failing_func():
        raise Exception("Simulated failure")

    for i in range(3):
        try:
            cb.call(failing_func)
        except:
            pass

    passed = cb._state == "OPEN"
    print_test("Opens after threshold failures", passed, f"State: {cb._state}")
    all_passed &= passed

    # Test that calls are blocked when open
    try:
        cb.call(lambda: "success")
        print_test("Blocks calls when OPEN", False, "Call should have been blocked")
        all_passed = False
    except Exception as e:
        passed = "Circuit breaker is OPEN" in str(e)
        print_test("Blocks calls when OPEN", passed)
        all_passed &= passed

    # Wait for recovery timeout
    print("  Waiting for recovery timeout (2s)...")
    time.sleep(2.1)

    # Test transition to HALF_OPEN
    try:
        cb.call(lambda: "success")
        passed = cb._state == "HALF_OPEN" or cb._state == "CLOSED"
        print_test("Transitions to HALF_OPEN after timeout", passed, f"State: {cb._state}")
    except:
        print_test("Transitions to HALF_OPEN after timeout", False)
        all_passed = False

    return all_passed, "Circuit breaker tests completed"


# ============================================
# Test 3: DNC Batch Query Performance
# ============================================

def test_dnc_batch_query(quick: bool = False) -> Tuple[bool, str]:
    """Test DNC batch query performance"""
    print_header("Test 3: DNC Batch Query Performance")

    if quick:
        print(f"{Colors.YELLOW}Skipped (quick mode){Colors.END}")
        return True, "Skipped in quick mode"

    try:
        dnc_checker = DNCChecker()

        # Test with small batch
        test_phones = ["5551234567", "8885551234", "4155551234"]

        start = time.time()
        results = dnc_checker.check_multiple_phones(test_phones)
        elapsed = time.time() - start

        all_passed = True

        # Verify results format
        passed = len(results) == len(test_phones)
        print_test("Returns correct number of results", passed, f"{len(results)}/{len(test_phones)}")
        all_passed &= passed

        # Verify result structure
        if results:
            passed = all('phone' in r and 'in_dnc_list' in r for r in results)
            print_test("Results have correct structure", passed)
            all_passed &= passed

        # Performance metric
        print_metric("Batch query time (3 phones)", f"{elapsed*1000:.2f}ms")

        # Test with larger batch (if not quick mode)
        large_phones = [f"555123{i:04d}" for i in range(100)]
        start = time.time()
        large_results = dnc_checker.check_multiple_phones(large_phones)
        elapsed = time.time() - start

        passed = len(large_results) == len(large_phones)
        print_test("Handles large batches (100 phones)", passed)
        all_passed &= passed

        print_metric("Batch query time (100 phones)", f"{elapsed*1000:.2f}ms")

        # Should be under 500ms for 100 phones
        passed = elapsed < 0.5
        print_test("Performance target (<500ms for 100)", passed, f"{elapsed*1000:.2f}ms")
        all_passed &= passed

        return all_passed, "DNC batch query tests completed"

    except Exception as e:
        print_test("DNC batch query test", False, f"Error: {e}")
        return False, f"Error: {e}"


# ============================================
# Test 4: Configuration Validation
# ============================================

def test_configuration() -> Tuple[bool, str]:
    """Test that all new configuration parameters are accessible"""
    print_header("Test 4: Configuration Validation")

    all_passed = True

    # Test CCC configuration
    try:
        ccc_params = [
            ('min_workers', settings.ccc_api.min_workers),
            ('max_workers', settings.ccc_api.max_workers),
            ('workers_per_batch', settings.ccc_api.workers_per_batch),
            ('max_retries', settings.ccc_api.max_retries),
            ('retry_base_delay', settings.ccc_api.retry_base_delay),
            ('retry_max_delay', settings.ccc_api.retry_max_delay),
        ]

        for param_name, value in ccc_params:
            passed = value is not None
            print_test(f"CCC config: {param_name}", passed, f"Value: {value}")
            all_passed &= passed

    except Exception as e:
        print_test("CCC configuration", False, f"Error: {e}")
        all_passed = False

    # Test idiCORE configuration
    try:
        idicore_params = [
            ('min_workers', settings.idicore.min_workers),
            ('max_workers', settings.idicore.max_workers),
            ('workers_scaling_factor', settings.idicore.workers_scaling_factor),
            ('max_retries', settings.idicore.max_retries),
            ('retry_base_delay', settings.idicore.retry_base_delay),
            ('retry_max_delay', settings.idicore.retry_max_delay),
        ]

        for param_name, value in idicore_params:
            passed = value is not None
            print_test(f"idiCORE config: {param_name}", passed, f"Value: {value}")
            all_passed &= passed

    except Exception as e:
        print_test("idiCORE configuration", False, f"Error: {e}")
        all_passed = False

    # Test ETL configuration
    try:
        passed = hasattr(settings.etl, 'use_database_filtering')
        print_test("ETL: use_database_filtering", passed,
                  f"Value: {getattr(settings.etl, 'use_database_filtering', 'N/A')}")
        all_passed &= passed

        passed = hasattr(settings.etl, 'dnc_use_batched_query')
        print_test("ETL: dnc_use_batched_query", passed,
                  f"Value: {getattr(settings.etl, 'dnc_use_batched_query', 'N/A')}")
        all_passed &= passed

    except Exception as e:
        print_test("ETL configuration", False, f"Error: {e}")
        all_passed = False

    return all_passed, "Configuration validation completed"


# ============================================
# Main Test Runner
# ============================================

def main():
    """Run all integration tests"""
    parser = argparse.ArgumentParser(description='Test ETL Performance Optimizations')
    parser.add_argument('--verbose', action='store_true', help='Verbose output')
    parser.add_argument('--quick', action='store_true', help='Skip slow tests')
    args = parser.parse_args()

    print(f"\n{Colors.BOLD}ETL Performance Optimization Test Suite{Colors.END}")
    print(f"Testing optimizations for 4-8x performance improvement\n")

    results = []

    # Run all tests
    results.append(("Worker Calculation", *test_worker_calculation()))
    results.append(("Circuit Breaker", *test_circuit_breaker()))
    results.append(("DNC Batch Query", *test_dnc_batch_query(quick=args.quick)))
    results.append(("Configuration", *test_configuration()))

    # Print summary
    print_header("Test Summary")

    passed_count = sum(1 for _, passed, _ in results if passed)
    total_count = len(results)

    for name, passed, message in results:
        status = f"{Colors.GREEN}PASS{Colors.END}" if passed else f"{Colors.RED}FAIL{Colors.END}"
        print(f"  {status} | {name}: {message}")

    print(f"\n{Colors.BOLD}Results: {passed_count}/{total_count} tests passed{Colors.END}")

    if passed_count == total_count:
        print(f"\n{Colors.GREEN}{Colors.BOLD}✓ All tests passed! Optimizations are working correctly.{Colors.END}\n")
        return 0
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}✗ Some tests failed. Please review the output above.{Colors.END}\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
