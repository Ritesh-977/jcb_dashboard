import sys
import os
from dotenv import load_dotenv

load_dotenv('.env')

sys.path.insert(0, os.path.abspath('.'))
from app.db import get_snowflake_connection

try:
    with get_snowflake_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SHOW TABLES LIKE '%POST_DATA%'")
        print("Tables matching POST_DATA:", cursor.fetchall())
except Exception as e:
    print(e)
