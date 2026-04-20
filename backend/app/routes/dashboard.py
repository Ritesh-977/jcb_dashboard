from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import date
from app.db import get_pool
from app.middleware import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/posts")
async def get_posts(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    _user: dict = Depends(get_current_user),
):
    pool = await get_pool()
    conditions = []
    params = []
    if date_from:
        params.append(date_from)
        conditions.append(f'"Date" >= ${len(params)}')
    if date_to:
        params.append(date_to)
        conditions.append(f'"Date" <= ${len(params)}')
    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    rows = await pool.fetch(f"""
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
    """, *params)
    return [dict(row) for row in rows]


@router.get("/kpi")
async def get_kpi(_user: dict = Depends(get_current_user)):
    pool = await get_pool()
    rows = await pool.fetch("""
        SELECT "Metric", "Value"
        FROM kpi_summary
    """)
    return [dict(row) for row in rows]


@router.get("/sentiment")
async def get_sentiment(_user: dict = Depends(get_current_user)):
    pool = await get_pool()
    rows = await pool.fetch("""
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
    return [dict(row) for row in rows]
