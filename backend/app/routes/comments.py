from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import date
import time
from app.db import get_snowflake_connection
from app.middleware import get_current_user

router = APIRouter(prefix="/comments", tags=["comments"])

_cache = {}
CACHE_TTL = 300  # 5 minutes


@router.get("/posts")
def get_posts(
    platform: Optional[str] = Query(None),
    market: Optional[str] = Query(None),
    campaign: Optional[str] = Query(None),
    _user: dict = Depends(get_current_user),
):
    cache_key = f"posts:{platform}:{market}:{campaign}"
    now = time.time()
    if cache_key in _cache and now - _cache[cache_key]["ts"] < CACHE_TTL:
        return _cache[cache_key]["data"]

    conditions, params = [], []
    
    # Build WHERE clause based on whether we need to join with posts table
    if campaign:
        # Need to join with posts to filter by campaign
        if platform:
            conditions.append("c.platform = %s")
            params.append(platform)
        if market:
            conditions.append("c.market_code = %s")
            params.append(market)
        conditions.append("p.campaign_id = %s")
        params.append(campaign)
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        with get_snowflake_connection() as conn:
            cur = conn.cursor()
            cur.execute(f"""
                SELECT DISTINCT c.post_id, c.post_link, c.platform
                FROM comments c
                INNER JOIN posts p ON c.post_id = p.id 
                    AND c.market_code = p.market_code
                {where_clause}
                ORDER BY c.post_id DESC
            """, params)
            rows = cur.fetchall()
    else:
        # No campaign filter, simpler query
        if platform:
            conditions.append("platform = %s")
            params.append(platform)
        if market:
            conditions.append("market_code = %s")
            params.append(market)
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        with get_snowflake_connection() as conn:
            cur = conn.cursor()
            cur.execute(f"""
                SELECT DISTINCT post_id, post_link, platform
                FROM comments
                {where_clause}
                ORDER BY post_id DESC
            """, params)
            rows = cur.fetchall()

    result = [{"post_id": r[0], "post_link": r[1] or r[0], "platform": r[2]} for r in rows]
    _cache[cache_key] = {"data": result, "ts": now}
    return result


@router.get("/")
def get_comments(
    platform: Optional[str] = Query(None),
    sentiment: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    market: Optional[str] = Query(None),
    campaign: Optional[str] = Query(None),
    post_id: Optional[str] = Query(None),
    _user: dict = Depends(get_current_user),
):
    cache_key = f"comments:{platform}:{sentiment}:{date_from}:{date_to}:{market}:{campaign}:{post_id}"
    now = time.time()
    if cache_key in _cache and now - _cache[cache_key]["ts"] < CACHE_TTL:
        return _cache[cache_key]["data"]

    conditions, params = [], []
    
    # Build WHERE clause based on whether we need to join with posts table
    if campaign:
        # Need to join with posts to filter by campaign
        if platform:
            conditions.append("c.platform = %s")
            params.append(platform)
        if sentiment:
            conditions.append("c.sentiment = %s")
            params.append(sentiment)
        if date_from:
            conditions.append("c.comment_date >= %s")
            params.append(date.fromisoformat(date_from))
        if date_to:
            conditions.append("c.comment_date <= %s")
            params.append(date.fromisoformat(date_to))
        if market:
            conditions.append("c.market_code = %s")
            params.append(market)
        conditions.append("p.campaign_id = %s")
        params.append(campaign)
        if post_id:
            conditions.append("c.post_id = %s")
            params.append(post_id)

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        with get_snowflake_connection() as conn:
            cur = conn.cursor()
            cur.execute(f"""
                SELECT c.comment_date, c.platform, c.post_id, c.comment_text,
                       c.sentiment, c.keyword_tag, c.keyword_type, c.post_link
                FROM comments c
                INNER JOIN posts p ON c.post_id = p.id 
                    AND c.market_code = p.market_code
                {where_clause}
                ORDER BY c.comment_date ASC
            """, params)
            rows = cur.fetchall()
    else:
        # No campaign filter, simpler query
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
        if post_id:
            conditions.append("post_id = %s")
            params.append(post_id)

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        with get_snowflake_connection() as conn:
            cur = conn.cursor()
            cur.execute(f"""
                SELECT comment_date, platform, post_id, comment_text,
                       sentiment, keyword_tag, keyword_type, post_link
                FROM comments
                {where_clause}
                ORDER BY comment_date ASC
            """, params)
            rows = cur.fetchall()

    result = [
        {
            "Date": r[0], "Platform": r[1], "Post Link": r[7] or r[2],
            "Comment Text": r[3], "Sentiment": r[4],
            "Keyword Tag": r[5], "Keyword Type": r[6],
        }
        for r in rows
    ]
    _cache[cache_key] = {"data": result, "ts": now}
    return result

