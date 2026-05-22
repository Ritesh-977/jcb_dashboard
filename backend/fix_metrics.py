import sys
import os
import json
from dotenv import load_dotenv

load_dotenv('.env')

sys.path.insert(0, os.path.abspath('.'))
from app.db import get_snowflake_connection

with open('../frontend/src/mock_data/Post_Data.json', encoding='utf-8') as f:
    posts_mock = json.load(f)

try:
    with get_snowflake_connection() as conn:
        cursor = conn.cursor()
        
        updated_count = 0
        for p in posts_mock:
            link = p.get('Post Link')
            likes = p.get('Likes', 0)
            comments_count = p.get('Comments Count', 0)
            shares = p.get('Shares', 0)
            total_eng = p.get('Total Engagement', 0)
            
            cursor.execute("""
                UPDATE posts 
                SET likes = %s,
                    comments_count = %s,
                    shares = %s,
                    total_engagement = %s
                WHERE link = %s
            """, (likes, comments_count, shares, total_eng, link))
            
            updated_count += cursor.rowcount
            
        print(f"Updated {updated_count} rows in posts table.")
        
        # Verify
        cursor.execute("SELECT SUM(comments_count) FROM posts")
        print("After update, total comments_count in POSTS:", cursor.fetchone()[0])
        
        conn.commit()
except Exception as e:
    print(e)
