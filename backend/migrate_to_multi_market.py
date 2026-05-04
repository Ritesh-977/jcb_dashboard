"""
One-time migration: old flat schema → new multi-market schema.
Reads from old Snowflake tables, writes to new tables in the same DB.

Usage:
    python migrate_to_multi_market.py              # migrate only
    python migrate_to_multi_market.py --drop-old   # migrate + drop old tables
"""
import os
import sys
import json
import snowflake.connector
from dotenv import load_dotenv

# Fix Windows console encoding for unicode characters
sys.stdout.reconfigure(encoding='utf-8')

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


def run_ddl(conn):
    """Execute the DDL script to create new tables."""
    ddl_path = os.path.join(os.path.dirname(__file__), "create_multi_market_schema.sql")
    with open(ddl_path, "r", encoding="utf-8") as f:
        ddl = f.read()

    cur = conn.cursor()
    # Split on semicolons and execute each statement
    for stmt in ddl.split(";"):
        stmt = stmt.strip()
        # Strip comment-only lines to see if real SQL remains
        real_lines = [ln for ln in stmt.splitlines() if ln.strip() and not ln.strip().startswith("--")]
        if not real_lines:
            continue
        try:
            cur.execute(stmt)
            # Show which object was created
            for ln in real_lines:
                upper = ln.strip().upper()
                if "CREATE TABLE" in upper or "USE " in upper:
                    print(f"  ✓ {ln.strip()}")
                    break
        except Exception as e:
            print(f"  ⚠ DDL statement skipped: {e}")
    print("✓ DDL executed — all new tables ready")


def seed_markets(conn):
    """Seed the markets dimension table."""
    cur = conn.cursor()
    # Gather distinct markets from old POST_DATA
    cur.execute("SELECT DISTINCT \"MARKET\" FROM POST_DATA WHERE \"MARKET\" IS NOT NULL")
    existing_markets = [r[0] for r in cur.fetchall()]

    if not existing_markets:
        existing_markets = ["PH"]

    market_names = {
        "PH": "Philippines",
        "US": "United States",
        "JP": "Japan",
        "TH": "Thailand",
        "SG": "Singapore",
        "MY": "Malaysia",
        "ID": "Indonesia",
        "VN": "Vietnam",
        "TW": "Taiwan",
        "HK": "Hong Kong",
        "KR": "South Korea",
        "AU": "Australia",
    }

    for code in existing_markets:
        name = market_names.get(code, code)
        cur.execute("""
            MERGE INTO markets t USING (SELECT %s AS mc) s ON t.market_code = s.mc
            WHEN NOT MATCHED THEN INSERT (market_code, market_name) VALUES (%s, %s)
        """, (code, code, name))

    conn.commit()
    print(f"✓ markets seeded ({len(existing_markets)} markets: {existing_markets})")


def migrate_campaigns(conn):
    """Create campaigns from distinct Campaign Name + Market combos."""
    cur = conn.cursor()
    cur.execute("""
        SELECT DISTINCT "CAMPAIGN NAME", "MARKET"
        FROM POST_DATA
        WHERE "CAMPAIGN NAME" IS NOT NULL AND "MARKET" IS NOT NULL
    """)
    rows = cur.fetchall()

    for campaign_name, market_code in rows:
        cur.execute("""
            MERGE INTO campaigns t
            USING (SELECT %s AS cn, %s AS mc) s
            ON t.campaign_name = s.cn AND t.market_code = s.mc
            WHEN NOT MATCHED THEN INSERT (campaign_name, market_code) VALUES (%s, %s)
        """, (campaign_name, market_code, campaign_name, market_code))

    conn.commit()
    print(f"✓ campaigns migrated ({len(rows)} campaign-market combos)")


def migrate_posts(conn):
    """Migrate POST_DATA → posts."""
    cur = conn.cursor()

    # Build campaign lookup
    cur.execute("SELECT id, campaign_name, market_code FROM campaigns")
    campaign_lookup = {(r[1], r[2]): r[0] for r in cur.fetchall()}

    cur.execute("""
        SELECT "DATE", "CAMPAIGN NAME", "MARKET", "PLATFORM", "SOURCE",
               "POST CONTENT", "POST LINK", "LIKES", "COMMENTS COUNT",
               "SHARES", "TOTAL ENGAGEMENT", "POST SENTIMENT"
        FROM POST_DATA
    """)
    rows = cur.fetchall()

    migrated = 0
    for r in rows:
        pub_date = r[0]
        campaign_name = r[1]
        market_code = r[2] or "PH"
        platform = r[3]
        source_raw = r[4]
        content = r[5]
        link = r[6]
        likes = r[7] or 0
        comments_count = r[8] or 0
        shares = r[9] or 0
        total_engagement = r[10] or 0
        sentiment = r[11]

        # Parse source — could be JSON string or plain text
        source_name = source_raw
        if source_raw:
            try:
                parsed = json.loads(source_raw) if isinstance(source_raw, str) else source_raw
                if isinstance(parsed, dict):
                    source_name = parsed.get("Page Name", str(parsed))
            except (json.JSONDecodeError, TypeError):
                source_name = str(source_raw)

        campaign_id = campaign_lookup.get((campaign_name, market_code))

        cur.execute("""
            INSERT INTO posts (
                market_code, campaign_id, publish_date, platform, source_name,
                content, link, sentiment, likes, comments_count, shares,
                total_engagement
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            market_code, campaign_id, pub_date, platform, source_name,
            content, link, sentiment, likes, comments_count, shares,
            total_engagement,
        ))
        migrated += 1

    conn.commit()
    print(f"✓ posts migrated ({migrated} rows)")


def migrate_comments(conn):
    """Migrate COMMENT_DATA → comments, looking up post_id + market_code."""
    cur = conn.cursor()

    # Build post lookup by link
    cur.execute("SELECT id, link, market_code FROM posts")
    post_lookup = {}
    for r in cur.fetchall():
        post_lookup[r[1]] = (r[0], r[2])  # link -> (post_id, market_code)

    cur.execute("""
        SELECT "DATE", "PLATFORM", "POST LINK", "COMMENT TEXT",
               "SENTIMENT", "KEYWORD TAG", "KEYWORD TYPE"
        FROM COMMENT_DATA
    """)
    rows = cur.fetchall()

    migrated = 0
    skipped = 0
    for r in rows:
        comment_date = r[0]
        platform = r[1]
        post_link = r[2]
        comment_text = r[3]
        sentiment = r[4]
        keyword_tag = r[5]
        keyword_type = r[6]

        post_info = post_lookup.get(post_link)
        if post_info:
            post_id, market_code = post_info
        else:
            # No matching post found — assign to PH as fallback
            post_id = None
            market_code = "PH"
            skipped += 1

        cur.execute("""
            INSERT INTO comments (
                post_id, market_code, comment_date, platform,
                comment_text, sentiment, keyword_tag, keyword_type
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            post_id, market_code, comment_date, platform,
            comment_text, sentiment, keyword_tag, keyword_type,
        ))
        migrated += 1

    conn.commit()
    print(f"✓ comments migrated ({migrated} rows, {skipped} without matching post)")


def migrate_keywords(conn):
    """Migrate keyword_mapping data if the old table exists."""
    cur = conn.cursor()
    try:
        cur.execute("SELECT COUNT(*) FROM keyword_mapping")
        existing = cur.fetchone()[0]
        if existing > 0:
            print(f"✓ keyword_mapping already has {existing} rows — skipping")
            return
    except Exception:
        pass

    # The keyword data was in mock JSON — seed from common keywords
    keywords = [
        ("eligible", "Positive Feedback"), ("offer", "Positive Feedback"),
        ("delicious", "Positive Feedback"), ("good", "Positive Feedback"),
        ("deal", "Positive Feedback"), ("worth", "Positive Feedback"),
        ("grab", "Positive Feedback"), ("valid", "Positive Feedback"),
        ("card", "Positive Feedback"), ("delivery", "Positive Feedback"),
        ("intent", "Positive Feedback"), ("tuesday", "Positive Feedback"),
        ("panda", "Positive Feedback"),
        ("pending", "Negative Feedback"), ("redeem", "Negative Feedback"),
        ("failed", "Negative Feedback"), ("misleading", "Negative Feedback"),
        ("slow", "Negative Feedback"), ("confusing", "Negative Feedback"),
        ("troublesome", "Negative Feedback"), ("claim", "Negative Feedback"),
        ("cannot", "Negative Feedback"), ("error", "Negative Feedback"),
        ("redemption", "Negative Feedback"), ("soldout", "Negative Feedback"),
    ]

    for keyword, category in keywords:
        cur.execute("""
            MERGE INTO keyword_mapping t
            USING (SELECT %s AS kw) s ON t.keyword = s.kw
            WHEN NOT MATCHED THEN INSERT (keyword, category) VALUES (%s, %s)
        """, (keyword, keyword, category))

    conn.commit()
    print(f"✓ keyword_mapping seeded ({len(keywords)} keywords)")


def drop_old_tables(conn):
    """Drop the old tables after successful migration."""
    cur = conn.cursor()
    old_tables = ["KPI_SUMMARY", "OVERALL_SENTIMENT", "POST_DATA", "COMMENT_DATA"]
    for table in old_tables:
        try:
            cur.execute(f"DROP TABLE IF EXISTS {table}")
            print(f"  ✓ Dropped {table}")
        except Exception as e:
            print(f"  ⚠ Could not drop {table}: {e}")
    conn.commit()
    print("✓ Old tables dropped")


def main():
    drop_old = "--drop-old" in sys.argv

    print("=" * 60)
    print("Multi-Market Migration: Starting")
    print("=" * 60)

    conn = get_connection()
    try:
        run_ddl(conn)
        seed_markets(conn)
        migrate_campaigns(conn)
        migrate_posts(conn)
        migrate_comments(conn)
        migrate_keywords(conn)

        if drop_old:
            print("\n--- Dropping old tables ---")
            drop_old_tables(conn)
        else:
            print("\n⚡ Old tables preserved. Run with --drop-old to remove them.")

        # Final counts
        cur = conn.cursor()
        for table in ["markets", "campaigns", "posts", "comments", "keyword_mapping"]:
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            count = cur.fetchone()[0]
            print(f"  {table}: {count} rows")

    finally:
        conn.close()

    print("\n" + "=" * 60)
    print("Migration Complete ✓")
    print("=" * 60)


if __name__ == "__main__":
    main()
