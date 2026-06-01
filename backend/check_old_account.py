import snowflake.connector

print("=== Check OLD Snowflake Account ===\n")

OLD_ACCOUNT = input("Account: ").strip()
OLD_USER = input("Username: ").strip()
OLD_PASSWORD = input("Password: ").strip()

try:
    conn = snowflake.connector.connect(
        account=OLD_ACCOUNT,
        user=OLD_USER,
        password=OLD_PASSWORD
    )
    
    cursor = conn.cursor()
    
    print("\n--- DATABASES ---")
    cursor.execute("SHOW DATABASES")
    databases = cursor.fetchall()
    for db in databases:
        print(f"  - {db[1]}")
    
    if databases:
        db_name = input("\nEnter database name to check tables: ").strip()
        
        cursor.execute(f"USE DATABASE {db_name}")
        
        print(f"\n--- TABLES in {db_name} ---")
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
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"\nError: {e}")
