import os
import snowflake.connector
from snowflake.connector.connection import SnowflakeConnection
from fastapi import HTTPException
from contextlib import contextmanager

_connection_pool = None

def init_connection_pool():
    global _connection_pool
    token_file_path = "/snowflake/session/token"
    
    if os.path.exists(token_file_path):
        with open(token_file_path, "r") as f:
            token = f.read().strip()
        _connection_pool = snowflake.connector.connect(
            host=os.getenv("SNOWFLAKE_HOST"),
            port=os.getenv("SNOWFLAKE_PORT"),
            account=os.getenv("SNOWFLAKE_ACCOUNT"),
            authenticator="oauth",
            token=token,
            warehouse="my_basic_wh",
            database="my_dashboard",
            schema="public",
            client_session_keep_alive=True
        )
    else:
        _connection_pool = snowflake.connector.connect(
            host=os.getenv("SNOWFLAKE_HOST"),
            port=int(os.getenv("SNOWFLAKE_PORT", 443)),
            account=os.getenv("SNOWFLAKE_ACCOUNT"),
            user=os.getenv("SNOWFLAKE_USER"),
            password=os.getenv("SNOWFLAKE_PASSWORD"),
            warehouse="my_basic_wh",
            database="my_dashboard",
            schema="public",
            client_session_keep_alive=True
        )

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