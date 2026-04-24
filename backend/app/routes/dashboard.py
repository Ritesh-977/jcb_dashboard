from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import date
from app.db import get_snowflake_connection
from app.middleware import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/posts")
def get_posts(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    _user: dict = Depends(get_current_user),
):
    conditions = []
    params = []
    if date_from:
        conditions.append("DATE >= %s")
        params.append(date_from)
    if date_to:
        conditions.append("DATE <= %s")
        params.append(date_to)
    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    conn = get_snowflake_connection()
    try:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT
                DATE,
                PLATFORM,
                "POST LINK",
                LIKES,
                "COMMENTS COUNT",
                SHARES,
                "TOTAL ENGAGEMENT"
            FROM POST_DATA
            {where}
            ORDER BY DATE ASC
        """, params)
        rows = cur.fetchall()
        return [
            {
                "Date": r[0],
                "Platform": r[1],
                "Post Link": r[2],
                "Likes": r[3],
                "Comments Count": r[4],
                "Shares": r[5],
                "Total Engagement": r[6],
            }
            for r in rows
        ]
    finally:
        conn.close()


@router.get("/kpi")
def get_kpi(_user: dict = Depends(get_current_user)):
    conn = get_snowflake_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT METRIC, VALUE FROM KPI_SUMMARY")
        rows = cur.fetchall()
        return [{"Metric": r[0], "Value": r[1]} for r in rows]
    finally:
        conn.close()


@router.get("/sentiment")
def get_sentiment(_user: dict = Depends(get_current_user)):
    conn = get_snowflake_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT
                PLATFORM,
                POSITIVE,
                NEUTRAL,
                NEGATIVE,
                TOTAL,
                "% POSITIVE",
                "% NEUTRAL",
                "% NEGATIVE"
            FROM OVERALL_SENTIMENT
        """)
        rows = cur.fetchall()
        return [
            {
                "Platform": r[0],
                "Positive": r[1],
                "Neutral": r[2],
                "Negative": r[3],
                "Total": r[4],
                "% Positive": r[5],
                "% Neutral": r[6],
                "% Negative": r[7],
            }
            for r in rows
        ]
    finally:
        conn.close()
