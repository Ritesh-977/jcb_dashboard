import sys
import os
from dotenv import load_dotenv

load_dotenv('.env')

sys.path.insert(0, os.path.abspath('.'))
from app.db import get_snowflake_connection

try:
    with get_snowflake_connection() as conn:
        cursor = conn.cursor()
        
        # Check current values before update
        cursor.execute("SELECT SUM(comments_count) FROM posts")
        print("Before update, total comments_count in POSTS:", cursor.fetchone()[0])
        
        # Update query
        update_query = """
        UPDATE posts p
        SET comments_count = c.cnt,
            total_engagement = p.likes + c.cnt + p.shares
        FROM (
            SELECT post_id, COUNT(*) as cnt
            FROM comments
            WHERE post_id IS NOT NULL
            GROUP BY post_id
        ) c
        WHERE p.id = c.post_id
        """
        cursor.execute(update_query)
        print(f"Updated {cursor.rowcount} posts with new comments_count and total_engagement.")
        
        # Check values after update
        cursor.execute("SELECT SUM(comments_count) FROM posts")
        print("After update, total comments_count in POSTS:", cursor.fetchone()[0])
        
        conn.commit()
except Exception as e:
    print(e)
