"""
Configuration settings for the ETL system using Pydantic Settings

SECURITY NOTE: All sensitive credentials are REQUIRED (no defaults).
Application will fail to start if environment variables are not set.
See env.example for required variables.
"""

from typing import Optional, List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class SnowflakeConfig(BaseSettings):
    """Snowflake connection configuration

    SECURITY: Credentials are required via environment variables.
    """

    # Required credentials (no defaults - must be set via env vars)
    account: str = Field(..., alias="SNOWFLAKE_ACCOUNT")
    user: str = Field(..., alias="SNOWFLAKE_USER")
    private_key_password: str = Field(..., alias="SNOWFLAKE_PRIVATE_KEY_PASSWORD")

    # Optional with safe defaults
    role: str = Field(default="ACCOUNTADMIN", alias="SNOWFLAKE_ROLE")
    warehouse: str = Field(default="COMPUTE_WH", alias="SNOWFLAKE_WAREHOUSE")
    database: str = Field(
        default="BULK_PROPERTY_DATA__NATIONAL_PRIVATE_SHARE", alias="SNOWFLAKE_DATABASE"
    )
    db_schema: str = Field(default="PUBLIC", alias="SNOWFLAKE_SCHEMA")
    private_key_path: str = Field(
        default="/app/secrets/rsa_key.p8", alias="SNOWFLAKE_PRIVATE_KEY_PATH"
    )

    # SECURITY: Secure defaults - do NOT set to True in production
    insecure_mode: bool = Field(default=False, alias="SNOWFLAKE_INSECURE_MODE")
    ocsp_fail_open: bool = Field(default=False, alias="SNOWFLAKE_OCSP_FAIL_OPEN")

    # Connection settings
    client_session_keep_alive: bool = Field(default=True, alias="SNOWFLAKE_SESSION_KEEP_ALIVE")
    login_timeout: int = Field(default=60, alias="SNOWFLAKE_LOGIN_TIMEOUT")
    network_timeout: int = Field(default=60, alias="SNOWFLAKE_NETWORK_TIMEOUT")

    # Connection pooling settings
    pool_size: int = Field(
        default=3,
        alias="SNOWFLAKE_POOL_SIZE",
        description="Number of connections to maintain in the pool",
    )
    pool_timeout: int = Field(
        default=30,
        alias="SNOWFLAKE_POOL_TIMEOUT",
        description="Timeout in seconds when waiting for a connection from the pool",
    )

    # Streaming settings
    stream_threshold: int = Field(
        default=10000,
        alias="SNOWFLAKE_STREAM_THRESHOLD",
        description="Row count threshold above which to use streaming (memory optimization)",
    )
    stream_chunk_size: int = Field(
        default=1000,
        alias="SNOWFLAKE_STREAM_CHUNK_SIZE",
        description="Number of rows to fetch per chunk when streaming",
    )

    # Bulk upload settings
    use_bulk_upload: bool = Field(
        default=True,
        alias="SNOWFLAKE_USE_BULK_UPLOAD",
        description="Use COPY INTO for bulk uploads (10x faster than INSERT)",
    )

    model_config = SettingsConfigDict(env_prefix="SNOWFLAKE_", case_sensitive=False, extra="ignore")


class CCCAPIConfig(BaseSettings):
    """CCC API configuration

    SECURITY: API key is required via environment variable.
    """

    # Required credentials (no defaults)
    api_key: str = Field(..., alias="CCC_API_KEY")

    # API settings with safe defaults
    base_url: str = Field(
        default="https://dataapi.dncscrub.com/v1.4/scrub/litigator", alias="CCC_API_URL"
    )
    batch_size: int = Field(default=50, alias="CCC_BATCH_SIZE")  # Max 50 phones per API request
    rate_limit_delay: float = Field(default=0.5, alias="CCC_RATE_LIMIT_DELAY")

    # Dynamic threading parameters
    min_workers: int = Field(
        default=2, alias="CCC_MIN_WORKERS", description="Minimum threads for litigator checks"
    )
    max_workers: int = Field(
        default=16, alias="CCC_MAX_WORKERS", description="Maximum threads (typically CPU cores)"
    )
    workers_per_batch: float = Field(
        default=1.5,
        alias="CCC_WORKERS_PER_BATCH",
        description="Thread multiplier per batch (I/O-bound)",
    )

    # Rate limiting & retry parameters
    max_retries: int = Field(
        default=4, alias="CCC_MAX_RETRIES", description="Maximum retry attempts on failure"
    )
    retry_base_delay: float = Field(
        default=1.0, alias="CCC_RETRY_BASE_DELAY", description="Initial retry delay in seconds"
    )
    retry_max_delay: float = Field(
        default=30.0, alias="CCC_RETRY_MAX_DELAY", description="Maximum retry delay cap"
    )

    model_config = SettingsConfigDict(env_prefix="CCC_", case_sensitive=False, extra="ignore")


class IdiCOREConfig(BaseSettings):
    """idiCORE API configuration

    SECURITY: Client credentials are required via environment variables.
    """

    # Required credentials (no defaults)
    client_id: str = Field(..., alias="IDICORE_CLIENT_ID")
    client_secret: str = Field(..., alias="IDICORE_CLIENT_SECRET")
    auth_url: str = Field(
        default="https://login-api.idicore.com/apiclient", alias="IDICORE_AUTH_URL"
    )
    search_url: str = Field(default="https://api.idicore.com/search", alias="IDICORE_SEARCH_URL")
    rate_limit_delay: float = Field(default=0.1, alias="IDICORE_RATE_LIMIT_DELAY")
    timeout: int = Field(default=30, alias="IDICORE_TIMEOUT")
    default_address: str = Field(default="123 Main St")
    default_city: str = Field(default="Los Angeles")
    default_state: str = Field(default="CA")
    default_zip: str = Field(default="90210")

    # Dynamic threading parameters
    min_workers: int = Field(
        default=10, alias="IDICORE_MIN_WORKERS", description="Minimum threads for phone enrichment"
    )
    max_workers: int = Field(
        default=200,
        alias="IDICORE_MAX_WORKERS",
        description="Maximum threads for parallel API calls",
    )
    workers_scaling_factor: float = Field(
        default=1.0,
        alias="IDICORE_WORKERS_SCALING",
        description="Thread scaling factor (1.0 = 1 thread per person)",
    )

    # Rate limiting & retry parameters
    max_retries: int = Field(
        default=4, alias="IDICORE_MAX_RETRIES", description="Maximum retry attempts on failure"
    )
    retry_base_delay: float = Field(
        default=1.0, alias="IDICORE_RETRY_BASE_DELAY", description="Initial retry delay in seconds"
    )
    retry_max_delay: float = Field(
        default=30.0, alias="IDICORE_RETRY_MAX_DELAY", description="Maximum retry delay cap"
    )

    model_config = SettingsConfigDict(env_prefix="IDICORE_", case_sensitive=False, extra="ignore")


class ETLConfig(BaseSettings):
    """ETL system configuration"""

    sql_folder: str = Field(default="sql", alias="SQL_FOLDER")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    batch_size: int = Field(default=200, alias="ETL_BATCH_SIZE")
    max_retries: int = Field(default=3)
    retry_delay: int = Field(default=5)
    dnc_use_batched_query: bool = Field(
        default=True,
        alias="DNC_USE_BATCHED_QUERY",
        description="Use batched WHERE IN queries for DNC checks (6-10x faster)",
    )
    use_database_filtering: bool = Field(
        default=True,
        alias="ETL_USE_DATABASE_FILTERING",
        description="Use Snowflake database-side filtering (10-15x faster)",
    )

    # Cache LRU settings
    cache_lru_max_size: int = Field(
        default=50000,
        alias="ETL_CACHE_LRU_MAX_SIZE",
        description="Maximum entries in LRU cache before eviction (memory control)",
    )
    cache_lru_enabled: bool = Field(
        default=True,
        alias="ETL_CACHE_LRU_ENABLED",
        description="Enable LRU eviction for in-memory cache",
    )

    model_config = SettingsConfigDict(env_prefix="ETL_", case_sensitive=False, extra="ignore")


class NTFYConfig(BaseSettings):
    """NTFY push notification configuration (self-hosted)"""

    enabled: bool = Field(default=False, alias="NTFY_ENABLED")
    base_url: str = Field(default="http://ntfy:80", alias="NTFY_BASE_URL")
    token: Optional[str] = Field(default=None, alias="NTFY_TOKEN")
    timeout: int = Field(default=10, alias="NTFY_TIMEOUT")

    # Topic names
    topic_auth: str = Field(default="p1-auth", alias="NTFY_TOPIC_AUTH")
    topic_jobs: str = Field(default="p1-jobs", alias="NTFY_TOPIC_JOBS")
    topic_errors: str = Field(default="p1-errors", alias="NTFY_TOPIC_ERRORS")
    topic_system: str = Field(default="p1-system", alias="NTFY_TOPIC_SYSTEM")

    model_config = SettingsConfigDict(env_prefix="NTFY_", case_sensitive=False, extra="ignore")


class Settings(BaseSettings):
    """Main settings class that combines all configurations

    SECURITY: secret_key is required via environment variable.
    """

    # Application settings (required credentials)
    secret_key: str = Field(..., alias="SECRET_KEY")
    algorithm: str = Field(default="HS256", alias="ALGORITHM")
    access_token_expire_minutes: int = Field(default=15, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, alias="REFRESH_TOKEN_EXPIRE_DAYS")

    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://p1lending:p1lending_dev@localhost:5432/p1lending_etl",
        alias="DATABASE_URL",
    )

    # Redis
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")

    # File uploads
    file_upload_dir: str = Field(default="/tmp/uploads", alias="FILE_UPLOAD_DIR")

    # CORS
    cors_origins: List[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://localhost:5173"],
        alias="CORS_ORIGINS",
    )

    # Sub-configurations
    snowflake: SnowflakeConfig = Field(default_factory=SnowflakeConfig)
    ccc_api: CCCAPIConfig = Field(default_factory=CCCAPIConfig)
    idicore: IdiCOREConfig = Field(default_factory=IdiCOREConfig)
    etl: ETLConfig = Field(default_factory=ETLConfig)
    ntfy: NTFYConfig = Field(default_factory=NTFYConfig)

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="ignore"
    )


# Global settings instance
settings = Settings()
