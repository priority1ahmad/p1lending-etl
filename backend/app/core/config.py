"""
Configuration settings for the ETL system using Pydantic Settings
"""

from typing import Optional, List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class SnowflakeConfig(BaseSettings):
    """Snowflake connection configuration"""
    account: str = Field(default="HTWNYRU-CL36377", alias="SNOWFLAKE_ACCOUNT")
    user: str = Field(default="SDABABNEH", alias="SNOWFLAKE_USER")
    role: str = Field(default="ACCOUNTADMIN", alias="SNOWFLAKE_ROLE")
    warehouse: str = Field(default="COMPUTE_WH", alias="SNOWFLAKE_WAREHOUSE")
    database: str = Field(default="BULK_PROPERTY_DATA__NATIONAL_PRIVATE_SHARE", alias="SNOWFLAKE_DATABASE")
    db_schema: str = Field(default="PUBLIC", alias="SNOWFLAKE_SCHEMA")
    private_key_path: str = Field(default="~/.snowflake/rsa_key.p8", alias="SNOWFLAKE_PRIVATE_KEY_PATH")
    private_key_password: str = Field(default="n9caykPwD97SgAP", alias="SNOWFLAKE_PRIVATE_KEY_PASSWORD")
    insecure_mode: bool = Field(default=True, alias="SNOWFLAKE_INSECURE_MODE")
    ocsp_fail_open: bool = Field(default=True, alias="SNOWFLAKE_OCSP_FAIL_OPEN")
    client_session_keep_alive: bool = Field(default=True, alias="SNOWFLAKE_SESSION_KEEP_ALIVE")
    login_timeout: int = Field(default=60, alias="SNOWFLAKE_LOGIN_TIMEOUT")
    network_timeout: int = Field(default=60, alias="SNOWFLAKE_NETWORK_TIMEOUT")

    model_config = SettingsConfigDict(env_prefix="SNOWFLAKE_", case_sensitive=False, extra="ignore")


class GoogleSheetsConfig(BaseSettings):
    """
    Google Sheets configuration
    
    If credentials_file is not set, the service will automatically search common locations
    for "google_credentials.json" (backend/secrets/, /app/secrets/, etc.)
    """
    credentials_file: Optional[str] = Field(
        default=None, 
        alias="GOOGLE_CREDENTIALS_FILE"
    )
    credentials_json: Optional[str] = Field(
        default=None, 
        alias="GOOGLE_CREDENTIALS_JSON"
    )
    sheet_id: str = Field(default="19NHuPsTGVQQL95B-YO7hVSlb5jUgQBlP138JlTTuUFI", alias="GOOGLE_SHEET_ID")
    scopes: List[str] = Field(default_factory=lambda: ['https://www.googleapis.com/auth/spreadsheets'])

    model_config = SettingsConfigDict(env_prefix="GOOGLE_", case_sensitive=False, extra="ignore")


class CCCAPIConfig(BaseSettings):
    """CCC API configuration"""
    api_key: str = Field(default="010E6C1BBA06A5D3C14E99927766CAEFA974FCCA716E", alias="CCC_API_KEY")
    base_url: str = Field(default="https://dataapi.dncscrub.com/v1.4/scrub/litigator", alias="CCC_API_URL")
    batch_size: int = Field(default=50, alias="CCC_BATCH_SIZE")  # Max 50 phones per API request
    rate_limit_delay: float = Field(default=0.5)

    model_config = SettingsConfigDict(env_prefix="CCC_", case_sensitive=False, extra="ignore")


class IdiCOREConfig(BaseSettings):
    """idiCORE API configuration"""
    client_id: str = Field(default="api-client@p1l", alias="IDICORE_CLIENT_ID")
    client_secret: str = Field(default="RGemru9Qkrh6zW4Z4rMNRidqRCPqyRCFsgEvirx88WkJPjvbXK", alias="IDICORE_CLIENT_SECRET")
    auth_url: str = Field(default="https://login-api.idicore.com/apiclient", alias="IDICORE_AUTH_URL")
    search_url: str = Field(default="https://api.idicore.com/search", alias="IDICORE_SEARCH_URL")
    rate_limit_delay: float = Field(default=0.1)
    timeout: int = Field(default=30)
    default_address: str = Field(default="123 Main St")
    default_city: str = Field(default="Los Angeles")
    default_state: str = Field(default="CA")
    default_zip: str = Field(default="90210")

    model_config = SettingsConfigDict(env_prefix="IDICORE_", case_sensitive=False, extra="ignore")


class ETLConfig(BaseSettings):
    """ETL system configuration"""
    sql_folder: str = Field(default="sql", alias="SQL_FOLDER")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    batch_size: int = Field(default=200, alias="ETL_BATCH_SIZE")
    max_retries: int = Field(default=3)
    retry_delay: int = Field(default=5)

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
    """Main settings class that combines all configurations"""
    
    # Application settings
    secret_key: str = Field(default="your-secret-key-change-in-production", alias="SECRET_KEY")
    algorithm: str = Field(default="HS256", alias="ALGORITHM")
    access_token_expire_minutes: int = Field(default=15, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, alias="REFRESH_TOKEN_EXPIRE_DAYS")
    
    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://p1lending:p1lending_dev@localhost:5432/p1lending_etl",
        alias="DATABASE_URL"
    )
    
    # Redis
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    
    # CORS
    cors_origins: List[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://localhost:5173"],
        alias="CORS_ORIGINS"
    )
    
    # Sub-configurations
    snowflake: SnowflakeConfig = Field(default_factory=SnowflakeConfig)
    google_sheets: GoogleSheetsConfig = Field(default_factory=GoogleSheetsConfig)
    ccc_api: CCCAPIConfig = Field(default_factory=CCCAPIConfig)
    idicore: IdiCOREConfig = Field(default_factory=IdiCOREConfig)
    etl: ETLConfig = Field(default_factory=ETLConfig)
    ntfy: NTFYConfig = Field(default_factory=NTFYConfig)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


# Global settings instance
settings = Settings()

