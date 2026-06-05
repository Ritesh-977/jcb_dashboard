"""
csv_processor.py — Dynamic CSV Column Detection & Multi-Table Processing Service

This module is the brain of the resilient CSV upload system. It:
1. Normalizes heterogeneous CSV headers to canonical DB field names
2. Detects which data categories (Posts, KPIs, Comments) are present
3. Routes each row to the correct table(s) using upsert/append logic
4. Gracefully handles missing columns by defaulting to None/0

Design:
  - Header "fingerprinting" — each category has signature columns.
    If ≥2 signatures match, that category is activated.
  - Fuzzy matching — headers are lowercased, stripped, and underscored
    so "Publish Date" ≈ "publish_date" ≈ "  Publish date  ".
  - Consolidated CSVs that span multiple categories route to ALL
    matching tables in a single pass.
"""

import re
from datetime import datetime
from typing import Optional


# ─── Header Normalization ──────────────────────────────────────────────────────
# Maps common CSV header variations → canonical DB field name.
# Keys are normalized (lowercase, trimmed, spaces→underscores).

HEADER_ALIASES = {
    # Post fields
    "title":                        "title",
    "detail":                       "detail",
    "content":                      "detail",
    "post_content":                 "detail",
    "link":                         "link",
    "url":                          "link",
    "post_link":                    "link",
    "post_url":                     "link",
    "source":                       "source",
    "source_name":                  "source",
    "update_date":                  "update_date",
    "updated_date":                 "update_date",
    "publish_date":                 "publish_date",
    "published_date":               "publish_date",
    "date":                         "publish_date",
    "post_date":                    "publish_date",
    "platform":                     "platform",
    "media_type":                   "media_type",
    "sentiment":                    "sentiment",
    "post_sentiment":               "sentiment",
    "likes":                        "likes",
    "comments_count":               "comments_count",
    "comment_count":                "comments_count",
    "num_comments":                 "comments_count",
    "shares":                       "shares",
    "share_count":                  "shares",
    "total_engagement":             "total_engagement",
    "engagement":                   "total_engagement",
    "interactions":                 "total_engagement",
    "audience":                     "audience",
    "reach":                        "reach",
    "tags":                         "tags",
    "language":                     "language",
    "ranking":                      "ranking",
    "notes":                        "notes",
    "country":                      "country",

    # Author fields (nested inside Post rows)
    "author_name":                  "author_name",
    "author":                       "author_name",
    "author_handle_(@username)":    "author_handle",
    "author_handle":                "author_handle",
    "handle":                       "author_handle",
    "username":                     "author_handle",
    "author_url":                   "author_url",
    "gender":                       "gender",
    "age":                          "age",
    "age_range":                    "age",
    "bio":                          "bio",
    "city":                         "city",

    # KPI fields
    "metric_name":                  "metric_name",
    "metric":                       "metric_name",
    "kpi":                          "metric_name",
    "kpi_name":                     "metric_name",
    "metric_value":                 "metric_value",
    "value":                        "metric_value",
    "kpi_value":                    "metric_value",
    "report_date":                  "report_date",

    # Comment fields
    "comment_text":                 "comment_text",
    "comment":                      "comment_text",
    "comment_body":                 "comment_text",
    "comment_content":              "comment_text",
    "comment_date":                 "comment_date",
    "comment_sentiment":            "comment_sentiment",
    "keyword_tag":                  "keyword_tag",
    "keyword":                      "keyword_tag",
    "tag":                          "keyword_tag",
    "keyword_type":                 "keyword_type",
    "keyword_category":             "keyword_type",
    "comment_platform":             "comment_platform",
    "comment_link":                 "comment_link",
    "comment_post_link":            "comment_link",
}

# ─── Category Signatures ──────────────────────────────────────────────────────
# Each category has a set of "signature" canonical field names.
# If ≥ SIGNATURE_THRESHOLD of these are found in the CSV headers,
# that category is activated for processing.

SIGNATURE_THRESHOLD = 2

CATEGORY_SIGNATURES = {
    "posts": {
        "title", "detail", "link", "source", "publish_date",
        "platform", "sentiment", "media_type", "total_engagement",
    },
    "kpis": {
        "metric_name", "metric_value", "report_date",
    },
    "comments": {
        "comment_text", "comment_date", "keyword_tag",
        "keyword_type", "comment_sentiment", "comment_platform", "comment_link",
    },
}

# KPIs only need 2 of their 3 signatures (metric_name + metric_value is enough)
CATEGORY_THRESHOLDS = {
    "posts": 2,
    "kpis": 2,
    "comments": 2,
}


# ─── Helpers ───────────────────────────────────────────────────────────────────

def _normalize_key(raw: str) -> str:
    """Normalize a raw CSV header to a lookup key: lowercase, strip, spaces→underscores."""
    return re.sub(r'\s+', '_', raw.strip().lower())


def _to_date(val) -> Optional[str]:
    """Parse various date formats to ISO string, or None."""
    if not val or str(val).strip() in ('', 'N/A', 'null', 'NULL', 'None'):
        return None
    for fmt in (
        '%d/%m/%Y %H:%M:%S', '%d/%m/%Y', '%Y-%m-%d %H:%M:%S',
        '%Y-%m-%d', '%m/%d/%Y', '%m/%d/%Y %H:%M:%S',
    ):
        try:
            return datetime.strptime(str(val).strip(), fmt).date()
        except ValueError:
            continue
    return None


def _to_int(val) -> int:
    """Safely parse a value to int; return 0 on failure."""
    try:
        return int(float(str(val).strip()))
    except (ValueError, TypeError):
        return 0


def _to_float(val) -> Optional[float]:
    """Safely parse a value to float; return None on failure."""
    try:
        return float(str(val).strip())
    except (ValueError, TypeError):
        return None


def _get(row: dict, field_map: dict, canonical: str, default=None):
    """
    Look up a canonical field name in a row using the field_map.

    field_map maps raw CSV header → canonical name.
    We reverse-lookup to find which raw header maps to our canonical name,
    then get that value from the row.
    """
    for raw_header, canon in field_map.items():
        if canon == canonical and raw_header in row:
            val = row[raw_header]
            if val is not None and str(val).strip() not in ('', 'N/A', 'null', 'NULL', 'None'):
                return val
    return default


def _normalize_platform(val) -> str:
    """Normalize platform string from values like 'facebook.com' to standard 'Facebook'."""
    if not val:
        return ""
    val_str = str(val).strip().lower()
    if 'facebook' in val_str:
        return 'Facebook'
    if 'instagram' in val_str:
        return 'Instagram'
    if 'twitter' in val_str or 'x.com' in val_str:
        return 'Twitter'
    if 'tiktok' in val_str:
        return 'TikTok'
    if 'youtube' in val_str:
        return 'YouTube'
    if 'linkedin' in val_str:
        return 'LinkedIn'
    return str(val).strip().title()


# ─── Public API ────────────────────────────────────────────────────────────────

def normalize_headers(raw_headers: list[str]) -> dict[str, str]:
    """
    Map raw CSV headers to their canonical DB field names.

    Returns a dict: { raw_header_as_in_csv: canonical_name }
    Unrecognized headers are mapped to themselves (lowercased) so they're
    preserved for debugging but won't match any category signature.
    """
    mapping = {}
    for raw in raw_headers:
        key = _normalize_key(raw)
        canonical = HEADER_ALIASES.get(key, key)
        mapping[raw] = canonical
    return mapping


def detect_categories(field_map: dict[str, str]) -> set[str]:
    """
    Determine which data categories are present based on the mapped headers.

    Returns a set like {"posts", "comments"} or {"kpis"}.
    Uses signature matching: each category has required "fingerprint" columns,
    and if enough of them are present (≥ threshold), that category is activated.
    """
    canonical_fields = set(field_map.values())
    detected = set()

    for category, signatures in CATEGORY_SIGNATURES.items():
        threshold = CATEGORY_THRESHOLDS.get(category, SIGNATURE_THRESHOLD)
        match_count = len(signatures & canonical_fields)
        if match_count >= threshold:
            detected.add(category)

    return detected


def process_posts(rows: list[dict], field_map: dict, market_code: str,
                  campaign_id: Optional[int], batch_id: str, cursor) -> int:
    """
    Insert post rows into the `posts` table and extract author data.

    - Always INSERTs (append semantics) — no duplicate checking on posts.
    - Missing columns default to None/0.
    - Returns the number of posts inserted.
    """
    if not rows:
        return 0

    post_params = []
    for row in rows:
        g = lambda field, default=None: _get(row, field_map, field, default)

        sentiment = (g("sentiment") or "").strip().capitalize()
        raw_platform = g("platform") or g("media_type") or g("source")
        platform = _normalize_platform(raw_platform)

        post_params.append((
            market_code,
            campaign_id,
            _to_date(g("publish_date")),
            _to_date(g("update_date")),
            platform,                           # platform
            g("source"),                        # source_name
            g("title"),                         # title
            g("detail"),                        # content
            g("link"),                          # link
            sentiment,
            _to_int(g("likes") or g("like")),
            _to_int(g("comments_count") or g("comments") or g("comment_text") or g("comment")),
            _to_int(g("shares") or g("share")),
            _to_int(g("total_engagement") or g("engagement")),
            _to_int(g("audience")),
            _to_int(g("reach")),
            g("media_type"),
            g("tags"),
            g("language"),
            _to_int(g("ranking")),
            g("notes"),
        ))

    cursor.executemany("""
        MERGE INTO posts t
        USING (
            SELECT 
                %s AS market_code, %s AS campaign_id, %s AS publish_date, %s AS update_date,
                %s AS platform, %s AS source_name, %s AS title, %s AS content, %s AS link, 
                %s AS sentiment, %s AS likes, %s AS comments_count, %s AS shares, 
                %s AS total_engagement, %s AS audience, %s AS reach, %s AS media_type, 
                %s AS tags, %s AS language, %s AS ranking, %s AS notes
        ) s
        ON t.market_code = s.market_code 
           AND (
               (s.link IS NOT NULL AND s.link != '' AND t.link = s.link)
               OR 
               ((s.link IS NULL OR s.link = '') AND NVL(t.title, '') = NVL(s.title, '') AND NVL(t.platform, '') = NVL(s.platform, ''))
           )
        WHEN MATCHED THEN
            UPDATE SET 
                campaign_id = NVL(s.campaign_id, t.campaign_id),
                update_date = NVL(s.update_date, t.update_date),
                content = NVL(s.content, t.content),
                sentiment = IFF(s.sentiment != '', NVL(s.sentiment, t.sentiment), t.sentiment),
                likes = GREATEST(NVL(t.likes, 0), s.likes),
                comments_count = GREATEST(NVL(t.comments_count, 0), s.comments_count),
                shares = GREATEST(NVL(t.shares, 0), s.shares),
                total_engagement = GREATEST(NVL(t.total_engagement, 0), s.total_engagement),
                audience = GREATEST(NVL(t.audience, 0), s.audience),
                reach = GREATEST(NVL(t.reach, 0), s.reach),
                media_type = IFF(s.media_type != '', NVL(s.media_type, t.media_type), t.media_type),
                tags = IFF(s.tags != '', NVL(s.tags, t.tags), t.tags),
                language = IFF(s.language != '', NVL(s.language, t.language), t.language),
                ranking = IFF(s.ranking = 0, t.ranking, s.ranking),
                notes = IFF(s.notes != '', NVL(s.notes, t.notes), t.notes)
        WHEN NOT MATCHED THEN
            INSERT (
                market_code, campaign_id, publish_date, update_date,
                platform, source_name, title, content, link, sentiment,
                likes, comments_count, shares, total_engagement,
                audience, reach, media_type, tags, language, ranking, notes
            ) VALUES (
                s.market_code, s.campaign_id, s.publish_date, s.update_date,
                s.platform, s.source_name, s.title, s.content, s.link, s.sentiment,
                s.likes, s.comments_count, s.shares, s.total_engagement,
                s.audience, s.reach, s.media_type, s.tags, s.language, s.ranking, s.notes
            )
    """, post_params)

    # ── Extract authors for posts that have author data ──
    links = [_get(row, field_map, "link") for row in rows if _get(row, field_map, "link")]
    if links:
        placeholders = ','.join(['%s'] * len(links))
        cursor.execute(f"""
            SELECT id, link FROM posts
            WHERE link IN ({placeholders})
            ORDER BY id DESC
        """, links)
        link_to_post_id = {}
        for r in cursor.fetchall():
            if r[1] not in link_to_post_id:
                link_to_post_id[r[1]] = r[0]

        author_params = []
        for row in rows:
            g = lambda field, default=None: _get(row, field_map, field, default)
            link = g("link")
            post_id = link_to_post_id.get(link)
            author_name = g("author_name")
            if post_id and author_name:
                author_params.append((
                    post_id, author_name, g("author_handle"),
                    g("author_url"), g("gender"), g("age"),
                    g("bio"), g("city"),
                ))

        if author_params:
            cursor.executemany("""
                INSERT INTO authors (
                    post_id, author_name, author_handle, author_url,
                    gender, age_range, bio, city
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            """, author_params)

    return len(post_params)


def process_kpis(rows: list[dict], field_map: dict, market_code: str,
                 batch_id: str, cursor) -> int:
    """
    Upsert KPI rows into `kpi_summaries`.

    Uses MERGE (upsert) on the natural key (market_code + metric_name + report_date):
    - If the same metric for the same market+date already exists → UPDATE value
    - Otherwise → INSERT new row
    This enables sequential uploads to overwrite stale KPIs while preserving others.

    Returns the number of KPI rows processed.
    """
    if not rows:
        return 0

    count = 0
    for row in rows:
        g = lambda field, default=None: _get(row, field_map, field, default)

        metric_name = g("metric_name")
        if not metric_name:
            continue  # skip rows with no metric name

        metric_value = _to_float(g("metric_value"))
        report_date = _to_date(g("report_date"))

        # MERGE = upsert on (market_code, metric_name, report_date)
        cursor.execute("""
            MERGE INTO kpi_summaries t
            USING (SELECT %s AS mc, %s AS mn, %s AS rd) s
            ON t.market_code = s.mc
               AND t.metric_name = s.mn
               AND NVL(t.report_date, '1900-01-01') = NVL(s.rd, '1900-01-01')
            WHEN MATCHED THEN
                UPDATE SET metric_value = %s, batch_id = %s
            WHEN NOT MATCHED THEN
                INSERT (market_code, metric_name, metric_value, report_date, batch_id)
                VALUES (%s, %s, %s, %s, %s)
        """, (
            market_code, metric_name, report_date,
            metric_value, batch_id,
            market_code, metric_name, metric_value, report_date, batch_id,
        ))
        count += 1

    return count


def process_comments(rows: list[dict], field_map: dict, market_code: str,
                     batch_id: str, cursor) -> int:
    """
    Insert comment rows into the `comments` table with deduplication.

    Uses a temp staging table + single MERGE to avoid per-row round-trips.
    Skips rows that already exist with the same
    (comment_text, comment_date, platform, market_code) — this prevents
    duplicate comments when the same CSV is uploaded more than once.

    Returns the number of comments processed.
    """
    if not rows:
        return 0

    # 1. Collect all comment params in memory
    comment_params = []
    for row in rows:
        g = lambda field, default=None: _get(row, field_map, field, default)

        comment_text = g("comment_text")
        if not comment_text:
            continue  # skip rows with no comment body

        sentiment = (g("comment_sentiment") or g("sentiment") or "").strip().capitalize()
        raw_platform = g("comment_platform") or g("platform") or g("source")
        platform = _normalize_platform(raw_platform)
        comment_date = _to_date(g("comment_date") or g("publish_date"))
        keyword_tag = g("keyword_tag")
        keyword_type = g("keyword_type")
        post_link = g("comment_link") or g("link")

        comment_params.append((
            market_code, comment_date, platform, comment_text,
            sentiment, keyword_tag, keyword_type, post_link,
        ))

    if not comment_params:
        return 0

    # 2. Create temp staging table for bulk load
    cursor.execute("""
        CREATE TEMPORARY TABLE IF NOT EXISTS temp_comments_stage (
            market_code VARCHAR, comment_date DATE, platform VARCHAR,
            comment_text VARCHAR, sentiment VARCHAR, keyword_tag VARCHAR,
            keyword_type VARCHAR, post_link VARCHAR
        )
    """)
    cursor.execute("TRUNCATE TABLE temp_comments_stage")

    # 3. Bulk insert all comments into staging (single executemany call)
    cursor.executemany("""
        INSERT INTO temp_comments_stage
            (market_code, comment_date, platform, comment_text,
             sentiment, keyword_tag, keyword_type, post_link)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, comment_params)

    # 4. Single MERGE from staging → comments (deduplicates automatically)
    cursor.execute("""
        MERGE INTO comments t
        USING (
            SELECT DISTINCT market_code, comment_date, platform,
                   comment_text, sentiment, keyword_tag, keyword_type, post_link
            FROM temp_comments_stage
        ) s
        ON  t.market_code  = s.market_code
        AND NVL(t.comment_date::VARCHAR, '') = NVL(s.comment_date::VARCHAR, '')
        AND NVL(t.platform, '')  = NVL(s.platform, '')
        AND t.comment_text = s.comment_text
        WHEN NOT MATCHED THEN
            INSERT (post_id, market_code, comment_date, platform,
                    comment_text, sentiment, keyword_tag, keyword_type, post_link)
            VALUES (NULL, s.market_code, s.comment_date, s.platform,
                    s.comment_text, s.sentiment, s.keyword_tag, s.keyword_type, s.post_link)
    """)

    # 5. Cleanup
    cursor.execute("DROP TABLE IF EXISTS temp_comments_stage")

    return len(comment_params)


def stage_raw_ingestion(rows: list[dict], field_map: dict, market_code: str,
                        batch_id: str, cursor) -> None:
    """
    Stage all raw CSV data into `raw_ingestion` for audit trail.
    This preserves the original data regardless of category routing.
    """
    if not rows:
        return

    stage_params = []
    for row in rows:
        g = lambda field, default=None: _get(row, field_map, field, default)

        stage_params.append((
            g("title"), g("detail"), g("link"), g("source"),
            _to_date(g("update_date")), _to_date(g("publish_date")),
            (g("sentiment") or "").strip().capitalize(),
            _to_int(g("ranking")), g("media_type"), g("tags"),
            g("country", market_code), g("language"),
            _to_int(g("audience")), _to_int(g("reach")),
            _to_int(g("total_engagement")), g("notes"),
            g("author_name"), g("author_handle"),
            g("author_url"), g("gender"),
            g("age"), g("bio"), g("city"),
            batch_id,
        ))

    cursor.executemany("""
        INSERT INTO raw_ingestion (
            title, detail, link, source, update_date, publish_date,
            sentiment, ranking, media_type, tags, country, language,
            audience, reach, interactions, notes,
            author_name, author_handle, author_url, gender,
            age, bio, city, batch_id
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, stage_params)


def sync_comments_to_posts(cursor, market_code: str) -> None:
    """
    Auto-link any unlinked comments to posts using post_link or closest date match.
    """
    # 1. Link comments by post_link if available
    cursor.execute("""
        UPDATE comments
        SET post_id = p.id
        FROM posts p
        WHERE comments.post_id IS NULL 
          AND comments.post_link IS NOT NULL 
          AND comments.post_link = p.link
          AND comments.market_code = %s
    """, (market_code,))
    
    # 2. Link remaining unlinked comments by closest date match
    cursor.execute("""
        UPDATE comments
        SET post_id = best.post_id
        FROM (
            SELECT 
                c.id AS comment_id,
                p.id AS post_id
            FROM comments c
            JOIN posts p 
              ON p.market_code = c.market_code 
              AND UPPER(NVL(p.platform, '')) = UPPER(NVL(c.platform, ''))
              AND p.platform IS NOT NULL AND p.platform != ''
            WHERE c.post_id IS NULL 
              AND c.market_code = %s
            QUALIFY ROW_NUMBER() OVER (
                PARTITION BY c.id 
                ORDER BY COALESCE(ABS(DATEDIFF(day, c.comment_date, p.publish_date)), 9999) ASC
            ) = 1
        ) best
        WHERE comments.id = best.comment_id
    """, (market_code,))
            
    # Always refresh comments_count on posts for this market
    cursor.execute("""
        MERGE INTO posts p
        USING (
            SELECT post_id, COUNT(*) as cnt
            FROM comments
            WHERE post_id IS NOT NULL AND market_code = %s
            GROUP BY post_id
        ) c
        ON p.id = c.post_id AND c.cnt > COALESCE(p.comments_count, 0)
        WHEN MATCHED THEN
            UPDATE SET p.comments_count = c.cnt,
                       p.total_engagement = GREATEST(
                           COALESCE(p.total_engagement, 0),
                           COALESCE(p.likes, 0) + c.cnt + COALESCE(p.shares, 0)
                       )
    """, (market_code,))
