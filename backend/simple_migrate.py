import os
import snowflake.connector
from dotenv import load_dotenv

load_dotenv()

print("=== Snowflake Migration: OLD -> NEW Account ===\n")

# OLD ACCOUNT (password only)
OLD_ACCOUNT = input("OLD Account (e.g., EYSPZTO-YZ14021): ").strip()
OLD_USER = input("OLD Username: ").strip()
OLD_PASSWORD = input("OLD Password: ").strip()
OLD_DATABASE = input("OLD Database (default: my_dashboard): ").strip() or "my_dashboard"

# NEW ACCOUNT (password + passcode)
NEW_ACCOUNT = os.getenv("SNOWFLAKE_ACCOUNT")
NEW_USER = os.getenv("SNOWFLAKE_USER")
NEW_PASSWORD = os.getenv("SNOWFLAKE_PASSWORD")
NEW_PASSCODE = input(f"\nNEW Account MFA Passcode: ").strip()
NEW_DATABASE = "my_dashboard_db"

def connect_old():
    return snowflake.connector.connect(
        account=OLD_ACCOUNT,
        user=OLD_USER,
        password=OLD_PASSWORD,
        database=OLD_DATABASE
    )

def connect_new():
    return snowflake.connector.connect(
        account=NEW_ACCOUNT,
        user=NEW_USER,
        password=NEW_PASSWORD,
        passcode=NEW_PASSCODE
    )

def get_tables(conn, database):
    cursor = conn.cursor()
    cursor.execute(f"USE DATABASE {database}")
    cursor.execute("SHOW TABLES")
    return [t[1] for t in cursor.fetchall()]

def export_table(conn, database, table):
    cursor = conn.cursor()
    cursor.execute(f"USE DATABASE {database}")
    
    # Get CREATE TABLE statement
    cursor.execute(f"SELECT GET_DDL('TABLE', '{table}')")
    ddl = cursor.fetchone()[0]
    
    # Get data
    cursor.execute(f"SELECT * FROM {table}")
    rows = cursor.fetchall()
    columns = [desc[0] for desc in cursor.description]
    
    cursor.close()
    return {"ddl": ddl, "columns": columns, "rows": rows}

def create_table(conn, database, table_name, ddl):
    cursor = conn.cursor()
    cursor.execute(f"USE DATABASE {database}")
    cursor.execute("USE SCHEMA public")
    
    # Replace old database name with new one in DDL
    ddl = ddl.replace(OLD_DATABASE, NEW_DATABASE)
    
    cursor.execute(ddl)
    cursor.close()

def insert_data(conn, database, table_name, columns, rows):
    if not rows:
        return
    
    cursor = conn.cursor()
    cursor.execute("USE WAREHOUSE my_basic_wh")
    cursor.execute(f"USE DATABASE {database}")
    cursor.execute("USE SCHEMA public")
    
    placeholders = ", ".join(["%s"] * len(columns))
    insert_sql = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"
    cursor.executemany(insert_sql, rows)
    cursor.close()

# MIGRATION
try:
    print("\n[1/6] Connecting to OLD account...")
    old_conn = connect_old()
    print("  ✓ Connected")
    
    print("\n[2/6] Getting tables from OLD account...")
    tables = get_tables(old_conn, OLD_DATABASE)
    print(f"  Found {len(tables)} tables: {', '.join(tables)}")
    
    print("\n[3/6] Exporting data from OLD account...")
    exported = {}
    for table in tables:
        data = export_table(old_conn, OLD_DATABASE, table)
        exported[table] = data
        print(f"  ✓ {table}: {len(data['rows'])} rows")
    old_conn.close()
    
    print("\n[4/6] Connecting to NEW account...")
    new_conn = connect_new()
    cursor = new_conn.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {NEW_DATABASE}")
    cursor.execute(f"USE DATABASE {NEW_DATABASE}")
    cursor.execute("CREATE SCHEMA IF NOT EXISTS public")
    cursor.close()
    print("  ✓ Connected and database ready")
    
    print("\n[5/6] Creating tables in NEW account...")
    for table, data in exported.items():
        create_table(new_conn, NEW_DATABASE, table, data["ddl"])
        print(f"  ✓ Created {table}")
    
    print("\n[6/6] Importing data to NEW account...")
    for table, data in exported.items():
        insert_data(new_conn, NEW_DATABASE, table, data["columns"], data["rows"])
        print(f"  ✓ Imported {len(data['rows'])} rows to {table}")
    
    new_conn.commit()
    new_conn.close()
    
    print("\n" + "="*60)
    print("✓ MIGRATION COMPLETE!")
    print("="*60)
    print(f"Database: {NEW_DATABASE}")
    print(f"Account: {NEW_ACCOUNT}")
    
except Exception as e:
    print(f"\n✗ MIGRATION FAILED: {e}")
    import traceback
    traceback.print_exc()
