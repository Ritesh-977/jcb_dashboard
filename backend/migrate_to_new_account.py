import os
import snowflake.connector
from dotenv import load_dotenv
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

load_dotenv()

print("=== Snowflake Account Migration ===\n")

# OLD ACCOUNT CREDENTIALS
print("Enter OLD Snowflake account details:")
OLD_ACCOUNT = input("Account (e.g., EYSPZTO-YZ14021): ").strip()
OLD_USER = input("Username: ").strip()
OLD_PASSWORD = input("Password: ").strip()
OLD_WAREHOUSE = input("Warehouse (default: my_basic_wh): ").strip() or "my_basic_wh"
OLD_DATABASE = input("Database (default: my_dashboard): ").strip() or "my_dashboard"

# NEW ACCOUNT (from .env with key-pair auth)
NEW_ACCOUNT = os.getenv("SNOWFLAKE_ACCOUNT")
NEW_USER = os.getenv("SNOWFLAKE_USER")
NEW_WAREHOUSE = "my_basic_wh"
NEW_DATABASE = "my_dashboard_db"

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
        account=NEW_ACCOUNT,
        user=NEW_USER,
        private_key=pkb,
        warehouse=NEW_WAREHOUSE
    )

def get_old_connection():
    """Connect to OLD account using password"""
    return snowflake.connector.connect(
        account=OLD_ACCOUNT,
        user=OLD_USER,
        password=OLD_PASSWORD,
        warehouse=OLD_WAREHOUSE,
        database=OLD_DATABASE
    )

def export_schema(old_conn):
    """Export table schemas from old account"""
    cursor = old_conn.cursor()
    cursor.execute(f"USE DATABASE {OLD_DATABASE}")
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    
    schemas = {}
    for table in tables:
        table_name = table[1]
        cursor.execute(f"SHOW COLUMNS IN TABLE {table_name}")
        columns = cursor.fetchall()
        schemas[table_name] = columns
        print(f"  Exported schema: {table_name}")
    
    cursor.close()
    return schemas

def export_data(old_conn):
    """Export data from all tables"""
    cursor = old_conn.cursor()
    cursor.execute(f"USE DATABASE {OLD_DATABASE}")
    cursor.execute("SHOW TABLES")
    tables = [t[1] for t in cursor.fetchall()]
    
    data = {}
    for table in tables:
        try:
            cursor.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()
            columns = [desc[0] for desc in cursor.description]
            data[table] = {"columns": columns, "rows": rows}
            print(f"  Exported {len(rows)} rows from {table}")
        except Exception as e:
            print(f"  Error exporting {table}: {e}")
            data[table] = {"columns": [], "rows": []}
    
    cursor.close()
    return data

def create_database_and_schema(new_conn):
    """Create database and schema in new account"""
    cursor = new_conn.cursor()
    try:
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {NEW_DATABASE}")
        cursor.execute(f"USE DATABASE {NEW_DATABASE}")
        cursor.execute("CREATE SCHEMA IF NOT EXISTS public")
        cursor.execute("USE SCHEMA public")
        print(f"  Created database: {NEW_DATABASE}")
    except Exception as e:
        print(f"  Database setup: {e}")
    cursor.close()

def create_tables(new_conn, schemas):
    """Create tables in new account based on old schemas"""
    cursor = new_conn.cursor()
    cursor.execute(f"USE DATABASE {NEW_DATABASE}")
    cursor.execute("USE SCHEMA public")
    
    for table_name, columns in schemas.items():
        col_defs = []
        for col in columns:
            col_name = col[2]
            col_type = col[3]
            nullable = "NULL" if col[5] == "Y" else "NOT NULL"
            col_defs.append(f"{col_name} {col_type} {nullable}")
        
        create_sql = f"CREATE TABLE IF NOT EXISTS {table_name} ({', '.join(col_defs)})"
        try:
            cursor.execute(create_sql)
            print(f"  Created table: {table_name}")
        except Exception as e:
            print(f"  Error creating {table_name}: {e}")
    
    cursor.close()

def import_data(new_conn, data):
    """Import data into new account"""
    cursor = new_conn.cursor()
    cursor.execute(f"USE DATABASE {NEW_DATABASE}")
    cursor.execute("USE SCHEMA public")
    
    for table_name, table_data in data.items():
        if not table_data["rows"]:
            continue
        
        columns = table_data["columns"]
        rows = table_data["rows"]
        
        placeholders = ", ".join(["%s"] * len(columns))
        insert_sql = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"
        
        try:
            cursor.executemany(insert_sql, rows)
            print(f"  Imported {len(rows)} rows into {table_name}")
        except Exception as e:
            print(f"  Error importing {table_name}: {e}")
    
    cursor.close()
    new_conn.commit()

# MAIN MIGRATION PROCESS
try:
    print("\n[1/6] Connecting to OLD account...")
    old_conn = get_old_connection()
    print("  Connected!")
    
    print("\n[2/6] Exporting schemas...")
    schemas = export_schema(old_conn)
    
    print("\n[3/6] Exporting data...")
    data = export_data(old_conn)
    old_conn.close()
    
    print("\n[4/6] Connecting to NEW account...")
    new_conn = get_new_connection()
    print("  Connected!")
    
    print("\n[5/6] Creating database and tables...")
    create_database_and_schema(new_conn)
    create_tables(new_conn, schemas)
    
    print("\n[6/6] Importing data...")
    import_data(new_conn, data)
    new_conn.close()
    
    print("\n" + "="*50)
    print("MIGRATION COMPLETE!")
    print("="*50)
    print(f"\nNew Database: {NEW_DATABASE}")
    print(f"New Account: {NEW_ACCOUNT}")
    
except Exception as e:
    print(f"\nMIGRATION FAILED: {e}")
    import traceback
    traceback.print_exc()
