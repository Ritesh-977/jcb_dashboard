import sys
import os
from dotenv import load_dotenv

load_dotenv('.env')

sys.path.insert(0, os.path.abspath('.'))
from app.db import get_snowflake_connection

try:
    with get_snowflake_connection() as conn:
        cursor = conn.cursor()
        
        # 1. Map post_id on comments based on closest publish_date
        cursor.execute("""
            UPDATE comments c
            SET post_id = p.id
            FROM (
                SELECT c.id as cid,
                       (SELECT p.id 
                        FROM posts p 
                        WHERE UPPER(p.platform) = UPPER(c.platform)
                        ORDER BY ABS(DATEDIFF(day, p.publish_date, c.comment_date)), p.id
                        LIMIT 1) as best_post_id
                FROM comments c
            ) mapping
            WHERE c.id = mapping.cid
        """)
        print("Updated post_id on comments:", cursor.rowcount)
        
        # 2. Reset counts
        cursor.execute("UPDATE posts SET comments_count = 0, total_engagement = COALESCE(likes,0) + COALESCE(shares,0)")
        
        # 3. Update posts with aggregate comments counts
        cursor.execute("""
            UPDATE posts p
            SET comments_count = c.cnt,
                total_engagement = COALESCE(p.likes,0) + c.cnt + COALESCE(p.shares,0)
            FROM (
                SELECT post_id, COUNT(*) as cnt
                FROM comments
                WHERE post_id IS NOT NULL
                GROUP BY post_id
            ) c
            WHERE p.id = c.post_id
        """)
        print("Updated comments_count on posts:", cursor.rowcount)
        
        # Verify
        cursor.execute("SELECT SUM(comments_count) FROM posts")
        total_p = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(post_id) FROM comments WHERE post_id IS NOT NULL")
        total_c = cursor.fetchone()[0]
        print(f"Final check: posts sum={total_p}, comments linked={total_c}")
        
        conn.commit()
except Exception as e:
    print(e)
