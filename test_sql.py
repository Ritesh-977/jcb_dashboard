import sys
import os

# Add backend to path so we can import app.db
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.db import get_snowflake_connection

def test_query():
    try:
        with get_snowflake_connection() as conn:
            cursor = conn.cursor()
            market_code = 'PH'
            
            # The query that might be failing
            sql = """
            UPDATE comments c
            SET post_id = best.post_id
            FROM (
                SELECT 
                    c.id AS comment_id,
                    p.id AS post_id
                FROM comments c
                JOIN posts p 
                  ON p.market_code = c.market_code 
                  AND UPPER(NVL(p.platform, '')) = UPPER(NVL(c.platform, ''))
                  AND p.platform IS NOT NULL AND p.platform != ''
                WHERE c.post_id IS NULL 
                  AND c.market_code = %s
                QUALIFY ROW_NUMBER() OVER (
                    PARTITION BY c.id 
                    ORDER BY COALESCE(ABS(DATEDIFF(day, c.comment_date, p.publish_date)), 9999) ASC
                ) = 1
            ) best
            WHERE c.id = best.comment_id
            """
            print("Executing query...")
            cursor.execute(sql, (market_code,))
            print("Success! Rows updated:", cursor.rowcount)
    except Exception as e:
        print("ERROR:", str(e))

if __name__ == "__main__":
    test_query()
