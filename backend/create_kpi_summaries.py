import os
import sys
import snowflake.connector
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding="utf-8")
load_dotenv()

def get_connection():
    return snowflake.connector.connect(
        host=os.getenv("SNOWFLAKE_HOST"),
        port=int(os.getenv("SNOWFLAKE_PORT", 443)),
        account=os.getenv("SNOWFLAKE_ACCOUNT"),
        user=os.getenv("SNOWFLAKE_USER"),
        password=os.getenv("SNOWFLAKE_PASSWORD"),
        warehouse="my_basic_wh",
        database="my_dashboard",
        schema="public",
    )

def main():
    conn = get_connection()
    cur = conn.cursor()

    print("Creating kpi_summaries table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS kpi_summaries (
            id             INT AUTOINCREMENT PRIMARY KEY,
            market_code    VARCHAR(10)   NOT NULL REFERENCES markets(market_code),
            metric_name    VARCHAR(255)  NOT NULL,
            metric_value   DOUBLE PRECISION,
            report_date    DATE,
            batch_id       VARCHAR(50),
            created_at     TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
        )
    """)
    conn.commit()
    print("✓ kpi_summaries table created successfully.")
    
    conn.close()

if __name__ == "__main__":
    main()
