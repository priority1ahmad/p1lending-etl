"""
Snowflake connection service (ported from old_app)
"""

import os
import snowflake.connector as sf
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, NoEncryption
from typing import Optional, Dict
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
