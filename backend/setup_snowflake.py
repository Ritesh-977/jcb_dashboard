import os
import snowflake.connector
from dotenv import load_dotenv

load_dotenv()

def setup_new_account():
    conn = snowflake.connector.connect(
        account=os.getenv("SNOWFLAKE_ACCOUNT"),
        user=os.getenv("SNOWFLAKE_USER"),
        password=os.getenv("SNOWFLAKE_PASSWORD"),
        warehouse="my_basic_wh",
        database="my_dashboard_db",
        schema="public"
    )
    
    cursor = conn.cursor()
    
    # Create tables
    with open("create_multi_market_schema.sql", "r") as f:
        schema_sql = f.read()
        schema_sql = schema_sql.replace("MY_DASHBOARD", "my_dashboard_db")
        
        for statement in schema_sql.split(";"):
            stmt = statement.strip()
            if stmt and not stmt.startswith("--") and not stmt.startswith("USE"):
                try:
                    cursor.execute(stmt)
                    conn.commit()
                    if "CREATE TABLE" in stmt:
                        table_name = stmt.split("CREATE TABLE IF NOT EXISTS")[1].split("(")[0].strip()
                        print(f"✓ Created table: {table_name}")
                except Exception as e:
                    print(f"✗ {e}")
    
    cursor.close()
    conn.close()
    print("\n✓ New Snowflake account setup complete!")

if __name__ == "__main__":
    print("=== Setting up NEW Snowflake Account ===")
    print(f"Account: {os.getenv('SNOWFLAKE_ACCOUNT')}")
    setup_new_account()
