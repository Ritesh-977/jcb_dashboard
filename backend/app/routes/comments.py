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
        conditions.append('"Platform" = %s')
        params.append(platform)
    if sentiment:
        conditions.append('"Sentiment" = %s')
        params.append(sentiment)
    if date_from:
        conditions.append('"Date" >= %s')
        params.append(date.fromisoformat(date_from))
    if date_to:
        conditions.append('"Date" <= %s')
        params.append(date.fromisoformat(date_to))

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    query = f"""
        SELECT
            "Date",
            "Platform",
            "Post Link",
            "Comment Text",
            "Sentiment",
            "Keyword Tag",
            "Keyword Type"
        FROM comment_data
        {where_clause}
        ORDER BY "Date" ASC
    """

    conn = get_snowflake_connection()
    try:
        cur = conn.cursor()
        cur.execute(query, params)
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, row)) for row in cur.fetchall()]
    finally:
        conn.close()
