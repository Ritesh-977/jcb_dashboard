"""
Run to diagnose DB connection and list all tables:
    python check_db.py
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def main():
    conn = await asyncpg.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 5432)),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
    )

    db_name = await conn.fetchval("SELECT current_database()")
    print(f"Connected to database: {db_name}")

    rows = await conn.fetch("""
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    """)
    print(f"Tables in public schema: {[r['tablename'] for r in rows]}")

    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
