import sys
import os
from dotenv import load_dotenv

load_dotenv('.env')

sys.path.insert(0, os.path.abspath('.'))
from app.db import get_snowflake_connection

try:
    with get_snowflake_connection() as conn:
        cursor = conn.cursor()
        
        # 1. Select the best post_id for each comment
        cursor.execute("""
            SELECT c.id,
                   (SELECT p.id 
                    FROM posts p 
                    WHERE UPPER(p.platform) = UPPER(c.platform)
                    ORDER BY ABS(DATEDIFF(day, p.publish_date, c.comment_date)), p.id
                    LIMIT 1)
            FROM comments c
        """)
        mappings = cursor.fetchall()
        
        # 2. Update comments
        cursor.executemany("UPDATE comments SET post_id = %s WHERE id = %s", [(m[1], m[0]) for m in mappings])
        print("Updated comments:", cursor.rowcount)
        
        # 3. Reset counts
        cursor.execute("UPDATE posts SET comments_count = 0, total_engagement = COALESCE(likes,0) + COALESCE(shares,0)")
        
        # 4. Update posts with aggregate comments counts using MERGE
        cursor.execute("""
            MERGE INTO posts p
            USING (
                SELECT post_id, COUNT(*) as cnt
                FROM comments
                WHERE post_id IS NOT NULL
                GROUP BY post_id
            ) c
            ON p.id = c.post_id
            WHEN MATCHED THEN
                UPDATE SET p.comments_count = c.cnt,
                           p.total_engagement = COALESCE(p.likes,0) + c.cnt + COALESCE(p.shares,0)
        """)
        print("Updated posts:", cursor.rowcount)
        
        # Verify
        cursor.execute("SELECT SUM(comments_count) FROM posts")
        total_p = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(post_id) FROM comments WHERE post_id IS NOT NULL")
        total_c = cursor.fetchone()[0]
        print(f"Final check: posts sum={total_p}, comments linked={total_c}")
        
        conn.commit()
except Exception as e:
    print(e)
