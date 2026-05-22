-- =============================================================
-- Migration 001: Add kpi_summaries table
-- Target: Snowflake — MY_DASHBOARD.PUBLIC
-- =============================================================

USE DATABASE MY_DASHBOARD;
USE SCHEMA PUBLIC;

-- -----------------------------------------------------------
-- KPI_SUMMARIES — stores uploaded KPI metrics per market
-- Upsert key: market_code + metric_name + report_date
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS kpi_summaries (
    id             INT AUTOINCREMENT PRIMARY KEY,
    market_code    VARCHAR(10)   NOT NULL REFERENCES markets(market_code),
    metric_name    VARCHAR(255)  NOT NULL,
    metric_value   FLOAT,
    report_date    DATE,
    batch_id       VARCHAR(50),
    created_at     TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
)
CLUSTER BY (market_code);
