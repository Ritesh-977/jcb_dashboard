import sys
import os
from dotenv import load_dotenv

load_dotenv('.env')

sys.path.insert(0, os.path.abspath('.'))
from app.db import get_snowflake_connection

try:
    with get_snowflake_connection() as conn:
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*), COUNT(post_id) FROM comments")
        total, with_post_id = cursor.fetchone()
        print(f"Total comments: {total}, Comments with post_id: {with_post_id}")
        
except Exception as e:
    print(e)
