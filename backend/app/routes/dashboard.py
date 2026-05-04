from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import date
import time
from app.db import get_snowflake_connection
from app.middleware import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# --- In-memory cache ---
_cache = {}
CACHE_TTL = 120  # 2 minutes


def _cache_key(prefix, *args):
    return f"{prefix}:{':'.join(str(a) for a in args)}"


def _cached(key):
    if key in _cache and time.time() - _cache[key]["ts"] < CACHE_TTL:
        return _cache[key]["data"]
    return None


def _store(key, data):
    _cache[key] = {"data": data, "ts": time.time()}
    return data


def _build_where(market, date_from, date_to, table_alias="", date_col="publish_date"):
    conditions, params = [], []
    prefix = f"{table_alias}." if table_alias else ""
    if market:
        conditions.append(f"{prefix}market_code = %s")
        params.append(market)
    if date_from:
        conditions.append(f"{prefix}{date_col} >= %s")
        params.append(date_from)
    if date_to:
        conditions.append(f"{prefix}{date_col} <= %s")
        params.append(date_to)
    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    return where, params


# --- Markets (cached heavily — rarely changes) ---

_markets_cache = {"data": None, "ts": 0}
MARKETS_TTL = 600  # 10 minutes


@router.get("/markets")
def get_markets(_user: dict = Depends(get_current_user)):
    """Return all available markets with code and display name."""
    now = time.time()
    if _markets_cache["data"] is not None and now - _markets_cache["ts"] < MARKETS_TTL:
        return _markets_cache["data"]

    with get_snowflake_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT market_code, market_name FROM markets ORDER BY market_code")
        rows = cur.fetchall()
    result = [{"code": r[0], "name": r[1]} for r in rows]
    _markets_cache["data"] = result
    _markets_cache["ts"] = now
    return result


# --- Consolidated /all endpoint (single Snowflake round-trip) ---

@router.get("/all")
def get_all_dashboard(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    market: Optional[str] = Query(None),
    _user: dict = Depends(get_current_user),
):
    """
    Single endpoint that returns posts, KPIs, sentiment, and metrics
    in ONE Snowflake connection with batched queries.
    """
    ck = _cache_key("all", market, date_from, date_to)
    hit = _cached(ck)
    if hit:
        return hit

    post_where, post_params = _build_where(market, date_from, date_to, "p")
    agg_where, agg_params = _build_where(market, date_from, date_to)
    sent_where, sent_params = _build_where(market, None, None)  # sentiment = no date filter
    c_where, c_params = _build_where(market, date_from, date_to, date_col="comment_date")

    with get_snowflake_connection() as conn:
        cur = conn.cursor()

        # 1. Posts
        cur.execute(f"""
            SELECT p.publish_date, p.platform, p.link, p.likes,
                   p.comments_count, p.shares, p.total_engagement,
                   p.sentiment, p.market_code, p.source_name,
                   p.content, p.title, c.campaign_name
            FROM posts p
            LEFT JOIN campaigns c ON p.campaign_id = c.id
            {post_where}
            ORDER BY p.publish_date ASC
        """, post_params)
        post_rows = cur.fetchall()

        # 2. Aggregates — post-level + comment-level in one go
        cur.execute(f"""
            SELECT
                COALESCE(SUM(likes), 0),
                COALESCE(SUM(total_engagement), 0),
                COUNT_IF(UPPER(sentiment) = 'POSITIVE'),
                COUNT_IF(UPPER(sentiment) = 'NEGATIVE'),
                COUNT_IF(UPPER(sentiment) = 'NEUTRAL'),
                COUNT(*)
            FROM posts {agg_where}
        """, agg_params)
        total_likes, total_eng, p_pos, p_neg, p_neu, p_total = cur.fetchone()

        # 3. Comment-level KPIs
        cur.execute(f"""
            SELECT
                COUNT(*),
                COUNT_IF(UPPER(sentiment) = 'POSITIVE'),
                COUNT_IF(UPPER(sentiment) = 'NEGATIVE'),
                COUNT_IF(UPPER(sentiment) = 'NEUTRAL')
            FROM comments {c_where}
        """, c_params)
        c_total, c_pos, c_neg, c_neu = cur.fetchone()

        # 4. Sentiment by platform
        cur.execute(f"""
            SELECT platform,
                COUNT_IF(UPPER(sentiment) = 'POSITIVE'),
                COUNT_IF(UPPER(sentiment) = 'NEUTRAL'),
                COUNT_IF(UPPER(sentiment) = 'NEGATIVE'),
                COUNT(*),
                ROUND(COUNT_IF(UPPER(sentiment) = 'POSITIVE') / NULLIF(COUNT(*), 0) * 100, 2),
                ROUND(COUNT_IF(UPPER(sentiment) = 'NEUTRAL')  / NULLIF(COUNT(*), 0) * 100, 2),
                ROUND(COUNT_IF(UPPER(sentiment) = 'NEGATIVE') / NULLIF(COUNT(*), 0) * 100, 2)
            FROM posts {sent_where}
            GROUP BY platform
        """, sent_params)
        sent_rows = cur.fetchall()

    # Build response
    posts = [
        {
            "Date": r[0], "Platform": r[1], "Post Link": r[2], "Likes": r[3],
            "Comments Count": r[4], "Shares": r[5], "Total Engagement": r[6],
            "Post Sentiment": r[7], "Market": r[8], "Source": r[9],
            "Post Content": r[10], "Title": r[11], "Campaign Name": r[12],
        }
        for r in post_rows
    ]

    c_sent_total = (c_pos or 0) + (c_neg or 0) + (c_neu or 0)
    net_pct = ((c_pos or 0) - (c_neg or 0)) / c_sent_total if c_sent_total else 0
    pos_pct = (c_pos or 0) / c_sent_total if c_sent_total else 0
    neg_pct = (c_neg or 0) / c_sent_total if c_sent_total else 0

    kpi = [
        {"Metric": "Total Comments", "Value": c_total or 0},
        {"Metric": "Positive Comments", "Value": c_pos or 0},
        {"Metric": "Negative Comments", "Value": c_neg or 0},
        {"Metric": "Neutral Comments", "Value": c_neu or 0},
        {"Metric": "Total Likes", "Value": total_likes or 0},
        {"Metric": "Net Sentiment %", "Value": round(net_pct, 9)},
        {"Metric": "Positive %", "Value": round(pos_pct, 9)},
        {"Metric": "Negative %", "Value": round(neg_pct, 9)},
    ]

    sentiment = [
        {"Platform": r[0], "Positive": r[1], "Neutral": r[2], "Negative": r[3],
         "Total": r[4], "% Positive": r[5], "% Neutral": r[6], "% Negative": r[7]}
        for r in sent_rows
    ]

    p_sent_total = (p_pos or 0) + (p_neg or 0) + (p_neu or 0)
    metrics = {
        "total_engagement": total_eng or 0,
        "total_positive": p_pos or 0,
        "total_negative": p_neg or 0,
        "total_neutral": p_neu or 0,
        "positive_pct": round(p_pos / p_sent_total * 100, 2) if p_sent_total else 0,
        "negative_pct": round(p_neg / p_sent_total * 100, 2) if p_sent_total else 0,
        "neutral_pct": round(p_neu / p_sent_total * 100, 2) if p_sent_total else 0,
    }

    result = {"posts": posts, "kpi": kpi, "sentiment": sentiment, "metrics": metrics}
    return _store(ck, result)


# --- Individual endpoints (for direct calls, also cached) ---

@router.get("/posts")
def get_posts(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    market: Optional[str] = Query(None),
    _user: dict = Depends(get_current_user),
):
    ck = _cache_key("posts", market, date_from, date_to)
    hit = _cached(ck)
    if hit:
        return hit

    where, params = _build_where(market, date_from, date_to, "p")
    with get_snowflake_connection() as conn:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT p.publish_date, p.platform, p.link, p.likes,
                   p.comments_count, p.shares, p.total_engagement,
                   p.sentiment, p.market_code, p.source_name,
                   p.content, p.title, c.campaign_name
            FROM posts p
            LEFT JOIN campaigns c ON p.campaign_id = c.id
            {where}
            ORDER BY p.publish_date ASC
        """, params)
        rows = cur.fetchall()
    result = [
        {
            "Date": r[0], "Platform": r[1], "Post Link": r[2], "Likes": r[3],
            "Comments Count": r[4], "Shares": r[5], "Total Engagement": r[6],
            "Post Sentiment": r[7], "Market": r[8], "Source": r[9],
            "Post Content": r[10], "Title": r[11], "Campaign Name": r[12],
        }
        for r in rows
    ]
    return _store(ck, result)


@router.get("/kpi")
def get_kpi(
    market: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    _user: dict = Depends(get_current_user),
):
    ck = _cache_key("kpi", market, date_from, date_to)
    hit = _cached(ck)
    if hit:
        return hit

    where, params = _build_where(market, date_from, date_to)
    c_where, c_params = _build_where(market, date_from, date_to, date_col="comment_date")

    with get_snowflake_connection() as conn:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT COALESCE(SUM(likes), 0), COALESCE(SUM(total_engagement), 0)
            FROM posts {where}
        """, params)
        total_likes, total_engagement = cur.fetchone()

        cur.execute(f"""
            SELECT COUNT(*),
                COUNT_IF(UPPER(sentiment) = 'POSITIVE'),
                COUNT_IF(UPPER(sentiment) = 'NEGATIVE'),
                COUNT_IF(UPPER(sentiment) = 'NEUTRAL')
            FROM comments {c_where}
        """, c_params)
        total_comments, positive, negative, neutral = cur.fetchone()

    total_sent = (positive or 0) + (negative or 0) + (neutral or 0)
    net_pct = ((positive or 0) - (negative or 0)) / total_sent if total_sent else 0
    pos_pct = (positive or 0) / total_sent if total_sent else 0
    neg_pct = (negative or 0) / total_sent if total_sent else 0

    result = [
        {"Metric": "Total Comments", "Value": total_comments or 0},
        {"Metric": "Positive Comments", "Value": positive or 0},
        {"Metric": "Negative Comments", "Value": negative or 0},
        {"Metric": "Neutral Comments", "Value": neutral or 0},
        {"Metric": "Total Likes", "Value": total_likes or 0},
        {"Metric": "Net Sentiment %", "Value": round(net_pct, 9)},
        {"Metric": "Positive %", "Value": round(pos_pct, 9)},
        {"Metric": "Negative %", "Value": round(neg_pct, 9)},
    ]
    return _store(ck, result)


@router.get("/sentiment")
def get_sentiment(
    market: Optional[str] = Query(None),
    _user: dict = Depends(get_current_user),
):
    ck = _cache_key("sentiment", market)
    hit = _cached(ck)
    if hit:
        return hit

    where, params = _build_where(market, None, None)
    with get_snowflake_connection() as conn:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT platform,
                COUNT_IF(UPPER(sentiment) = 'POSITIVE'),
                COUNT_IF(UPPER(sentiment) = 'NEUTRAL'),
                COUNT_IF(UPPER(sentiment) = 'NEGATIVE'),
                COUNT(*),
                ROUND(COUNT_IF(UPPER(sentiment) = 'POSITIVE') / NULLIF(COUNT(*), 0) * 100, 2),
                ROUND(COUNT_IF(UPPER(sentiment) = 'NEUTRAL')  / NULLIF(COUNT(*), 0) * 100, 2),
                ROUND(COUNT_IF(UPPER(sentiment) = 'NEGATIVE') / NULLIF(COUNT(*), 0) * 100, 2)
            FROM posts {where}
            GROUP BY platform
        """, params)
        rows = cur.fetchall()
    result = [
        {"Platform": r[0], "Positive": r[1], "Neutral": r[2], "Negative": r[3],
         "Total": r[4], "% Positive": r[5], "% Neutral": r[6], "% Negative": r[7]}
        for r in rows
    ]
    return _store(ck, result)


@router.get("/metrics")
def get_metrics(
    market: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    _user: dict = Depends(get_current_user),
):
    ck = _cache_key("metrics", market, date_from, date_to)
    hit = _cached(ck)
    if hit:
        return hit

    where, params = _build_where(market, date_from, date_to)
    with get_snowflake_connection() as conn:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT
                COALESCE(SUM(total_engagement), 0),
                COUNT_IF(UPPER(sentiment) = 'POSITIVE'),
                COUNT_IF(UPPER(sentiment) = 'NEGATIVE'),
                COUNT_IF(UPPER(sentiment) = 'NEUTRAL')
            FROM posts {where}
        """, params)
        total_eng, pos, neg, neu = cur.fetchone()

    total_sent = (pos or 0) + (neg or 0) + (neu or 0)
    result = {
        "total_engagement": total_eng or 0,
        "total_positive": pos or 0,
        "total_negative": neg or 0,
        "total_neutral": neu or 0,
        "positive_pct": round(pos / total_sent * 100, 2) if total_sent else 0,
        "negative_pct": round(neg / total_sent * 100, 2) if total_sent else 0,
        "neutral_pct": round(neu / total_sent * 100, 2) if total_sent else 0,
    }
    return _store(ck, result)
