"""
Cleanup script: Deduplicate the `comments` table in Snowflake.

Removes duplicate rows (same comment_text + comment_date + platform + market_code)
and keeps only one copy of each unique comment.

Usage:
    python cleanup_comments.py              # deduplicate only
    python cleanup_comments.py --truncate   # remove ALL comments (start fresh)
"""
import os
import sys
import snowflake.connector
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding="utf-8")
load_dotenv()


def get_connection():
    return snowflake.connector.connect(
        host=os.getenv("SNOWFLAKE_HOST"),
        port=int(os.getenv("SNOWFLAKE_PORT", 443)),
        account=os.getenv("SNOWFLAKE_ACCOUNT"),
        user=os.getenv("SNOWFLAKE_USER"),
        password=os.getenv("SNOWFLAKE_PASSWORD"),
        warehouse="my_basic_wh",
        database="my_dashboard",
        schema="public",
    )


def main():
    truncate = "--truncate" in sys.argv
    conn = get_connection()
    cur = conn.cursor()

    # Show current count
    cur.execute("SELECT COUNT(*) FROM comments")
    before = cur.fetchone()[0]
    print(f"Comments BEFORE cleanup: {before} rows")

    if truncate:
        # ── Full truncate — start with an empty table ──
        cur.execute("TRUNCATE TABLE comments")
        conn.commit()
        print("✓ comments table truncated (all rows removed)")
    else:
        # ── Dedup: keep one row per unique (comment_text, comment_date, platform, market_code) ──
        # Strategy: copy unique rows to a temp table, truncate original, re-insert.
        print("Deduplicating...")

        cur.execute("""
            CREATE OR REPLACE TEMPORARY TABLE comments_deduped AS
            SELECT *
            FROM (
                SELECT *,
                       ROW_NUMBER() OVER (
                           PARTITION BY comment_text, comment_date, platform, market_code
                           ORDER BY created_at ASC
                       ) AS rn
                FROM comments
            )
            WHERE rn = 1
        """)

        cur.execute("SELECT COUNT(*) FROM comments_deduped")
        unique_count = cur.fetchone()[0]
        duplicates = before - unique_count
        print(f"  Found {unique_count} unique comments, {duplicates} duplicates")

        cur.execute("TRUNCATE TABLE comments")

        cur.execute("""
            INSERT INTO comments (
                id, post_id, market_code, comment_date, platform,
                comment_text, sentiment, keyword_tag, keyword_type, created_at
            )
            SELECT id, post_id, market_code, comment_date, platform,
                   comment_text, sentiment, keyword_tag, keyword_type, created_at
            FROM comments_deduped
        """)
        conn.commit()
        print(f"✓ Removed {duplicates} duplicate rows")

    # Show final count
    cur.execute("SELECT COUNT(*) FROM comments")
    after = cur.fetchone()[0]
    print(f"Comments AFTER cleanup: {after} rows")

    conn.close()


if __name__ == "__main__":
    main()
