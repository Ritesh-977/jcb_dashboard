import os
from fastapi import HTTPException
from contextlib import contextmanager

_session = None

def init_connection_pool():
    global _session
    token_file_path = "/snowflake/session/token"
    
    if os.path.exists(token_file_path):
        # Running inside Snowflake service - use Snowpark with OAuth token
        from snowflake.snowpark import Session
        
        with open(token_file_path, "r") as f:
            token = f.read().strip()
        
        # SPCS provides SNOWFLAKE_ACCOUNT environment variable automatically
        account = os.getenv("SNOWFLAKE_ACCOUNT")
        if not account:
            # Fallback: try to read from mounted config
            try:
                with open("/snowflake/session/account", "r") as f:
                    account = f.read().strip()
            except:
                # Last resort: use the account from service deployment
                account = "ADAGLOBAL-JCB"
        
        connection_params = {
            "account": account,
            "authenticator": "oauth",
            "token": token,
            "warehouse": "my_basic_wh",
            "database": "my_dashboard_db",
            "schema": "public"
        }
        _session = Session.builder.configs(connection_params).create()
        print(f"Snowpark session created successfully in SPCS with account: {account}")
    else:
        # Local development
        from snowflake.snowpark import Session
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.backends import default_backend
        
        private_key_path = os.getenv("SNOWFLAKE_PRIVATE_KEY_PATH")
        
        if private_key_path and os.path.exists(private_key_path):
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
            
            connection_params = {
                "account": os.getenv("SNOWFLAKE_ACCOUNT"),
                "user": os.getenv("SNOWFLAKE_USER"),
                "private_key": pkb,
                "warehouse": "my_basic_wh",
                "database": "my_dashboard_db",
                "schema": "public"
            }
        else:
            authenticator = os.getenv("SNOWFLAKE_AUTHENTICATOR", "snowflake")
            connection_params = {
                "account": os.getenv("SNOWFLAKE_ACCOUNT"),
                "user": os.getenv("SNOWFLAKE_USER"),
                "warehouse": "my_basic_wh",
                "database": "my_dashboard_db",
                "schema": "public",
                "authenticator": authenticator
            }
            if authenticator == "snowflake":
                connection_params["password"] = os.getenv("SNOWFLAKE_PASSWORD")
                if os.getenv("SNOWFLAKE_PASSCODE"):
                    connection_params["passcode"] = os.getenv("SNOWFLAKE_PASSCODE")
        
        _session = Session.builder.configs(connection_params).create()
        print("Snowpark session created successfully locally")

@contextmanager
def get_snowflake_connection():
    global _session
    try:
        if _session is None:
            print("Initializing Snowflake session...")
            init_connection_pool()
        yield _session
    except Exception as e:
        print(f"Database query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
