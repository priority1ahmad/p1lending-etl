"""
Configuration endpoints
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.models.config import AppConfig
from app.db.models.user import User
from app.schemas.config import ConfigResponse, ConfigUpdate, TestConnectionResponse
from app.api.v1.deps import get_current_user
from app.core.config import settings
from cryptography.fernet import Fernet
import base64
import os

router = APIRouter(prefix="/config", tags=["config"])

# Encryption key (in production, store this securely)
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", Fernet.generate_key().decode())
fernet = Fernet(base64.urlsafe_b64encode(ENCRYPTION_KEY.encode().ljust(32)[:32]))


def encrypt_value(value: str) -> str:
    """Encrypt a configuration value"""
    return fernet.encrypt(value.encode()).decode()


def decrypt_value(encrypted_value: str) -> str:
    """Decrypt a configuration value"""
    return fernet.decrypt(encrypted_value.encode()).decode()


async def get_config_value(key: str, db: AsyncSession) -> Optional[str]:
    """Get a configuration value from database"""
    result = await db.execute(select(AppConfig).where(AppConfig.key == key))
    config_item = result.scalar_one_or_none()
    
    if not config_item:
        return None
    
    if config_item.is_encrypted and config_item.value:
        try:
            return decrypt_value(config_item.value)
        except Exception as e:
            # If decryption fails, log error and return None (don't use encrypted value)
            import logging
            logger = logging.getLogger("app.api.v1.endpoints.config")
            logger.warning(f"Failed to decrypt config value for key '{key}': {e}")
            return None
    
    return config_item.value


async def set_config_value(key: str, value: str, is_encrypted: bool, user_id, db: AsyncSession):
    """Set a configuration value in database"""
    result = await db.execute(select(AppConfig).where(AppConfig.key == key))
    config_item = result.scalar_one_or_none()
    
    if config_item:
        config_item.value = encrypt_value(value) if is_encrypted else value
        config_item.is_encrypted = is_encrypted
        config_item.updated_by = user_id
    else:
        config_item = AppConfig(
            key=key,
            value=encrypt_value(value) if is_encrypted else value,
            is_encrypted=is_encrypted,
            updated_by=user_id
        )
        db.add(config_item)
    
    await db.commit()


@router.get("", response_model=ConfigResponse)
async def get_config(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all configuration"""
    import logging
    logger = logging.getLogger("app.api.v1.endpoints.config")
    
    # Get values from DB, but use defaults from settings if not found or empty
    db_client_id = await get_config_value("idicore_client_id", db)
    db_client_secret = await get_config_value("idicore_client_secret", db)
    
    # Only use database values if they're not None and not empty strings
    # Fall back to settings if database value is None, empty, or just whitespace
    if db_client_id and db_client_id.strip():
        idicore_client_id = db_client_id.strip()
        logger.debug("Using idiCORE client_id from database")
    else:
        idicore_client_id = (settings.idicore.client_id or "").strip()
        logger.debug(f"Using idiCORE client_id from settings: '{idicore_client_id[:20]}...' (length: {len(idicore_client_id)})")
    
    if db_client_secret and db_client_secret.strip():
        idicore_client_secret = db_client_secret.strip()
        logger.debug("Using idiCORE client_secret from database")
    else:
        idicore_client_secret = (settings.idicore.client_secret or "").strip()
        logger.debug(f"Using idiCORE client_secret from settings (length: {len(idicore_client_secret)})")
    
    db_google_sheet_url = await get_config_value("google_sheet_url", db)
    if db_google_sheet_url and db_google_sheet_url.strip():
        google_sheet_url = db_google_sheet_url.strip()
    else:
        google_sheet_url = ""
    
    # Get Snowflake values from settings
    snowflake_account = (settings.snowflake.account or "").strip()
    snowflake_user = (settings.snowflake.user or "").strip()
    snowflake_database = (settings.snowflake.database or "").strip()
    snowflake_schema = (settings.snowflake.db_schema or "").strip()
    
    logger.debug(f"Config response - idiCORE ID: {'set' if idicore_client_id else 'empty'}, "
                 f"idiCORE Secret: {'set' if idicore_client_secret else 'empty'}, "
                 f"Snowflake Account: {snowflake_account}")
    
    return ConfigResponse(
        idicore_client_id=idicore_client_id,
        idicore_client_secret=idicore_client_secret,
        google_sheet_url=google_sheet_url,
        snowflake_account=snowflake_account,
        snowflake_user=snowflake_user,
        snowflake_database=snowflake_database,
        snowflake_schema=snowflake_schema,
    )


@router.put("", response_model=ConfigResponse)
async def update_config(
    config_update: ConfigUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update configuration"""
    config_dict = config_update.config
    
    # Update idiCORE credentials - only save if value is provided and not empty
    if "idicore_client_id" in config_dict and config_dict["idicore_client_id"]:
        await set_config_value("idicore_client_id", config_dict["idicore_client_id"], False, current_user.id, db)
    
    if "idicore_client_secret" in config_dict and config_dict["idicore_client_secret"]:
        await set_config_value("idicore_client_secret", config_dict["idicore_client_secret"], True, current_user.id, db)
    
    if "google_sheet_url" in config_dict:
        await set_config_value("google_sheet_url", config_dict["google_sheet_url"], False, current_user.id, db)
    
    return await get_config(db, current_user)


@router.post("/test/idicore", response_model=TestConnectionResponse)
async def test_idicore(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Test idiCORE connection"""
    try:
        import logging
        logger = logging.getLogger("app.api.v1.endpoints.config")
        
        # Get credentials from database first
        db_client_id = await get_config_value("idicore_client_id", db)
        db_client_secret = await get_config_value("idicore_client_secret", db)
        
        # Fall back to settings if not in database
        client_id = db_client_id or settings.idicore.client_id
        client_secret = db_client_secret or settings.idicore.client_secret
        
        # Log which source we're using
        if db_client_id:
            logger.info(f"Using client_id from database: '{db_client_id[:20]}...'")
        else:
            logger.info(f"Using client_id from settings/default: '{client_id[:20]}...'")
        
        if db_client_secret:
            logger.info(f"Using client_secret from database (length: {len(db_client_secret)})")
        else:
            logger.info(f"Using client_secret from settings/default (length: {len(client_secret)})")
        
        if not client_id or not client_secret:
            return TestConnectionResponse(
                success=False,
                message="idiCORE credentials not configured. Please enter credentials in the Configuration page."
            )
        
        # Strip whitespace (common issue)
        client_id = client_id.strip()
        client_secret = client_secret.strip()
        
        # Debug: Log credential info (without exposing full secret)
        logger.info(f"Testing IDI connection with client_id: '{client_id}', secret length: {len(client_secret)}")
        
        # Import here to avoid circular dependency
        from app.services.etl.idicore_service import IdiCOREAPIService
        
        service = IdiCOREAPIService(client_id, client_secret)
        token = service._get_auth_token()
        
        if token:
            return TestConnectionResponse(
                success=True,
                message="idiCORE connection successful"
            )
        else:
            return TestConnectionResponse(
                success=False,
                message="Failed to obtain authentication token. Please check your credentials. Common issues: invalid credentials, IP not whitelisted, or account issues."
            )
    except Exception as e:
        import logging
        logger = logging.getLogger("app.api.v1.endpoints.config")
        logger.error(f"IDI connection test error: {str(e)}", exc_info=True)
        return TestConnectionResponse(
            success=False,
            message=f"Connection test failed: {str(e)}"
        )


@router.post("/test/snowflake", response_model=TestConnectionResponse)
async def test_snowflake(
    current_user: User = Depends(get_current_user)
):
    """Test Snowflake connection"""
    try:
        from app.services.etl.snowflake_service import SnowflakeConnection
        
        conn = SnowflakeConnection()
        if conn.connect():
            conn.disconnect()
            return TestConnectionResponse(
                success=True,
                message="Snowflake connection successful"
            )
        else:
            return TestConnectionResponse(
                success=False,
                message="Failed to connect to Snowflake"
            )
    except Exception as e:
        return TestConnectionResponse(
            success=False,
            message=f"Connection test failed: {str(e)}"
        )


@router.post("/test/google-sheets", response_model=TestConnectionResponse)
async def test_google_sheets(
    current_user: User = Depends(get_current_user)
):
    """Test Google Sheets connection"""
    try:
        from app.services.etl.google_sheets_service import GoogleSheetsConnection
        
        conn = GoogleSheetsConnection()
        if conn.connect():
            return TestConnectionResponse(
                success=True,
                message="Google Sheets connection successful"
            )
        else:
            return TestConnectionResponse(
                success=False,
                message="Failed to connect to Google Sheets"
            )
    except Exception as e:
        return TestConnectionResponse(
            success=False,
            message=f"Connection test failed: {str(e)}"
        )

