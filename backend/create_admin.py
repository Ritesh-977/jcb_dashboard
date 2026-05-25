import os
import snowflake.connector
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin():
    conn = snowflake.connector.connect(
        account=os.getenv("SNOWFLAKE_ACCOUNT"),
        user=os.getenv("SNOWFLAKE_USER"),
        password=os.getenv("SNOWFLAKE_PASSWORD"),
        warehouse="my_basic_wh",
        database="my_dashboard_db",
        schema="public"
    )
    
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTOINCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'admin',
            permissions TEXT DEFAULT '[]',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
        )
    """)
    print("✓ Created users table")
    
    # Hash password
    hashed = pwd_context.hash("admin123")
    
    # Insert admin user
    cursor.execute("""
        INSERT INTO users (email, password_hash, role)
        VALUES (%s, %s, %s)
    """, ("admin@jcb.com", hashed, "admin"))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print("✓ Created admin user: admin@jcb.com / admin123")

if __name__ == "__main__":
    create_admin()
