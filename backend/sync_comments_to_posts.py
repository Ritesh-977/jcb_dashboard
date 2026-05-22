import sys
import os
from dotenv import load_dotenv

load_dotenv('.env')

sys.path.insert(0, os.path.abspath('.'))
from app.db import get_snowflake_connection

try:
    with get_snowflake_connection() as conn:
        cursor = conn.cursor()
        
        # 1. Reset comments_count on posts
        cursor.execute("UPDATE posts SET comments_count = 0, total_engagement = COALESCE(likes,0) + COALESCE(shares,0)")
        print("Reset posts comments_count.")
        
        # 2. Get all comments
        cursor.execute("SELECT id, comment_date, platform FROM comments")
        comments = cursor.fetchall()
        
        # 3. For each comment, find best post and link it
        updated_comments = 0
        for cid, c_date, platform in comments:
            # Find best post
            cursor.execute("""
                SELECT id FROM posts
                WHERE UPPER(platform) = UPPER(%s)
                ORDER BY ABS(DATEDIFF(day, publish_date, %s)), id
                LIMIT 1
            """, (platform, c_date))
            res = cursor.fetchone()
            if res:
                pid = res[0]
                # Update comment's post_id
                cursor.execute("UPDATE comments SET post_id = %s WHERE id = %s", (pid, cid))
                # Update post's comments_count
                cursor.execute("UPDATE posts SET comments_count = comments_count + 1, total_engagement = total_engagement + 1 WHERE id = %s", (pid,))
                updated_comments += 1
                
        print(f"Linked {updated_comments} comments to posts and updated counts.")
        
        # Verify sums
        cursor.execute("SELECT SUM(comments_count) FROM posts")
        total_p = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(post_id) FROM comments")
        total_c = cursor.fetchone()[0]
        print(f"Final check: posts sum={total_p}, comments linked={total_c}")
        
        conn.commit()
except Exception as e:
    print(e)
