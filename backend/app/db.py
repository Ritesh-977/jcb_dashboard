import os
from fastapi import HTTPException
from contextlib import contextmanager

_session = None
_use_local_connection = False

def init_connection_pool():
    global _session, _use_local_connection
    token_file_path = "/snowflake/session/token"
    
    if os.path.exists(token_file_path):
        # Running inside Snowflake Container Services (SPCS) - use local connection
        _use_local_connection = True
        
        try:
            from snowflake.snowpark import Session
            
            with open(token_file_path, "r") as f:
                token = f.read().strip()
            
            # CRITICAL: Do NOT include 'account' here when running inside SPCS.
            # The 'host' parameter routes traffic internally through Snowflake's secure boundary.
            connection_params = {
                "host": os.getenv("SNOWFLAKE_HOST"),
                "authenticator": "oauth",
                "token": token,
                "warehouse": "my_basic_wh",
                "database": "my_dashboard_db",
                "schema": "public"
            }
            
            _session = Session.builder.configs(connection_params).create()
            print("Successfully connected to Snowpark via SPCS internal route!")
            
        except Exception as e:
            print(f"Failed to create Snowpark session: {e}")
            # Fallback: flag that we are local but session creation failed
            _session = None
            
    else:
        # Local development (External to Snowflake)
        from snowflake.snowpark import Session
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.backends import default_backend
        
        private_key_path = os.getenv("SNOWFLAKE_PRIVATE_KEY_PATH")
        
        if private_key_path and os.path.exists(private_key_path):
            # 1. Key-Pair Authentication
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
                "account": os.getenv("SNOWFLAKE_ACCOUNT", "ADAGLOBAL-JCB"),
                "user": os.getenv("SNOWFLAKE_USER"),
                "private_key": pkb,
                "warehouse": "my_basic_wh",
                "database": "my_dashboard_db",
                "schema": "public"
            }
        else:
            # 2. Password / Browser / MFA Authentication
            authenticator = os.getenv("SNOWFLAKE_AUTHENTICATOR", "snowflake")
            connection_params = {
                "account": os.getenv("SNOWFLAKE_ACCOUNT", "ADAGLOBAL-JCB"),
                "user": os.getenv("SNOWFLAKE_USER"),
                "warehouse": "my_basic_wh",
                "database": "my_dashboard_db",
                "schema": "public",
                "authenticator": authenticator
            }
            
            # Support both standard password auth and the MFA caching auth
            if authenticator in ["snowflake", "username_password_mfa"]:
                connection_params["password"] = os.getenv("SNOWFLAKE_PASSWORD")
                if os.getenv("SNOWFLAKE_PASSCODE"):
                    connection_params["passcode"] = os.getenv("SNOWFLAKE_PASSCODE")
        
        _session = Session.builder.configs(connection_params).create()
        print("Successfully connected to Snowpark externally!")

@contextmanager
def get_snowflake_connection():
    global _session
    
    # Check if running in Snowflake service without session
    if _use_local_connection and _session is None:
        raise HTTPException(
            status_code=503,
            detail="Database connection not available in Snowflake service. SPCS Internal connection failed."
        )
    
    try:
        if _session is None:
            print("Initializing Snowflake session...")
            init_connection_pool()
            
        yield _session
        
    except Exception as e:
        print(f"Database query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))