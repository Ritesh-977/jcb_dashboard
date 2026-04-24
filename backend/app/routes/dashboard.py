from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import date
import time
from app.db import get_snowflake_connection
from app.middleware import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

_cache = {}
CACHE_TTL = 300  # 5 minutes

def _cached(key, fn):
    now = time.time()
    if key in _cache and now - _cache[key]["ts"] < CACHE_TTL:
        return _cache[key]["data"]
    result = fn()
    _cache[key] = {"data": result, "ts": now}
    return result


@router.get("/posts")
def get_posts(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    _user: dict = Depends(get_current_user),
):
    cache_key = f"posts:{date_from}:{date_to}"

    def fetch():
        conditions, params = [], []
        if date_from:
            conditions.append("DATE >= %s")
            params.append(date_from)
        if date_to:
            conditions.append("DATE <= %s")
            params.append(date_to)
        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        with get_snowflake_connection() as conn:
            cur = conn.cursor()
            cur.execute(f"""
                SELECT DATE, PLATFORM, "POST LINK", LIKES, "COMMENTS COUNT", SHARES, "TOTAL ENGAGEMENT"
                FROM POST_DATA {where} ORDER BY DATE ASC
            """, params)
            rows = cur.fetchall()
        return [
            {"Date": r[0], "Platform": r[1], "Post Link": r[2], "Likes": r[3],
             "Comments Count": r[4], "Shares": r[5], "Total Engagement": r[6]}
            for r in rows
        ]

    return _cached(cache_key, fetch)


@router.get("/kpi")
def get_kpi(_user: dict = Depends(get_current_user)):
    def fetch():
        with get_snowflake_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT METRIC, VALUE FROM KPI_SUMMARY")
            rows = cur.fetchall()
        return [{"Metric": r[0], "Value": r[1]} for r in rows]

    return _cached("kpi", fetch)


@router.get("/sentiment")
def get_sentiment(_user: dict = Depends(get_current_user)):
    def fetch():
        with get_snowflake_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT PLATFORM, POSITIVE, NEUTRAL, NEGATIVE, TOTAL,
                       "% POSITIVE", "% NEUTRAL", "% NEGATIVE"
                FROM OVERALL_SENTIMENT
            """)
            rows = cur.fetchall()
        return [
            {"Platform": r[0], "Positive": r[1], "Neutral": r[2], "Negative": r[3],
             "Total": r[4], "% Positive": r[5], "% Neutral": r[6], "% Negative": r[7]}
            for r in rows
        ]

    return _cached("sentiment", fetch)


@router.get("/all")
def get_all_dashboard(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    _user: dict = Depends(get_current_user),
):
    """Single endpoint to fetch posts + kpi + sentiment in one round-trip."""
    return {
        "posts": get_posts(date_from, date_to, _user),
        "kpi": get_kpi(_user),
        "sentiment": get_sentiment(_user),
    }
