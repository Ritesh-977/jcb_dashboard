from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import date
from app.db import get_snowflake_connection
from app.middleware import get_current_user

router = APIRouter(prefix="/comments", tags=["comments"])


@router.get("/")
def get_comments(
    platform: Optional[str] = Query(None),
    sentiment: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    _user: dict = Depends(get_current_user),
):
    conditions = []
    params = []

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

    conn = get_snowflake_connection()
    try:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT
                DATE,
                PLATFORM,
                "POST LINK",
                "COMMENT TEXT",
                SENTIMENT,
                "KEYWORD TAG",
                "KEYWORD TYPE"
            FROM COMMENT_DATA
            {where_clause}
            ORDER BY DATE ASC
        """, params)
        rows = cur.fetchall()
        return [
            {
                "Date": r[0],
                "Platform": r[1],
                "Post Link": r[2],
                "Comment Text": r[3],
                "Sentiment": r[4],
                "Keyword Tag": r[5],
                "Keyword Type": r[6],
            }
            for r in rows
        ]
    finally:
        conn.close()
