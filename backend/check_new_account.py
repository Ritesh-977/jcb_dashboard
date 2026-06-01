import os
import snowflake.connector
from dotenv import load_dotenv
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

load_dotenv()

def get_new_connection():
    """Connect to NEW account using key-pair authentication"""
    private_key_path = os.getenv("SNOWFLAKE_PRIVATE_KEY_PATH")
    
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
    
    return snowflake.connector.connect(
        account=os.getenv("SNOWFLAKE_ACCOUNT"),
        user=os.getenv("SNOWFLAKE_USER"),
        private_key=pkb,
        warehouse="my_basic_wh"
    )

print("=== Checking NEW Snowflake Account ===\n")

try:
    conn = get_new_connection()
    cursor = conn.cursor()
    
    # Show databases
    print("DATABASES:")
    cursor.execute("SHOW DATABASES")
    for db in cursor.fetchall():
        print(f"  - {db[1]}")
    
    # Try to use the target database
    try:
        cursor.execute("USE DATABASE my_dashboard_db")
        cursor.execute("USE SCHEMA public")
        
        print("\nTABLES in my_dashboard_db.public:")
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        if tables:
            for table in tables:
                table_name = table[1]
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                count = cursor.fetchone()[0]
                print(f"  - {table_name}: {count} rows")
        else:
            print("  (No tables found)")
    except Exception as e:
        print(f"\nDatabase my_dashboard_db not found or empty: {e}")
    
    cursor.close()
    conn.close()
    
    print("\nConnection successful!")
    
except Exception as e:
    print(f"Connection failed: {e}")
    import traceback
    traceback.print_exc()
