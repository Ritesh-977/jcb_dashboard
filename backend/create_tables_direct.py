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

tables = [
    """CREATE TABLE IF NOT EXISTS markets (
        market_code VARCHAR(10) PRIMARY KEY,
        market_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
    )""",
    
    """CREATE TABLE IF NOT EXISTS campaigns (
        id INT AUTOINCREMENT PRIMARY KEY,
        campaign_name VARCHAR(255) NOT NULL,
        market_code VARCHAR(10) NOT NULL,
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
    )""",
    
    """CREATE TABLE IF NOT EXISTS posts (
        id INT AUTOINCREMENT PRIMARY KEY,
        market_code VARCHAR(10) NOT NULL,
        campaign_id INT,
        publish_date DATE,
        update_date DATE,
        platform VARCHAR(50),
        source_name VARCHAR(255),
        title VARCHAR(500),
        content TEXT,
        link VARCHAR(500),
        sentiment VARCHAR(50),
        likes INT DEFAULT 0,
        comments_count INT DEFAULT 0,
        shares INT DEFAULT 0,
        total_engagement INT DEFAULT 0,
        audience INT DEFAULT 0,
        reach INT DEFAULT 0,
        media_type VARCHAR(100),
        tags TEXT,
        language VARCHAR(50),
        ranking INT,
        notes TEXT,
        created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
    )""",
    
    """CREATE TABLE IF NOT EXISTS authors (
        id INT AUTOINCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        author_name VARCHAR(255),
        author_handle VARCHAR(255),
        author_url VARCHAR(500),
        gender VARCHAR(20),
        age_range VARCHAR(50),
        bio TEXT,
        city VARCHAR(100)
    )""",
    
    """CREATE TABLE IF NOT EXISTS comments (
        id INT AUTOINCREMENT PRIMARY KEY,
        post_id INT,
        market_code VARCHAR(10) NOT NULL,
        comment_date DATE,
        platform VARCHAR(50),
        comment_text TEXT,
        sentiment VARCHAR(50),
        keyword_tag VARCHAR(100),
        keyword_type VARCHAR(50),
        created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
    )""",
    
    """CREATE TABLE IF NOT EXISTS keyword_mapping (
        id INT AUTOINCREMENT PRIMARY KEY,
        keyword VARCHAR(100) NOT NULL UNIQUE,
        category VARCHAR(100) NOT NULL
    )""",
    
    """CREATE TABLE IF NOT EXISTS raw_ingestion (
        id INT AUTOINCREMENT PRIMARY KEY,
        title VARCHAR(500),
        detail TEXT,
        link VARCHAR(500),
        source VARCHAR(255),
        update_date DATE,
        publish_date DATE,
        sentiment VARCHAR(50),
        ranking INT,
        media_type VARCHAR(100),
        tags TEXT,
        country VARCHAR(50),
        language VARCHAR(50),
        audience INT,
        reach INT,
        interactions INT,
        notes TEXT,
        author_name VARCHAR(255),
        author_handle VARCHAR(255),
        author_url VARCHAR(500),
        gender VARCHAR(20),
        age VARCHAR(50),
        bio TEXT,
        city VARCHAR(100),
        batch_id VARCHAR(50),
        ingested_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
    )""",
    
    """CREATE TABLE IF NOT EXISTS kpi_summaries (
        id INT AUTOINCREMENT PRIMARY KEY,
        market_code VARCHAR(10) NOT NULL,
        metric_name VARCHAR(100) NOT NULL,
        metric_value FLOAT,
        report_date DATE,
        batch_id VARCHAR(50),
        created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
    )"""
]

for i, table_sql in enumerate(tables):
    try:
        cursor.execute(table_sql)
        conn.commit()
        table_name = table_sql.split("CREATE TABLE IF NOT EXISTS")[1].split("(")[0].strip()
        print(f"✓ Created: {table_name}")
    except Exception as e:
        print(f"✗ Error: {e}")

cursor.close()
conn.close()
print("\n✓ All tables created!")
