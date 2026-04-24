"""
Run once to add PERMISSIONS and IS_ACTIVE columns to the USERS table.
    python run_migration.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from app.db import init_connection_pool
import app.db as db

init_connection_pool()
conn = db._connection_pool
cur = conn.cursor()

statements = [
    "ALTER TABLE USERS ADD COLUMN IF NOT EXISTS PERMISSIONS VARCHAR(1000) DEFAULT '[]'",
    "ALTER TABLE USERS ADD COLUMN IF NOT EXISTS IS_ACTIVE BOOLEAN DEFAULT TRUE",
    "UPDATE USERS SET PERMISSIONS = '[\"view_kpi\",\"view_sentiment\",\"view_comments\",\"view_trend\"]', IS_ACTIVE = TRUE WHERE ROLE = 'admin'",
    "UPDATE USERS SET PERMISSIONS = '[\"view_kpi\"]', IS_ACTIVE = TRUE WHERE ROLE = 'viewer'",
]

for sql in statements:
    print(f"Running: {sql[:60]}...")
    cur.execute(sql)
    print("  ✓ done")

cur.execute("SELECT ID, EMAIL, ROLE, PERMISSIONS, IS_ACTIVE FROM USERS")
rows = cur.fetchall()
print("\nCurrent USERS table:")
for r in rows:
    print(f"  id={r[0]} email={r[1]} role={r[2]} permissions={r[3]} is_active={r[4]}")

print("\nMigration complete.")
