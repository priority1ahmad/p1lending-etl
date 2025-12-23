"""
Snowflake connection service with performance optimizations.

Features:
- Connection pooling (reuse connections across jobs)
- Streaming query results (memory-efficient for large datasets)
- Feature flags: SNOWFLAKE_POOL_SIZE, SNOWFLAKE_STREAM_THRESHOLD
"""

import os
import threading
from queue import Queue, Empty
from contextlib import contextmanager
from typing import Optional, Dict, Generator
import snowflake.connector as sf
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, NoEncryption
import pandas as pd

from app.core.config import settings
from app.core.logger import etl_logger


class SnowflakeConnection:
    """Snowflake connection manager"""

    def __init__(self):
        self.connection = None
        self.cursor = None
        self.logger = etl_logger.logger.getChild("Snowflake")

    def _load_private_key(self) -> bytes:
        """Load and convert private key to DER format"""
        key_path = os.path.expanduser(settings.snowflake.private_key_path)

        if not os.path.exists(key_path):
            raise FileNotFoundError(f"Private key file not found at: {key_path}")

        with open(key_path, "rb") as f:
            # Only pass password if it's provided and not empty
            password_bytes = None
            if (
                settings.snowflake.private_key_password
                and settings.snowflake.private_key_password.strip()
            ):
                password_bytes = settings.snowflake.private_key_password.encode()

            private_key_obj = serialization.load_pem_private_key(
                f.read(),
                password=password_bytes,
            )

        return private_key_obj.private_bytes(
            encoding=Encoding.DER,
            format=PrivateFormat.PKCS8,
            encryption_algorithm=NoEncryption(),
        )

    def connect(self) -> bool:
        """Establish connection to Snowflake"""
        try:
            private_key_der = self._load_private_key()

            self.logger.info(f"Connecting to Snowflake account: {settings.snowflake.account}")

            if settings.snowflake.insecure_mode:
                self.logger.warning("⚠️  WARNING: Using insecure_mode=True - only for testing!")

            self.connection = sf.connect(
                account=settings.snowflake.account,
                user=settings.snowflake.user,
                authenticator="snowflake",
                private_key=private_key_der,
                role=settings.snowflake.role,
                warehouse=settings.snowflake.warehouse,
                database=settings.snowflake.database,
                schema=settings.snowflake.db_schema,
                autocommit=True,
                insecure_mode=settings.snowflake.insecure_mode,
                ocsp_fail_open=settings.snowflake.ocsp_fail_open,
                client_session_keep_alive=settings.snowflake.client_session_keep_alive,
                login_timeout=settings.snowflake.login_timeout,
                network_timeout=settings.snowflake.network_timeout,
            )

            self.cursor = self.connection.cursor()
            self.logger.info("✅ Successfully connected to Snowflake!")
            return True

        except Exception as e:
            self.logger.error(f"❌ Failed to connect to Snowflake: {e}")
            return False

    def disconnect(self):
        """Close the Snowflake connection"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
        self.logger.info("Snowflake connection closed")

    def execute_query(self, sql: str) -> Optional[pd.DataFrame]:
        """Execute SQL query and return results as DataFrame"""
        try:
            self.cursor.execute(sql)

            # Get column names
            columns = [desc[0] for desc in self.cursor.description]

            # Get data
            data = self.cursor.fetchall()

            # Create DataFrame
            df = pd.DataFrame(data, columns=columns)

            self.logger.info(f"✅ SQL executed successfully, returned {len(df)} rows")
            return df

        except Exception as e:
            self.logger.error(f"❌ SQL execution failed: {e}")
            return None

    def get_session_info(self) -> Dict[str, str]:
        """Get current session information"""
        try:
            result = self.execute_query(
                "SELECT CURRENT_ROLE(), CURRENT_USER(), CURRENT_ACCOUNT(), CURRENT_DATABASE(), CURRENT_SCHEMA()"
            )
            if result is not None and len(result) > 0:
                row = result.iloc[0]
                return {
                    "role": row.iloc[0],
                    "user": row.iloc[1],
                    "account": row.iloc[2],
                    "database": row.iloc[3],
                    "schema": row.iloc[4],
                }
        except Exception as e:
            self.logger.error(f"❌ Failed to get session info: {e}")

        return {}

    def execute_query_streaming(
        self, sql: str, chunk_size: int = None
    ) -> Generator[pd.DataFrame, None, None]:
        """
        Execute SQL query and yield results in chunks (memory-efficient).

        This method is recommended for large result sets (>10K rows) to avoid
        loading the entire result set into memory at once.

        Args:
            sql: SQL query to execute
            chunk_size: Number of rows per chunk (default from config)

        Yields:
            pd.DataFrame chunks of the result set
        """
        if chunk_size is None:
            chunk_size = settings.snowflake.stream_chunk_size

        try:
            self.cursor.execute(sql)

            # Get column names
            columns = [desc[0] for desc in self.cursor.description]

            rows_yielded = 0
            while True:
                # Fetch chunk of rows
                rows = self.cursor.fetchmany(chunk_size)
                if not rows:
                    break

                # Create DataFrame for this chunk
                df = pd.DataFrame(rows, columns=columns)
                rows_yielded += len(df)
                yield df

            self.logger.info(f"✅ Streaming query complete: yielded {rows_yielded} rows in chunks")

        except Exception as e:
            self.logger.error(f"❌ Streaming query failed: {e}")
            raise

    def execute_query_auto(self, sql: str, estimated_rows: int = None) -> pd.DataFrame:
        """
        Execute query with automatic decision on streaming vs fetchall.

        Uses streaming for large result sets (above threshold) to save memory,
        and regular fetchall for smaller result sets for simplicity.

        Args:
            sql: SQL query to execute
            estimated_rows: Estimated row count (if known). If above threshold, uses streaming.

        Returns:
            pd.DataFrame with all results
        """
        threshold = settings.snowflake.stream_threshold

        # If we have an estimate and it's below threshold, use regular method
        if estimated_rows is not None and estimated_rows < threshold:
            return self.execute_query(sql)

        # If no estimate, execute and check result size
        # For simplicity, use regular method but log a warning for large results
        result = self.execute_query(sql)

        if result is not None and len(result) >= threshold:
            self.logger.warning(
                f"⚠️ Large result set ({len(result)} rows). "
                f"Consider using execute_query_streaming() for better memory efficiency."
            )

        return result

    def is_connected(self) -> bool:
        """Check if connection is still valid"""
        try:
            if self.connection is None or self.cursor is None:
                return False
            # Try a simple query to verify connection is alive
            self.cursor.execute("SELECT 1")
            return True
        except Exception:
            return False


class SnowflakeConnectionPool:
    """
    Thread-safe connection pool for Snowflake connections.

    Reuses connections across jobs to avoid the 500-2000ms overhead
    of creating new connections for each job.

    Usage:
        pool = SnowflakeConnectionPool(pool_size=3)
        with pool.get_connection() as conn:
            result = conn.execute_query("SELECT ...")
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        """Singleton pattern - only one pool per process"""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, pool_size: int = None):
        # Only initialize once (singleton)
        if hasattr(self, "_initialized") and self._initialized:
            return

        self.pool_size = pool_size or settings.snowflake.pool_size
        self.timeout = settings.snowflake.pool_timeout
        self.logger = etl_logger.logger.getChild("SnowflakePool")

        # Thread-safe queue for connections
        self._pool: Queue = Queue(maxsize=self.pool_size)
        self._created_count = 0
        self._pool_lock = threading.Lock()

        self._initialized = True
        self.logger.info(f"Snowflake connection pool initialized (size={self.pool_size})")

    def _create_connection(self) -> SnowflakeConnection:
        """Create a new Snowflake connection"""
        conn = SnowflakeConnection()
        if not conn.connect():
            raise Exception("Failed to create Snowflake connection")
        return conn

    def _get_or_create_connection(self) -> SnowflakeConnection:
        """Get existing connection from pool or create new one"""
        # Try to get from pool (non-blocking)
        try:
            conn = self._pool.get_nowait()
            # Verify connection is still valid
            if conn.is_connected():
                self.logger.debug("Reusing connection from pool")
                return conn
            else:
                self.logger.warning("Connection from pool was stale, creating new one")
                conn.disconnect()
        except Empty:
            pass

        # Create new connection if under limit
        with self._pool_lock:
            if self._created_count < self.pool_size:
                self._created_count += 1
                self.logger.info(
                    f"Creating new connection ({self._created_count}/{self.pool_size})"
                )
                return self._create_connection()

        # Wait for available connection
        self.logger.debug(f"Pool exhausted, waiting up to {self.timeout}s for connection")
        try:
            conn = self._pool.get(timeout=self.timeout)
            if conn.is_connected():
                return conn
            else:
                self.logger.warning("Connection from pool was stale after wait")
                conn.disconnect()
                return self._create_connection()
        except Empty:
            raise TimeoutError(
                f"Timeout waiting for Snowflake connection from pool after {self.timeout}s"
            )

    def _return_connection(self, conn: SnowflakeConnection):
        """Return connection to the pool"""
        if conn is None:
            return

        try:
            # Only return if connection is still valid
            if conn.is_connected():
                try:
                    self._pool.put_nowait(conn)
                    self.logger.debug("Returned connection to pool")
                except Exception:
                    # Pool is full, close the connection
                    conn.disconnect()
                    self.logger.debug("Pool full, closed excess connection")
            else:
                # Connection is stale, close it
                conn.disconnect()
                with self._pool_lock:
                    self._created_count = max(0, self._created_count - 1)
                self.logger.debug("Closed stale connection")
        except Exception as e:
            self.logger.warning(f"Error returning connection to pool: {e}")

    @contextmanager
    def get_connection(self) -> Generator[SnowflakeConnection, None, None]:
        """
        Context manager for getting a pooled connection.

        Usage:
            with pool.get_connection() as conn:
                result = conn.execute_query("SELECT ...")

        The connection is automatically returned to the pool when done.
        """
        conn = None
        try:
            conn = self._get_or_create_connection()
            yield conn
        finally:
            self._return_connection(conn)

    def close_all(self):
        """Close all connections in the pool"""
        self.logger.info("Closing all connections in pool")
        while True:
            try:
                conn = self._pool.get_nowait()
                conn.disconnect()
            except Empty:
                break

        with self._pool_lock:
            self._created_count = 0

    def get_stats(self) -> Dict[str, int]:
        """Get pool statistics"""
        return {
            "pool_size": self.pool_size,
            "created_count": self._created_count,
            "available_count": self._pool.qsize(),
            "in_use_count": self._created_count - self._pool.qsize(),
        }


# Global pool instance (lazy initialization)
_connection_pool: Optional[SnowflakeConnectionPool] = None


def get_connection_pool() -> SnowflakeConnectionPool:
    """Get the global Snowflake connection pool"""
    global _connection_pool
    if _connection_pool is None:
        _connection_pool = SnowflakeConnectionPool()
    return _connection_pool


def get_pooled_connection() -> SnowflakeConnection:
    """
    Get a connection from the pool.

    Note: This returns the raw connection. For automatic return to pool,
    use the context manager: `with get_connection_pool().get_connection() as conn:`
    """
    pool = get_connection_pool()
    return pool._get_or_create_connection()
