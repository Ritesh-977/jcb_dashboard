from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.db import get_snowflake_connection
import csv
import uuid
from io import StringIO
from datetime import datetime

router = APIRouter(prefix="/api/etl", tags=["ETL"])


def _to_date(val):
    if not val or str(val).strip() in ('', 'N/A', 'null', 'NULL', 'None'):
        return None
    for fmt in ('%d/%m/%Y %H:%M:%S', '%d/%m/%Y', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d', '%m/%d/%Y'):
        try:
            return datetime.strptime(str(val).strip(), fmt).date()
        except ValueError:
            continue
    return None


def _to_int(val):
    try:
        return int(float(str(val).strip()))
    except (ValueError, TypeError):
        return 0


@router.post("/upload-csv")
async def upload_csv(
    file: UploadFile = File(...),
    targetCountry: str = Form(...),
    campaignName: str = Form(None),
):
    """
    Upload CSV → stage in raw_ingestion → transform into posts + authors.
    Also auto-creates the market if it doesn't exist yet.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")

    content = await file.read()
    # Try UTF-8 first, fall back to cp1258 for Vietnamese data
    try:
        csv_text = content.decode('utf-8')
    except UnicodeDecodeError:
        csv_text = content.decode('cp1258')

    rows = list(csv.DictReader(StringIO(csv_text)))
    if not rows:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    batch_id = str(uuid.uuid4())[:8]
    market_code = targetCountry.upper().strip()

    # Detect common market name → code mappings
    market_names = {
        "PH": "Philippines", "US": "United States", "JP": "Japan",
        "TH": "Thailand", "SG": "Singapore", "MY": "Malaysia",
        "ID": "Indonesia", "VN": "Vietnam", "TW": "Taiwan",
        "HK": "Hong Kong", "KR": "South Korea", "AU": "Australia",
    }
    market_name = market_names.get(market_code, market_code)

    with get_snowflake_connection() as conn:
        cursor = conn.cursor()

        # --- 1. Ensure market exists ---
        cursor.execute("""
            MERGE INTO markets t USING (SELECT %s AS mc) s ON t.market_code = s.mc
            WHEN NOT MATCHED THEN INSERT (market_code, market_name) VALUES (%s, %s)
        """, (market_code, market_code, market_name))

        # --- 2. Ensure campaign exists (if provided) ---
        campaign_id = None
        if campaignName:
            cursor.execute("""
                MERGE INTO campaigns t
                USING (SELECT %s AS cn, %s AS mc) s
                ON t.campaign_name = s.cn AND t.market_code = s.mc
                WHEN NOT MATCHED THEN INSERT (campaign_name, market_code) VALUES (%s, %s)
            """, (campaignName, market_code, campaignName, market_code))
            cursor.execute(
                "SELECT id FROM campaigns WHERE campaign_name = %s AND market_code = %s",
                (campaignName, market_code),
            )
            row = cursor.fetchone()
            if row:
                campaign_id = row[0]

        # --- 3. Stage raw data into raw_ingestion ---
        stage_params = []
        for row in rows:
            stage_params.append((
                row.get('Title'), row.get('Detail'), row.get('Link'),
                row.get('Source'), _to_date(row.get('Update date')),
                _to_date(row.get('Publish date')),
                row.get('Sentiment', '').strip().capitalize(),
                _to_int(row.get('Ranking')), row.get('Media type'),
                row.get('Tags'),
                row.get('Country', market_code),
                row.get('Language'),
                _to_int(row.get('Audience')), _to_int(row.get('Reach')),
                _to_int(row.get('Interactions')), row.get('Notes'),
                row.get('Author name'), row.get('Author handle (@username)', row.get('Author handle')),
                row.get('Author URL'), row.get('Gender'),
                row.get('Age'), row.get('Bio'), row.get('City'),
                batch_id,
            ))

        cursor.executemany("""
            INSERT INTO raw_ingestion (
                title, detail, link, source, update_date, publish_date,
                sentiment, ranking, media_type, tags, country, language,
                audience, reach, interactions, notes,
                author_name, author_handle, author_url, gender,
                age, bio, city, batch_id
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, stage_params)

        # --- 4. Transform: raw_ingestion → posts ---
        post_params = []
        for row in rows:
            sentiment = row.get('Sentiment', '').strip().capitalize()
            post_params.append((
                market_code, campaign_id,
                _to_date(row.get('Publish date')),
                _to_date(row.get('Update date')),
                row.get('Media type'),       # platform
                row.get('Source'),            # source_name
                row.get('Title'),             # title
                row.get('Detail'),            # content
                row.get('Link'),              # link
                sentiment,
                0, 0, 0,                      # likes, comments_count, shares
                _to_int(row.get('Interactions')),  # total_engagement
                _to_int(row.get('Audience')),
                _to_int(row.get('Reach')),
                row.get('Media type'),
                row.get('Tags'),
                row.get('Language'),
                _to_int(row.get('Ranking')),
                row.get('Notes'),
            ))

        cursor.executemany("""
            INSERT INTO posts (
                market_code, campaign_id, publish_date, update_date,
                platform, source_name, title, content, link, sentiment,
                likes, comments_count, shares, total_engagement,
                audience, reach, media_type, tags, language, ranking, notes
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, post_params)

        # --- 5. Extract authors for posts that have author data ---
        # Get the post IDs we just inserted (by batch link matching)
        links = [row.get('Link') for row in rows if row.get('Link')]
        if links:
            placeholders = ','.join(['%s'] * len(links))
            cursor.execute(f"""
                SELECT id, link FROM posts
                WHERE link IN ({placeholders})
                ORDER BY id DESC
            """, links)
            link_to_post_id = {}
            for r in cursor.fetchall():
                if r[1] not in link_to_post_id:
                    link_to_post_id[r[1]] = r[0]

            author_params = []
            for row in rows:
                link = row.get('Link')
                post_id = link_to_post_id.get(link)
                author_name = row.get('Author name')
                if post_id and author_name:
                    author_params.append((
                        post_id, author_name,
                        row.get('Author handle (@username)', row.get('Author handle')),
                        row.get('Author URL'),
                        row.get('Gender'), row.get('Age'),
                        row.get('Bio'), row.get('City'),
                    ))

            if author_params:
                cursor.executemany("""
                    INSERT INTO authors (
                        post_id, author_name, author_handle, author_url,
                        gender, age_range, bio, city
                    ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                """, author_params)

        conn.commit()

    return {
        "message": f"Processed {len(rows)} rows for market '{market_code}'",
        "batch_id": batch_id,
        "market": market_code,
        "campaign": campaignName,
        "rows_processed": len(rows),
    }
