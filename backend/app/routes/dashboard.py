from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import date
from app.db import get_snowflake_connection
from app.middleware import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _rows_to_dicts(cur):
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]


@router.get("/posts")
def get_posts(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    _user: dict = Depends(get_current_user),
):
    conditions = []
    params = []
    if date_from:
        conditions.append('"Date" >= %s')
        params.append(date_from)
    if date_to:
        conditions.append('"Date" <= %s')
        params.append(date_to)
    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    conn = get_snowflake_connection()
    try:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT
                "Date",
                "Platform",
                "Post Link",
                "Likes",
                "Comments Count",
                "Shares",
                "Total Engagement"
            FROM post_data
            {where}
            ORDER BY "Date" ASC
        """, params)
        return _rows_to_dicts(cur)
    finally:
        conn.close()


@router.get("/kpi")
def get_kpi(_user: dict = Depends(get_current_user)):
    conn = get_snowflake_connection()
    try:
        cur = conn.cursor()
        cur.execute('SELECT "Metric", "Value" FROM kpi_summary')
        return _rows_to_dicts(cur)
    finally:
        conn.close()


@router.get("/sentiment")
def get_sentiment(_user: dict = Depends(get_current_user)):
    conn = get_snowflake_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT
                "Platform",
                "Positive",
                "Neutral",
                "Negative",
                "Total",
                "% Positive",
                "% Neutral",
                "% Negative"
            FROM overall_sentiment
        """)
        return _rows_to_dicts(cur)
    finally:
        conn.close()
