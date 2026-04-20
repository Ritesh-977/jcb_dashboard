from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.db import get_pool
from app.middleware import get_current_user

router = APIRouter(prefix="/comments", tags=["comments"])


@router.get("/")
async def get_comments(
    platform: Optional[str] = Query(None, description="Filter by Platform (Facebook or Instagram)"),
    sentiment: Optional[str] = Query(None, description="Filter by Sentiment (Positive, Neutral, Negative)"),
    _user: dict = Depends(get_current_user),
):
    pool = await get_pool()

    conditions = []
    params = []

    if platform:
        params.append(platform)
        conditions.append(f'"Platform" = ${len(params)}')

    if sentiment:
        params.append(sentiment)
        conditions.append(f'"Sentiment" = ${len(params)}')

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

    rows = await pool.fetch(query, *params)
    return [dict(row) for row in rows]
