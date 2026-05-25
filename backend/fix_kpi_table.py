import os
import snowflake.connector
from dotenv import load_dotenv

load_dotenv()

conn = snowflake.connector.connect(
    account=os.getenv("SNOWFLAKE_ACCOUNT"),
    user=os.getenv("SNOWFLAKE_USER"),
    password=os.getenv("SNOWFLAKE_PASSWORD"),
    warehouse="my_basic_wh",
    database="my_dashboard_db",
    schema="public"
)

cursor = conn.cursor()

cursor.execute("DROP TABLE IF EXISTS kpi_summaries")
print("✓ Dropped kpi_summaries")

cursor.execute("""
    CREATE TABLE kpi_summaries (
        id INT AUTOINCREMENT PRIMARY KEY,
        market_code VARCHAR(10) NOT NULL,
        metric_name VARCHAR(100) NOT NULL,
        metric_value FLOAT,
        report_date DATE,
        batch_id VARCHAR(50),
        created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
    )
""")
conn.commit()
print("✓ Created kpi_summaries with report_date")

cursor.close()
conn.close()
