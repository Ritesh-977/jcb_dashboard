import os
import snowflake.connector
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def fix_users_table():
    conn = snowflake.connector.connect(
        account=os.getenv("SNOWFLAKE_ACCOUNT"),
        user=os.getenv("SNOWFLAKE_USER"),
        password=os.getenv("SNOWFLAKE_PASSWORD"),
        warehouse="my_basic_wh",
        database="my_dashboard_db",
        schema="public"
    )
    
    cursor = conn.cursor()
    
    # Drop existing table
    cursor.execute("DROP TABLE IF EXISTS users")
    print("✓ Dropped old users table")
    
    # Create users table with all columns
    cursor.execute("""
        CREATE TABLE users (
            id INT AUTOINCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'admin',
            permissions TEXT DEFAULT '[]',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
        )
    """)
    print("✓ Created users table with all columns")
    
    # Hash password and insert admin
    hashed = pwd_context.hash("admin123")
    cursor.execute("""
        INSERT INTO users (email, password_hash, role, permissions, is_active)
        VALUES (%s, %s, %s, %s, %s)
    """, ("admin@jcb.com", hashed, "admin", '["view_kpi", "view_sentiment", "view_comments", "view_trend"]', True))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print("✓ Created admin user: admin@jcb.com / admin123 with all permissions")

if __name__ == "__main__":
    fix_users_table()
