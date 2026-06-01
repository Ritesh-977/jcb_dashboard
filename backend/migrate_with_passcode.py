import os
import snowflake.connector
from dotenv import load_dotenv

load_dotenv()

print("=== Snowflake Account Migration ===\n")

# OLD ACCOUNT CREDENTIALS
print("Enter OLD Snowflake account details:")
OLD_ACCOUNT = input("Account (e.g., EYSPZTO-YZ14021): ").strip()
OLD_USER = input("Username: ").strip()
OLD_PASSWORD = input("Password: ").strip()
OLD_WAREHOUSE = input("Warehouse (default: my_basic_wh): ").strip() or "my_basic_wh"
OLD_DATABASE = input("Database (default: my_dashboard): ").strip() or "my_dashboard"

# NEW ACCOUNT (from .env)
NEW_ACCOUNT = os.getenv("SNOWFLAKE_ACCOUNT")
NEW_USER = os.getenv("SNOWFLAKE_USER")
NEW_PASSWORD = os.getenv("SNOWFLAKE_PASSWORD")
NEW_PASSCODE = input(f"\nEnter NEW account MFA passcode for {NEW_USER}: ").strip()
NEW_WAREHOUSE = "my_basic_wh"
NEW_DATABASE = "my_dashboard_db"

def get_old_connection():
    return snowflake.connector.connect(
        account=OLD_ACCOUNT,
        user=OLD_USER,
        password=OLD_PASSWORD,
        warehouse=OLD_WAREHOUSE,
        database=OLD_DATABASE
    )

def get_new_connection():
    return snowflake.connector.connect(
        account=NEW_ACCOUNT,
        user=NEW_USER,
        password=NEW_PASSWORD,
        passcode=NEW_PASSCODE,
        warehouse=NEW_WAREHOUSE
    )

def export_data(old_conn):
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
            
            cursor.execute(f"SHOW COLUMNS IN TABLE {table}")
            col_info = cursor.fetchall()
            
            data[table] = {
                "columns": columns,
                "rows": rows,
                "schema": col_info
            }
            print(f"  Exported {len(rows)} rows from {table}")
        except Exception as e:
            print(f"  Error exporting {table}: {e}")
    
    cursor.close()
    return data

def create_database(new_conn):
    cursor = new_conn.cursor()
    try:
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {NEW_DATABASE}")
        cursor.execute(f"USE DATABASE {NEW_DATABASE}")
        cursor.execute("CREATE SCHEMA IF NOT EXISTS public")
        print(f"  Created database: {NEW_DATABASE}")
    except Exception as e:
        print(f"  Database setup: {e}")
    cursor.close()

def create_tables(new_conn, data):
    cursor = new_conn.cursor()
    cursor.execute(f"USE DATABASE {NEW_DATABASE}")
    cursor.execute("USE SCHEMA public")
    
    for table_name, table_data in data.items():
        col_defs = []
        for col in table_data["schema"]:
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

# MAIN MIGRATION
try:
    print("\n[1/5] Connecting to OLD account...")
    old_conn = get_old_connection()
    print("  Connected!")
    
    print("\n[2/5] Exporting data from OLD account...")
    data = export_data(old_conn)
    old_conn.close()
    
    print("\n[3/5] Connecting to NEW account...")
    new_conn = get_new_connection()
    print("  Connected!")
    
    print("\n[4/5] Creating database and tables in NEW account...")
    create_database(new_conn)
    create_tables(new_conn, data)
    
    print("\n[5/5] Importing data to NEW account...")
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
