import os
import snowflake.connector
from fastapi import HTTPException

def get_snowflake_connection():
    """
    Creates a connection to the Snowflake database using the internal 
    security tokens provided automatically by Snowpark Container Services.
    """
    # 1. Path to the automatically injected security token inside the container
    token_file_path = "/snowflake/session/token"
    
    # 2. Safety check: Are we actually running inside Snowflake?
    if not os.path.exists(token_file_path):
        # Fallback for local development (you can add your .env variables here later)
        raise HTTPException(status_code=500, detail="Snowflake token not found. Not running in SPCS.")

    # 3. Read the security token
    with open(token_file_path, "r") as f:
        token = f.read().strip()

    # 4. Connect using environment variables automatically provided by SPCS
    try:
        conn = snowflake.connector.connect(
            host=os.getenv("SNOWFLAKE_HOST"),
            port=os.getenv("SNOWFLAKE_PORT"),
            account=os.getenv("SNOWFLAKE_ACCOUNT"),
            authenticator="oauth",
            token=token,
            # Optionally specify the warehouse you created earlier
            warehouse="my_basic_wh",
            database="my_dashboard",
            schema="public"
        )
        return conn
    except Exception as e:
        print(f"Database connection failed: {e}")
        raise HTTPException(status_code=500, detail="Could not connect to Snowflake.")