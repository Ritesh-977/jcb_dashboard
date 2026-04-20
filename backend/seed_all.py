"""
Run to seed all tables from mock JSON data:
    python seed_all.py
"""
import asyncio
import asyncpg
import json
import os
from datetime import date
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

MOCK_DIR = Path(__file__).parent.parent / "frontend" / "src" / "mock_data"


async def main():
    conn = await asyncpg.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 5432)),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        ssl="require",
        statement_cache_size=0,
    )

    # --- kpi_summary ---
    kpi = json.loads((MOCK_DIR / "KPI_Summary.json").read_text(encoding="utf-8"))
    await conn.execute('TRUNCATE TABLE kpi_summary')
    await conn.executemany(
        'INSERT INTO kpi_summary ("Metric", "Value") VALUES ($1, $2)',
        [(r["Metric"], float(r["Value"])) for r in kpi]
    )
    print(f"✓ kpi_summary seeded ({len(kpi)} rows)")

    # --- overall_sentiment ---
    sentiment = json.loads((MOCK_DIR / "Overall_Sentiment.json").read_text(encoding="utf-8"))
    await conn.execute('TRUNCATE TABLE overall_sentiment')
    await conn.executemany(
        '''INSERT INTO overall_sentiment
           ("Platform","Positive","Neutral","Negative","Total","% Positive","% Neutral","% Negative")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)''',
        [(r["Platform"], r["Positive"], r["Neutral"], r["Negative"],
          r["Total"], r["% Positive"], r["% Neutral"], r["% Negative"]) for r in sentiment]
    )
    print(f"✓ overall_sentiment seeded ({len(sentiment)} rows)")

    # --- post_data ---
    posts = json.loads((MOCK_DIR / "Post_Data.json").read_text(encoding="utf-8"))
    await conn.execute('TRUNCATE TABLE post_data')
    await conn.executemany(
        '''INSERT INTO post_data
           ("Date","Campaign Name","Market","Platform","Source","Post Content",
            "Post Link","Likes","Comments Count","Shares","Total Engagement","Post Sentiment")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)''',
        [(date.fromisoformat(r["Date"]), r.get("Campaign Name"), r.get("Market"), r.get("Platform"),
          json.dumps(r.get("Source")), r.get("Post Content"), r.get("Post Link"),
          r.get("Likes", 0), r.get("Comments Count", 0), r.get("Shares", 0),
          r.get("Total Engagement", 0), r.get("Post Sentiment")) for r in posts]
    )
    print(f"✓ post_data seeded ({len(posts)} rows)")

    # --- comment_data ---
    comments = json.loads((MOCK_DIR / "Comment_Data.json").read_text(encoding="utf-8"))
    await conn.execute('TRUNCATE TABLE comment_data')
    await conn.executemany(
        '''INSERT INTO comment_data
           ("Date","Platform","Post Link","Comment Text","Sentiment","Keyword Tag","Keyword Type")
           VALUES ($1,$2,$3,$4,$5,$6,$7)''',
        [(date.fromisoformat(r["Date"]), r["Platform"], r["Post Link"], r["Comment Text"],
          r["Sentiment"], r["Keyword Tag"], r.get("Keyword Type", "")) for r in comments]
    )
    print(f"✓ comment_data seeded ({len(comments)} rows)")

    await conn.close()
    print("\nAll tables seeded successfully.")


if __name__ == "__main__":
    asyncio.run(main())
