"""
Run once to seed the admin user:
    python seed.py
"""
import asyncio
import os
from dotenv import load_dotenv
from passlib.context import CryptContext
from app.db import get_pool, close_pool

load_dotenv()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ADMIN_EMAIL = "admin@jcb.com"
ADMIN_PASSWORD = "admin123"
ADMIN_ROLE = "admin"


async def seed():
    pool = await get_pool()
    hashed = pwd_context.hash(ADMIN_PASSWORD)
    await pool.execute(
        """
        INSERT INTO users (email, password_hash, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (email) DO NOTHING
        """,
        ADMIN_EMAIL, hashed, ADMIN_ROLE,
    )
    print(f"Admin user '{ADMIN_EMAIL}' seeded successfully.")
    await close_pool()


if __name__ == "__main__":
    asyncio.run(seed())
