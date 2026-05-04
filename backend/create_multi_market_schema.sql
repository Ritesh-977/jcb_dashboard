-- =============================================================
-- Multi-Market Schema Migration DDL
-- Target: Snowflake — MY_DASHBOARD.PUBLIC
-- Run once to create all new tables.
-- =============================================================

USE DATABASE MY_DASHBOARD;
USE SCHEMA PUBLIC;

-- -----------------------------------------------------------
-- 1. MARKETS — dimension table
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS markets (
    market_code   VARCHAR(10)   PRIMARY KEY,
    market_name   VARCHAR(100)  NOT NULL,
    created_at    TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- -----------------------------------------------------------
-- 2. CAMPAIGNS — grouping for posts
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaigns (
    id             INT AUTOINCREMENT PRIMARY KEY,
    campaign_name  VARCHAR(255)  NOT NULL,
    market_code    VARCHAR(10)   NOT NULL REFERENCES markets(market_code),
    start_date     DATE,
    end_date       DATE,
    created_at     TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- -----------------------------------------------------------
-- 3. POSTS — central fact table
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
    id               INT AUTOINCREMENT PRIMARY KEY,
    market_code      VARCHAR(10)   NOT NULL REFERENCES markets(market_code),
    campaign_id      INT           REFERENCES campaigns(id),
    publish_date     DATE,
    update_date      DATE,
    platform         VARCHAR(50),
    source_name      VARCHAR(255),
    title            VARCHAR(500),
    content          TEXT,
    link             VARCHAR(500),
    sentiment        VARCHAR(50),
    likes            INT           DEFAULT 0,
    comments_count   INT           DEFAULT 0,
    shares           INT           DEFAULT 0,
    total_engagement INT           DEFAULT 0,
    audience         INT           DEFAULT 0,
    reach            INT           DEFAULT 0,
    media_type       VARCHAR(100),
    tags             TEXT,
    language         VARCHAR(50),
    ranking          INT,
    notes            TEXT,
    created_at       TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
)
CLUSTER BY (market_code, publish_date);

-- -----------------------------------------------------------
-- 4. AUTHORS — social profile data linked to posts
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS authors (
    id             INT AUTOINCREMENT PRIMARY KEY,
    post_id        INT           NOT NULL REFERENCES posts(id),
    author_name    VARCHAR(255),
    author_handle  VARCHAR(255),
    author_url     VARCHAR(500),
    gender         VARCHAR(20),
    age_range      VARCHAR(50),
    bio            TEXT,
    city           VARCHAR(100)
);

-- -----------------------------------------------------------
-- 5. COMMENTS — with denormalized market_code for fast queries
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
    id             INT AUTOINCREMENT PRIMARY KEY,
    post_id        INT           REFERENCES posts(id),
    market_code    VARCHAR(10)   NOT NULL REFERENCES markets(market_code),
    comment_date   DATE,
    platform       VARCHAR(50),
    comment_text   TEXT,
    sentiment      VARCHAR(50),
    keyword_tag    VARCHAR(100),
    keyword_type   VARCHAR(50),
    created_at     TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
)
CLUSTER BY (market_code, comment_date);

-- -----------------------------------------------------------
-- 6. KEYWORD_MAPPING — reference table
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS keyword_mapping (
    id        INT AUTOINCREMENT PRIMARY KEY,
    keyword   VARCHAR(100) NOT NULL UNIQUE,
    category  VARCHAR(100) NOT NULL
);

-- -----------------------------------------------------------
-- 7. RAW_INGESTION — staging table for CSV uploads
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS raw_ingestion (
    id             INT AUTOINCREMENT PRIMARY KEY,
    title          VARCHAR(500),
    detail         TEXT,
    link           VARCHAR(500),
    source         VARCHAR(255),
    update_date    DATE,
    publish_date   DATE,
    sentiment      VARCHAR(50),
    ranking        INT,
    media_type     VARCHAR(100),
    tags           TEXT,
    country        VARCHAR(50),
    language       VARCHAR(50),
    audience       INT,
    reach          INT,
    interactions   INT,
    notes          TEXT,
    author_name    VARCHAR(255),
    author_handle  VARCHAR(255),
    author_url     VARCHAR(500),
    gender         VARCHAR(20),
    age            VARCHAR(50),
    bio            TEXT,
    city           VARCHAR(100),
    batch_id       VARCHAR(50),
    ingested_at    TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
