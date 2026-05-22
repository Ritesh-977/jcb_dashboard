import sys
import os
from dotenv import load_dotenv

load_dotenv('.env')

sys.path.insert(0, os.path.abspath('.'))
from app.db import get_snowflake_connection

try:
    with get_snowflake_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM COMMENTS WHERE sentiment = 'Postive'")
        res = cursor.fetchone()
        print('Count Postive in Sentiment:', res[0])
        
        cursor.execute("SELECT COUNT(*) FROM COMMENTS WHERE keyword_type = 'Postive'")
        res = cursor.fetchone()
        print('Count Postive in keyword_type:', res[0])
except Exception as e:
    print(e)
