import snowflake.connector
import os

try:
    print("Connecting to Snowflake...")
    conn = snowflake.connector.connect(
        user='RITESH.SINGH@ADAGLOBAL.COM',
        account='ADAGLOBAL-JCB',
        authenticator='externalbrowser'
    )
    cur = conn.cursor()
    
    funcs = [
        "SELECT SYSTEM$GET_REGISTRY_OAUTH_TOKEN()",
        "SELECT SYSTEM$REGISTRY_OAUTH_TOKEN()"
    ]
    
    for f in funcs:
        try:
            print(f"Trying: {f}")
            cur.execute(f)
            res = cur.fetchone()
            print(f"SUCCESS with {f}!")
            print(f"Token: {res[0]}")
            break
        except Exception as e:
            print(f"Failed {f}: {str(e)}")
            
except Exception as e:
    print(f"Connection failed: {str(e)}")
