"""
Run to check existing tables and create any missing ones:
    python create_tables.py
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
        ssl="require",
        statement_cache_size=0,
    )

    # Show existing tables
    rows = await conn.fetch("""
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    """)
    print("Existing tables:", [r['tablename'] for r in rows])

    # Create users if missing
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'viewer'
        )
    """)
    print("✓ users ready")

    # Create kpi_summary if missing
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS kpi_summary (
            "Metric" VARCHAR(100) NOT NULL,
            "Value"  DOUBLE PRECISION NOT NULL
        )
    """)
    print("✓ kpi_summary ready")

    # Create overall_sentiment if missing
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS overall_sentiment (
            "Platform"    VARCHAR(50) NOT NULL,
            "Positive"    INTEGER NOT NULL DEFAULT 0,
            "Neutral"     INTEGER NOT NULL DEFAULT 0,
            "Negative"    INTEGER NOT NULL DEFAULT 0,
            "Total"       INTEGER NOT NULL DEFAULT 0,
            "% Positive"  DOUBLE PRECISION NOT NULL DEFAULT 0,
            "% Neutral"   DOUBLE PRECISION NOT NULL DEFAULT 0,
            "% Negative"  DOUBLE PRECISION NOT NULL DEFAULT 0
        )
    """)
    print("✓ overall_sentiment ready")

    # Create post_data if missing
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS post_data (
            "Date"             DATE NOT NULL,
            "Campaign Name"    VARCHAR(255),
            "Market"           VARCHAR(10),
            "Platform"         VARCHAR(50),
            "Source"           JSONB,
            "Post Content"     TEXT,
            "Post Link"        VARCHAR(255),
            "Likes"            INTEGER DEFAULT 0,
            "Comments Count"   INTEGER DEFAULT 0,
            "Shares"           INTEGER DEFAULT 0,
            "Total Engagement" INTEGER DEFAULT 0,
            "Post Sentiment"   VARCHAR(50)
        )
    """)
    print("✓ post_data ready")

    # Create comment_data if missing
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS comment_data (
            "Date"         DATE NOT NULL,
            "Platform"     VARCHAR(50),
            "Post Link"    VARCHAR(255),
            "Comment Text" TEXT,
            "Sentiment"    VARCHAR(50),
            "Keyword Tag"  VARCHAR(100),
            "Keyword Type" VARCHAR(50)
        )
    """)
    print("✓ comment_data ready")

    # Show final table list
    rows = await conn.fetch("""
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    """)
    print("\nAll tables now:", [r['tablename'] for r in rows])

    await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
