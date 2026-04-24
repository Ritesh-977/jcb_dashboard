import asyncio
import asyncpg
import pandas as pd
import snowflake.connector
from snowflake.connector.pandas_tools import write_pandas
from dotenv import load_dotenv
import os

load_dotenv()

TABLES = ["users", "kpi_summary", "overall_sentiment", "post_data", "comment_data"]


async def extract_from_postgres() -> dict[str, pd.DataFrame]:
    conn = await asyncpg.connect(os.getenv("POSTGRES_DSN"))
    dataframes = {}
    try:
        for table in TABLES:
            print(f"[Postgres] Extracting '{table}'...")
            rows = await conn.fetch(f"SELECT * FROM {table}")
            if not rows:
                print(f"[Postgres] '{table}' is empty — skipping.")
                continue
            dataframes[table] = pd.DataFrame(rows, columns=list(rows[0].keys()))
            print(f"[Postgres] '{table}' extracted: {len(dataframes[table])} rows.")
    finally:
        await conn.close()
    return dataframes


def load_to_snowflake(dataframes: dict[str, pd.DataFrame]):
    conn = snowflake.connector.connect(
        host=os.getenv("SNOWFLAKE_HOST"),
        port=int(os.getenv("SNOWFLAKE_PORT", 443)),
        account=os.getenv("SNOWFLAKE_ACCOUNT"),
        user=os.getenv("SNOWFLAKE_USER"),
        password=os.getenv("SNOWFLAKE_PASSWORD"),
        warehouse="my_basic_wh",
        database="my_dashboard",
        schema="public",
    )
    try:
        for table, df in dataframes.items():
            print(f"[Snowflake] Loading '{table}' ({len(df)} rows)...")
            # write_pandas requires uppercase column names
            df.columns = [c.upper() for c in df.columns]
            success, nchunks, nrows, _ = write_pandas(
                conn=conn,
                df=df,
                table_name=table.upper(),
                auto_create_table=True,
                overwrite=True,
            )
            if success:
                print(f"[Snowflake] '{table}' loaded successfully: {nrows} rows in {nchunks} chunk(s).")
            else:
                print(f"[Snowflake] '{table}' load failed.")
    finally:
        conn.close()


async def main():
    print("=== Starting Migration: PostgreSQL → Snowflake ===\n")
    dataframes = await extract_from_postgres()
    if not dataframes:
        print("No data extracted. Exiting.")
        return
    load_to_snowflake(dataframes)
    print("\n=== Migration Complete ===")


if __name__ == "__main__":
    asyncio.run(main())
