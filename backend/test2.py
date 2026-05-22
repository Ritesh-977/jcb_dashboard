import sys
import os
from dotenv import load_dotenv

load_dotenv('.env')

sys.path.insert(0, os.path.abspath('.'))
from app.db import get_snowflake_connection

try:
    with get_snowflake_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT SUM(comments_count) FROM posts")
        res = cursor.fetchone()
        print('Total comments_count in POSTS table:', res[0])
        
        cursor.execute("SELECT COUNT(*) FROM comments")
        res = cursor.fetchone()
        print('Total rows in COMMENTS table:', res[0])
except Exception as e:
    print(e)
