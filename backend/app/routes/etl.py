"""
etl.py — CSV Upload API Route

Handles multipart file upload, delegates to csv_processor for:
- Dynamic column detection (what categories exist in this CSV?)
- Multi-table routing (posts, kpis, comments)
- Upsert/append semantics (sequential uploads merge, not overwrite)

Protected by admin auth. Returns detailed processing report.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from app.db import get_snowflake_connection
from app.middleware import require_admin
from app.routes import dashboard as dashboard_module
from app.services.csv_processor import (
    normalize_headers,
    detect_categories,
    process_posts,
    process_kpis,
    process_comments,
    stage_raw_ingestion,
)
import csv
import uuid
from io import StringIO

router = APIRouter(prefix="/api/etl", tags=["ETL"])

# Common market code → name lookup
MARKET_NAMES = {
    "PH": "Philippines", "US": "United States", "JP": "Japan",
    "TH": "Thailand", "SG": "Singapore", "MY": "Malaysia",
    "ID": "Indonesia", "VN": "Vietnam", "TW": "Taiwan",
    "HK": "Hong Kong", "KR": "South Korea", "AU": "Australia",
}


@router.post("/upload-csv")
async def upload_csv(
    file: UploadFile = File(...),
    targetCountry: str = Form(...),
    campaignName: str = Form(None),
    _: dict = Depends(require_admin),
):
    """
    Upload a CSV file → dynamically detect columns → route to correct tables.

    Flow:
      1. Parse CSV with encoding fallback (UTF-8 → cp1258)
      2. Normalize all headers via alias map (fuzzy matching)
      3. Detect which categories are present (posts / kpis / comments)
      4. Ensure market & campaign exist in DB
      5. Stage raw data into raw_ingestion (audit trail)
      6. Route to category-specific processors with upsert/append logic
      7. Return detailed processing report

    Supports:
      - Consolidated CSVs (all data in one file) → routes to ALL matching tables
      - Fragmented CSVs (KPIs separate from Comments) → sequential uploads append
      - Missing columns → gracefully default to None/0
      - Heterogeneous headers → fuzzy-matched to canonical field names
    """
    # ── Validate file type ──
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    # ── Read & decode CSV ──
    content = await file.read()
    try:
        csv_text = content.decode('utf-8')
    except UnicodeDecodeError:
        csv_text = content.decode('cp1258')

    rows = list(csv.DictReader(StringIO(csv_text)))
    if not rows:
        raise HTTPException(status_code=400, detail="CSV file is empty or has no data rows")

    batch_id = str(uuid.uuid4())[:8]
    market_code = targetCountry.upper().strip()
    market_name = MARKET_NAMES.get(market_code, market_code)

    # ── Normalize headers & detect categories ──
    raw_headers = list(rows[0].keys())
    field_map = normalize_headers(raw_headers)
    categories = detect_categories(field_map)
    canonical_fields = list(set(field_map.values()))

    if not categories:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Could not detect any recognizable data category (Posts, KPIs, or Comments) in the CSV headers.",
                "headers_found": raw_headers,
                "hint": "Ensure your CSV has columns like: Title, Detail, Link (for Posts), "
                        "Metric Name, Metric Value (for KPIs), or Comment Text, Comment Date (for Comments).",
            },
        )

    # ── Database operations ──
    category_counts = {}

    with get_snowflake_connection() as conn:
        cursor = conn.cursor()

        # 1. Ensure market exists (MERGE = create if missing)
        cursor.execute("""
            MERGE INTO markets t USING (SELECT %s AS mc) s ON t.market_code = s.mc
            WHEN NOT MATCHED THEN INSERT (market_code, market_name) VALUES (%s, %s)
        """, (market_code, market_code, market_name))

        # 2. Ensure campaign exists (if provided)
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

        # 3. Stage raw data into raw_ingestion (audit trail, all rows)
        stage_raw_ingestion(rows, field_map, market_code, batch_id, cursor)

        # 4. Route to category-specific processors
        if "posts" in categories:
            count = process_posts(rows, field_map, market_code, campaign_id, batch_id, cursor)
            category_counts["posts"] = count

        if "kpis" in categories:
            count = process_kpis(rows, field_map, market_code, batch_id, cursor)
            category_counts["kpis"] = count

        if "comments" in categories:
            count = process_comments(rows, field_map, market_code, batch_id, cursor)
            category_counts["comments"] = count

        if "posts" in categories or "comments" in categories:
            from app.services.csv_processor import sync_comments_to_posts
            sync_comments_to_posts(cursor, market_code)

        conn.commit()

    # ── Bust caches so dashboard picks up new data immediately ──
    dashboard_module._markets_cache["data"] = None
    dashboard_module._markets_cache["ts"] = 0
    dashboard_module._cache.clear()

    return {
        "message": f"Processed {len(rows)} rows for market '{market_code}'",
        "batch_id": batch_id,
        "market": market_code,
        "campaign": campaignName,
        "rows_processed": len(rows),
        "categories_detected": sorted(categories),
        "category_counts": category_counts,
        "columns_detected": sorted(canonical_fields),
    }
