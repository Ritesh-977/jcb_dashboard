import sys
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv('.env')

sys.path.insert(0, os.path.abspath('.'))
from app.db import get_snowflake_connection

try:
    with get_snowflake_connection() as conn:
        cursor = conn.cursor()
        
        # 1. Fetch posts
        cursor.execute("SELECT id, publish_date, platform FROM posts")
        posts = cursor.fetchall()
        
        # 2. Fetch comments
        cursor.execute("SELECT id, comment_date, platform FROM comments")
        comments = cursor.fetchall()
        
        # 3. Match in Python
        updates = []
        for cid, c_date, c_platform in comments:
            best_post_id = None
            min_diff = None
            
            for pid, p_date, p_platform in posts:
                if p_platform and c_platform and p_platform.upper() == c_platform.upper():
                    diff = abs((p_date - c_date).days)
                    if min_diff is None or diff < min_diff:
                        min_diff = diff
                        best_post_id = pid
            
            if best_post_id is not None:
                updates.append((best_post_id, cid))
        
        # 4. Execute updates
        cursor.executemany("UPDATE comments SET post_id = %s WHERE id = %s", updates)
        print(f"Updated {cursor.rowcount} comments with post_id.")
        
        # 5. Reset counts
        cursor.execute("UPDATE posts SET comments_count = 0, total_engagement = COALESCE(likes,0) + COALESCE(shares,0)")
        
        # 6. Update posts with aggregate comments counts using MERGE
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
        print("Updated posts counts:", cursor.rowcount)
        
        # Verify
        cursor.execute("SELECT SUM(comments_count) FROM posts")
        total_p = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(post_id) FROM comments WHERE post_id IS NOT NULL")
        total_c = cursor.fetchone()[0]
        print(f"Final check: posts sum={total_p}, comments linked={total_c}")
        
        conn.commit()
except Exception as e:
    print(e)
