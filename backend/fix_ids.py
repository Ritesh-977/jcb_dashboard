from dotenv import load_dotenv
load_dotenv()
import snowflake.connector, os

conn = snowflake.connector.connect(
    account=os.getenv('SNOWFLAKE_ACCOUNT'),
    user=os.getenv('SNOWFLAKE_USER'),
    password=os.getenv('SNOWFLAKE_PASSWORD'),
    warehouse='my_basic_wh',
    database='my_dashboard',
    schema='public'
)
cur = conn.cursor()

# Fetch all existing users
cur.execute("SELECT EMAIL, PASSWORD_HASH, ROLE, PERMISSIONS, IS_ACTIVE FROM USERS")
existing = cur.fetchall()
print(f"Found {len(existing)} users to migrate: {[r[0] for r in existing]}")

# Recreate table with proper AUTOINCREMENT
print("Recreating table...")
cur.execute("DROP TABLE IF EXISTS USERS")
cur.execute("""
    CREATE TABLE USERS (
        ID            NUMBER AUTOINCREMENT PRIMARY KEY,
        EMAIL         VARCHAR(255) UNIQUE NOT NULL,
        PASSWORD_HASH TEXT NOT NULL,
        ROLE          VARCHAR(50) NOT NULL DEFAULT 'viewer',
        PERMISSIONS   VARCHAR(1000) DEFAULT '[]',
        IS_ACTIVE     BOOLEAN DEFAULT TRUE
    )
""")
conn.commit()
print("Table recreated.")

# Re-insert all users
for row in existing:
    email, pwd_hash, role, perms, is_active = row
    cur.execute(
        "INSERT INTO USERS (EMAIL, PASSWORD_HASH, ROLE, PERMISSIONS, IS_ACTIVE) VALUES (%s, %s, %s, %s, %s)",
        (email, pwd_hash, role, perms or '[]', is_active if is_active is not None else True)
    )
    print(f"  Inserted: {email}")

conn.commit()

# Verify
cur.execute("SELECT ID, EMAIL, ROLE, IS_ACTIVE FROM USERS")
print("\nFinal table:")
for r in cur.fetchall():
    print(" ", r)

conn.close()
print("\nDone. All users now have proper IDs.")
