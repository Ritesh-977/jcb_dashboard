"""
AI-Generated Campaign Insights via Snowflake Cortex.
Calls SNOWFLAKE.CORTEX.COMPLETE to produce professional campaign analysis.
"""

import json
import time
import traceback
from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import date
from app.db import get_snowflake_connection
from app.middleware import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# --- Cortex-specific cache (longer TTL — LLM calls are expensive) ---
_insights_cache = {}
INSIGHTS_TTL = 604800  # 7 days


def _insights_cache_key(*args):
    return f"insights:{':'.join(str(a) for a in args)}"


CORTEX_SYSTEM_PROMPT = """You are a senior social-media analytics strategist writing a campaign report for a CMO.

You will receive a JSON object with pre-calculated campaign metrics. Your job is to write 3 short insights.

CRITICAL DATA ACCURACY RULES:
- You MUST use ONLY the exact numbers provided in the input JSON. Do NOT calculate, round, estimate, or invent any number.
- Copy the numbers exactly as given. For example, if like_ratio_pct is 92.4, write "92.4%" — not "92%", not "~92%", not "over 90%".
- If total_likes is 11079, write "11,079" — use comma formatting for numbers over 999.
- Wrap every cited number in **double asterisks** for bolding.

OUTPUT RULES:
- Output ONLY valid JSON. No markdown fences, no commentary, no extra text.
- Each insight has: "title" (3-5 words), "description" (2-3 sentences, under 40 words, cite exact numbers), "sentiment" ("positive", "neutral", or "negative").

OUTPUT SCHEMA:
{
  "passive_insight": {"title": "...", "description": "...", "sentiment": "..."},
  "sentiment_insight": {"title": "...", "description": "...", "sentiment": "..."},
  "depth_insight": {"title": "...", "description": "...", "sentiment": "..."}
}

INSIGHT DEFINITIONS:
1. passive_insight: Likes as a share of total interactions. like_ratio_pct > 70 = "Strong Passive Engagement" (positive). Otherwise = "Active Engagement" (neutral). Cite like_ratio_pct, total_likes, total_interactions.
2. sentiment_insight: Brand health. net_sentiment_pct >= 0 = "Healthy Brand Sentiment" (positive). Otherwise = "Brand Sentiment Alert" (negative). Cite net_sentiment_pct, positive_pct, negative_pct.
3. depth_insight: Conversational depth. comment_ratio_pct + share_ratio_pct < 10 = "Low Conversational Depth" (negative). Otherwise = "High Conversational Depth" (positive). Cite total_comments, comment_ratio_pct, total_shares, share_ratio_pct.

Write naturally like a human analyst. Be specific with data, never generic."""


CORTEX_MODELS = ["llama3.1-8b", "mistral-large2"]


def _build_metrics_payload(
    total_interactions, total_likes, total_comments, total_shares,
    net_sentiment_pct, positive_pct, negative_pct
):
    """Build the metrics JSON that gets sent to Cortex."""
    like_ratio = round(total_likes / total_interactions * 100, 1) if total_interactions else 0
    comment_ratio = round(total_comments / total_interactions * 100, 1) if total_interactions else 0
    share_ratio = round(total_shares / total_interactions * 100, 1) if total_interactions else 0

    return json.dumps({
        "total_interactions": total_interactions,
        "total_likes": total_likes,
        "like_ratio_pct": like_ratio,
        "total_comments": total_comments,
        "comment_ratio_pct": comment_ratio,
        "total_shares": total_shares,
        "share_ratio_pct": share_ratio,
        "net_sentiment_pct": net_sentiment_pct,
        "positive_pct": positive_pct,
        "negative_pct": negative_pct,
    })


def _build_cortex_sql(model: str, metrics_json: str) -> str:
    """Build the Cortex COMPLETE SQL statement."""
    # Escape single quotes in prompts for SQL safety
    system = CORTEX_SYSTEM_PROMPT.replace("'", "''")
    user_msg = metrics_json.replace("'", "''")

    return f"""
    SELECT SNOWFLAKE.CORTEX.COMPLETE(
        '{model}',
        [
            {{'role': 'system', 'content': '{system}'}},
            {{'role': 'user',   'content': '{user_msg}'}}
        ],
        {{'temperature': 0.3, 'max_tokens': 600}}
    ) AS insight;
    """


def _parse_cortex_response(raw_response: str) -> dict:
    """
    Parse the Cortex COMPLETE response.
    Cortex returns a JSON string with a 'choices' array.
    """
    try:
        # Cortex wraps the response in a JSON envelope
        envelope = json.loads(raw_response) if isinstance(raw_response, str) else raw_response

        # Extract the actual content from Cortex response structure
        if isinstance(envelope, dict) and "choices" in envelope:
            content = envelope["choices"][0]["messages"]
        elif isinstance(envelope, dict) and "messages" in envelope:
            content = envelope["messages"]
        elif isinstance(envelope, str):
            content = envelope
        else:
            content = str(envelope)

        # Clean any markdown fencing the LLM might have added
        content = content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

        insights = json.loads(content)

        # Validate structure
        required_keys = ["passive_insight", "sentiment_insight", "depth_insight"]
        for key in required_keys:
            if key not in insights:
                raise ValueError(f"Missing key: {key}")
            for field in ["title", "description", "sentiment"]:
                if field not in insights[key]:
                    raise ValueError(f"Missing field '{field}' in '{key}'")

        return insights
    except Exception as e:
        raise ValueError(f"Failed to parse Cortex response: {e}")


def _build_where(market, date_from, date_to, campaign=None):
    """Build WHERE clause for aggregation queries."""
    conditions, params = [], []
    if market:
        conditions.append("market_code = %s")
        params.append(market)
    if date_from:
        conditions.append("publish_date >= %s")
        params.append(date_from)
    if date_to:
        conditions.append("publish_date <= %s")
        params.append(date_to)
    if campaign:
        conditions.append("campaign_id = %s")
        params.append(campaign)
    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    return where, params


@router.get("/insights")
def get_campaign_insights(
    market: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    campaign: Optional[str] = Query(None),
    _user: dict = Depends(get_current_user),
):
    """
    Generate AI-powered campaign insights using Snowflake Cortex.
    Falls back with an error message if Cortex is unavailable.
    """
    # Check cache
    ck = _insights_cache_key(market, date_from, date_to, campaign)
    now = time.time()
    if ck in _insights_cache and now - _insights_cache[ck]["ts"] < INSIGHTS_TTL:
        return _insights_cache[ck]["data"]

    with get_snowflake_connection() as conn:
        cur = conn.cursor()

        # Step 1: Aggregate raw metrics from posts
        post_where, post_params = _build_where(market, date_from, date_to, campaign)
        cur.execute(f"""
            SELECT
                COALESCE(SUM(total_engagement), 0),
                COALESCE(SUM(likes), 0),
                COALESCE(SUM(comments_count), 0),
                COALESCE(SUM(shares), 0)
            FROM posts {post_where}
        """, post_params)
        total_interactions, total_likes, total_comments, total_shares = cur.fetchone()

        # Step 2: Comment-level sentiment
        if campaign:
            c_conditions, c_params = [], []
            if market:
                c_conditions.append("c.market_code = %s")
                c_params.append(market)
            if date_from:
                c_conditions.append("c.comment_date >= %s")
                c_params.append(date_from)
            if date_to:
                c_conditions.append("c.comment_date <= %s")
                c_params.append(date_to)
            c_conditions.append("p.campaign_id = %s")
            c_params.append(campaign)
            c_where = f"WHERE {' AND '.join(c_conditions)}" if c_conditions else ""
            cur.execute(f"""
                SELECT
                    COUNT(*),
                    COUNT_IF(UPPER(c.sentiment) = 'POSITIVE'),
                    COUNT_IF(UPPER(c.sentiment) = 'NEGATIVE'),
                    COUNT_IF(UPPER(c.sentiment) = 'NEUTRAL')
                FROM comments c
                INNER JOIN posts p ON c.post_id = p.id AND c.market_code = p.market_code
                {c_where}
            """, c_params)
        else:
            c_where_conditions, c_params = [], []
            if market:
                c_where_conditions.append("market_code = %s")
                c_params.append(market)
            if date_from:
                c_where_conditions.append("comment_date >= %s")
                c_params.append(date_from)
            if date_to:
                c_where_conditions.append("comment_date <= %s")
                c_params.append(date_to)
            c_where = f"WHERE {' AND '.join(c_where_conditions)}" if c_where_conditions else ""
            cur.execute(f"""
                SELECT
                    COUNT(*),
                    COUNT_IF(UPPER(sentiment) = 'POSITIVE'),
                    COUNT_IF(UPPER(sentiment) = 'NEGATIVE'),
                    COUNT_IF(UPPER(sentiment) = 'NEUTRAL')
                FROM comments {c_where}
            """, c_params)

        c_total, c_pos, c_neg, c_neu = cur.fetchone()
        c_sent_total = (c_pos or 0) + (c_neg or 0) + (c_neu or 0)
        net_sentiment_pct = round(((c_pos or 0) - (c_neg or 0)) / c_sent_total * 100) if c_sent_total else 0
        positive_pct = round((c_pos or 0) / c_sent_total * 100) if c_sent_total else 0
        negative_pct = round((c_neg or 0) / c_sent_total * 100) if c_sent_total else 0

        # Step 3: Build metrics payload and call Cortex
        metrics_json = _build_metrics_payload(
            total_interactions, total_likes, total_comments, total_shares,
            net_sentiment_pct, positive_pct, negative_pct
        )

        last_error = None
        for model in CORTEX_MODELS:
            try:
                cortex_sql = _build_cortex_sql(model, metrics_json)
                cur.execute(cortex_sql)
                raw = cur.fetchone()[0]
                insights = _parse_cortex_response(raw)

                result = {
                    "source": "cortex",
                    "model": model,
                    "insights": insights,
                    "metrics": {
                        "total_interactions": total_interactions,
                        "total_likes": total_likes,
                        "total_comments": total_comments,
                        "total_shares": total_shares,
                        "net_sentiment_pct": net_sentiment_pct,
                        "positive_pct": positive_pct,
                        "negative_pct": negative_pct,
                    }
                }

                # Cache successful result
                _insights_cache[ck] = {"data": result, "ts": time.time()}
                return result

            except Exception as e:
                last_error = str(e)
                print(f"Cortex model '{model}' failed: {e}")
                traceback.print_exc()
                continue

    # All models failed — return error payload (frontend falls back to hardcoded logic)
    return {
        "source": "error",
        "error": f"Cortex unavailable: {last_error}",
        "metrics": {
            "total_interactions": total_interactions,
            "total_likes": total_likes,
            "total_comments": total_comments,
            "total_shares": total_shares,
            "net_sentiment_pct": net_sentiment_pct,
            "positive_pct": positive_pct,
            "negative_pct": negative_pct,
        }
    }
