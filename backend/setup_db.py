"""
Run once to create the users table and seed the admin user:
    python setup_db.py
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ADMIN_EMAIL = "admin@jcb.com"
ADMIN_PASSWORD = "admin123"
ADMIN_ROLE = "admin"


async def setup():
    conn = await asyncpg.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 5432)),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
    )

    # Create users table
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id            SERIAL PRIMARY KEY,
            email         VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role          VARCHAR(50) NOT NULL DEFAULT 'admin',
            created_at    TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    print("✓ users table ready")

    # Seed admin user
    hashed = pwd_context.hash(ADMIN_PASSWORD)
    await conn.execute(
        """
        INSERT INTO users (email, password_hash, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (email) DO NOTHING
        """,
        ADMIN_EMAIL, hashed, ADMIN_ROLE,
    )
    print(f"✓ Admin user '{ADMIN_EMAIL}' seeded")

    await conn.close()


if __name__ == "__main__":
    asyncio.run(setup())
