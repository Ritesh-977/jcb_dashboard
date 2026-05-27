import os
import snowflake.connector
from dotenv import load_dotenv

load_dotenv()

OLD_ACCOUNT = input("Enter OLD Snowflake account (e.g., ABC123-XY45678): ")
OLD_USER = input("Enter OLD Snowflake username: ")
OLD_PASSWORD = input("Enter OLD Snowflake password: ")

NEW_ACCOUNT = os.getenv("SNOWFLAKE_ACCOUNT")
NEW_USER = os.getenv("SNOWFLAKE_USER")
NEW_PASSWORD = os.getenv("SNOWFLAKE_PASSWORD")
NEW_AUTHENTICATOR = os.getenv("SNOWFLAKE_AUTHENTICATOR", "snowflake")

def get_connection(account, user, password, authenticator="snowflake"):
    conn_params = {
        "account": account,
        "user": user,
        "warehouse": "my_basic_wh",
        "database": "my_dashboard",
        "schema": "public",
        "authenticator": authenticator
    }
    if authenticator == "snowflake":
        conn_params["password"] = password
    return snowflake.connector.connect(**conn_params)

def export_data(old_conn):
    cursor = old_conn.cursor()
    tables = ["markets", "campaigns", "posts", "authors", "comments", "keyword_mapping", "raw_ingestion"]
    data = {}
    
    for table in tables:
        try:
            cursor.execute(f"SELECT * FROM {table}")
            data[table] = cursor.fetchall()
            columns = [desc[0] for desc in cursor.description]
            data[f"{table}_columns"] = columns
            print(f"✓ Exported {len(data[table])} rows from {table}")
        except Exception as e:
            print(f"✗ Error exporting {table}: {e}")
            data[table] = []
    
    cursor.close()
    return data

def import_data(new_conn, data):
    cursor = new_conn.cursor()
    
    # Create schema first
    with open("create_multi_market_schema.sql", "r") as f:
        schema_sql = f.read()
        for statement in schema_sql.split(";"):
            if statement.strip():
                try:
                    cursor.execute(statement)
                except Exception as e:
                    print(f"Schema creation warning: {e}")
    
    tables = ["markets", "campaigns", "posts", "authors", "comments", "keyword_mapping", "raw_ingestion"]
    
    for table in tables:
        if not data.get(table):
            continue
        
        columns = data[f"{table}_columns"]
        placeholders = ", ".join(["%s"] * len(columns))
        insert_sql = f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({placeholders})"
        
        try:
            cursor.executemany(insert_sql, data[table])
            print(f"✓ Imported {len(data[table])} rows into {table}")
        except Exception as e:
            print(f"✗ Error importing {table}: {e}")
    
    cursor.close()
    new_conn.commit()

print("=== Snowflake Migration ===")
print(f"Target: {NEW_ACCOUNT}")

old_conn = get_connection(OLD_ACCOUNT, OLD_USER, OLD_PASSWORD)
print("✓ Connected to OLD account")

data = export_data(old_conn)
old_conn.close()

new_conn = get_connection(NEW_ACCOUNT, NEW_USER, NEW_PASSWORD, NEW_AUTHENTICATOR)
print("✓ Connected to NEW account")

import_data(new_conn, data)
new_conn.close()

print("\n✓ Migration complete!")
