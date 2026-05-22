import sys
import os
from dotenv import load_dotenv

load_dotenv('.env')

sys.path.insert(0, os.path.abspath('.'))
from app.db import get_snowflake_connection

try:
    with get_snowflake_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE COMMENTS SET sentiment = 'Positive' WHERE sentiment = 'Postive'")
        print("Updated sentiment in COMMENTS.", cursor.rowcount, "rows affected.")
        
        cursor.execute("UPDATE COMMENTS SET keyword_type = 'Positive' WHERE keyword_type = 'Postive'")
        print("Updated keyword_type in COMMENTS.", cursor.rowcount, "rows affected.")
        
        conn.commit()
except Exception as e:
    print(e)
