import sys
import os
from dotenv import load_dotenv

load_dotenv('.env')

sys.path.insert(0, os.path.abspath('.'))
from app.db import get_snowflake_connection

try:
    with get_snowflake_connection() as conn:
        cursor = conn.cursor()
        
        # Get comment counts by date and platform
        cursor.execute("""
            SELECT comment_date, platform, COUNT(*) as cnt
            FROM comments
            GROUP BY comment_date, platform
            ORDER BY comment_date
        """)
        comment_groups = cursor.fetchall()
        
        print("Comment groups:", len(comment_groups))
        
        matches = 0
        unmatched = 0
        for comment_date, platform, cnt in comment_groups:
            cursor.execute("""
                SELECT id FROM posts
                WHERE publish_date = %s AND platform = %s
            """, (comment_date, platform))
            posts = cursor.fetchall()
            if posts:
                matches += 1
            else:
                unmatched += 1
                
        print(f"Matches: {matches}, Unmatched: {unmatched}")
        
except Exception as e:
    print(e)
