import os
import snowflake.connector
from snowflake.connector.connection import SnowflakeConnection
from fastapi import HTTPException
from contextlib import contextmanager
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

_connection_pool = None

def init_connection_pool():
    global _connection_pool
    token_file_path = "/snowflake/session/token"
    
    if os.path.exists(token_file_path):
        with open(token_file_path, "r") as f:
            token = f.read().strip()
        _connection_pool = snowflake.connector.connect(
            account=os.getenv("SNOWFLAKE_ACCOUNT"),
            authenticator="oauth",
            token=token,
            warehouse="my_basic_wh",
            database="my_dashboard_db",
            schema="public",
            client_session_keep_alive=True
        )
    else:
        private_key_path = os.getenv("SNOWFLAKE_PRIVATE_KEY_PATH")
        
        if private_key_path and os.path.exists(private_key_path):
            # Use key-pair authentication
            with open(private_key_path, "rb") as key_file:
                private_key = serialization.load_pem_private_key(
                    key_file.read(),
                    password=None,
                    backend=default_backend()
                )
            
            pkb = private_key.private_bytes(
                encoding=serialization.Encoding.DER,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )
            
            _connection_pool = snowflake.connector.connect(
                account=os.getenv("SNOWFLAKE_ACCOUNT"),
                user=os.getenv("SNOWFLAKE_USER"),
                private_key=pkb,
                warehouse="my_basic_wh",
                database="my_dashboard_db",
                schema="public",
                client_session_keep_alive=True
            )
        else:
            # Fallback to password/browser auth
            authenticator = os.getenv("SNOWFLAKE_AUTHENTICATOR", "snowflake")
            conn_params = {
                "account": os.getenv("SNOWFLAKE_ACCOUNT"),
                "user": os.getenv("SNOWFLAKE_USER"),
                "warehouse": "my_basic_wh",
                "database": "my_dashboard_db",
                "schema": "public",
                "client_session_keep_alive": True,
                "authenticator": authenticator
            }
            if authenticator == "snowflake":
                conn_params["password"] = os.getenv("SNOWFLAKE_PASSWORD")
            _connection_pool = snowflake.connector.connect(**conn_params)

@contextmanager
def get_snowflake_connection():
    global _connection_pool
    try:
        if _connection_pool is None or _connection_pool.is_closed():
            init_connection_pool()
        # Ping to detect stale connections and reconnect
        _connection_pool.cursor().execute("SELECT 1")
    except Exception:
        print("Reconnecting to Snowflake...")
        init_connection_pool()
    try:
        yield _connection_pool
    except Exception as e:
        print(f"Database query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))