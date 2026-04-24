from dotenv import load_dotenv
load_dotenv()
import snowflake.connector, os

print("Connecting...")
conn = snowflake.connector.connect(
    account=os.getenv('SNOWFLAKE_ACCOUNT'),
    user=os.getenv('SNOWFLAKE_USER'),
    password=os.getenv('SNOWFLAKE_PASSWORD'),
    warehouse='my_basic_wh',
    database='my_dashboard',
    schema='public'
)
print("Connected.")

cur = conn.cursor()

# Check table structure
cur.execute("SELECT * FROM USERS LIMIT 5")
print("Columns:", [d[0] for d in cur.description])
rows = cur.fetchall()
print(f"Row count: {len(rows)}")
for r in rows:
    print(" ", r)

# Test update
if rows:
    test_id = rows[0][0]
    print(f"\nTesting UPDATE on ID={test_id}")
    cur.execute("UPDATE USERS SET IS_ACTIVE = TRUE WHERE ID = %s", (test_id,))
    print(f"rowcount: {cur.rowcount}")
    conn.commit()
    print("commit() done")

    # Verify
    cur.execute("SELECT ID, IS_ACTIVE FROM USERS WHERE ID = %s", (test_id,))
    print("After update:", cur.fetchone())

conn.close()
print("Done.")
