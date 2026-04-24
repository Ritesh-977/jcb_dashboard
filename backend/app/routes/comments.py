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
    _user: dict = Depends(get_current_user),
):
    cache_key = f"comments:{platform}:{sentiment}:{date_from}:{date_to}"
    now = time.time()
    if cache_key in _cache and now - _cache[cache_key]["ts"] < CACHE_TTL:
        return _cache[cache_key]["data"]

    conditions, params = [], []
    if platform:
        conditions.append("PLATFORM = %s")
        params.append(platform)
    if sentiment:
        conditions.append("SENTIMENT = %s")
        params.append(sentiment)
    if date_from:
        conditions.append("DATE >= %s")
        params.append(date.fromisoformat(date_from))
    if date_to:
        conditions.append("DATE <= %s")
        params.append(date.fromisoformat(date_to))

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    with get_snowflake_connection() as conn:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT DATE, PLATFORM, "POST LINK", "COMMENT TEXT", SENTIMENT, "KEYWORD TAG", "KEYWORD TYPE"
            FROM COMMENT_DATA {where_clause} ORDER BY DATE ASC
        """, params)
        rows = cur.fetchall()

    result = [
        {"Date": r[0], "Platform": r[1], "Post Link": r[2], "Comment Text": r[3],
         "Sentiment": r[4], "Keyword Tag": r[5], "Keyword Type": r[6]}
        for r in rows
    ]
    _cache[cache_key] = {"data": result, "ts": now}
    return result
