import os, sys
from dotenv import load_dotenv

sys.path.append('c:\\Users\\RiteshSingh\\Desktop\\jcb_dashboard\\backend')
load_dotenv('c:\\Users\\RiteshSingh\\Desktop\\jcb_dashboard\\backend\\.env')

from app.db import get_snowflake_connection

with get_snowflake_connection() as conn:
    cur = conn.cursor()
    cur.execute('SELECT COUNT(*) FROM comments')
    print('Total comments:', cur.fetchone()[0])
    cur.execute('SELECT COUNT(*) FROM comments WHERE post_id IS NULL')
    print('Unlinked comments:', cur.fetchone()[0])
    cur.execute('SELECT comment_text, COUNT(*) FROM comments GROUP BY comment_text HAVING COUNT(*) > 1')
    dups = cur.fetchall()
    print(f'Found {len(dups)} duplicate texts in DB. Total duplicates sum: {sum(x[1] for x in dups)}')
    for d in dups[:5]:
        print("  -", d)
