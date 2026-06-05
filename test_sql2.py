import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
import snowflake.connector

def get_conn():
    # Load from .env manually to avoid depending on FastAPI
    from dotenv import load_dotenv
    load_dotenv(os.path.join('backend', '.env'))
    return snowflake.connector.connect(
        user=os.getenv('SNOWFLAKE_USER'),
        password=os.getenv('SNOWFLAKE_PASSWORD'),
        account=os.getenv('SNOWFLAKE_ACCOUNT'),
        warehouse=os.getenv('SNOWFLAKE_WAREHOUSE'),
        database=os.getenv('SNOWFLAKE_DATABASE'),
        schema=os.getenv('SNOWFLAKE_SCHEMA'),
        role=os.getenv('SNOWFLAKE_ROLE')
    )

def test_query():
    try:
        conn = get_conn()
        cursor = conn.cursor()
        market_code = 'PH'
        
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
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_query()
