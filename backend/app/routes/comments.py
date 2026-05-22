from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import date
import time
from app.db import get_snowflake_connection
from app.middleware import get_current_user

router = APIRouter(prefix="/comments", tags=["comments"])

_cache = {}
CACHE_TTL = 300  # 5 minutes


@router.get("/")
def get_comments(
    platform: Optional[str] = Query(None),
    sentiment: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    market: Optional[str] = Query(None),
    _user: dict = Depends(get_current_user),
):
    cache_key = f"comments:{platform}:{sentiment}:{date_from}:{date_to}:{market}"
    now = time.time()
    if cache_key in _cache and now - _cache[cache_key]["ts"] < CACHE_TTL:
        return _cache[cache_key]["data"]

    conditions, params = [], []
    if platform:
        conditions.append("platform = %s")
        params.append(platform)
    if sentiment:
        conditions.append("sentiment = %s")
        params.append(sentiment)
    if date_from:
        conditions.append("comment_date >= %s")
        params.append(date.fromisoformat(date_from))
    if date_to:
        conditions.append("comment_date <= %s")
        params.append(date.fromisoformat(date_to))
    if market:
        conditions.append("market_code = %s")
        params.append(market)

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    with get_snowflake_connection() as conn:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT comment_date, platform, post_id, comment_text,
                   sentiment, keyword_tag, keyword_type
            FROM comments
            {where_clause}
            ORDER BY comment_date ASC
        """, params)
        rows = cur.fetchall()

    result = [
        {
            "Date": r[0], "Platform": r[1], "Post Link": r[2],
            "Comment Text": r[3], "Sentiment": r[4],
            "Keyword Tag": r[5], "Keyword Type": r[6],
        }
        for r in rows
    ]
    _cache[cache_key] = {"data": result, "ts": now}
    return result

