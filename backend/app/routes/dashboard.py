from fastapi import APIRouter, Depends
from app.db import get_pool
from app.middleware import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/posts")
async def get_posts(_user: dict = Depends(get_current_user)):
    pool = await get_pool()
    rows = await pool.fetch("""
        SELECT
            "Date",
            "Platform",
            "Post Link",
            "Likes",
            "Comments Count",
            "Shares",
            "Total Engagement"
        FROM post_data
        ORDER BY "Date" ASC
    """)
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
