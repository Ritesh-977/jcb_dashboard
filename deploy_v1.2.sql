-- ============================================================
-- Deploy v1.3 — Run this in Snowflake SQL Worksheet
-- Fixes: ALL processors now use temp-table + single MERGE
--        (~900 queries → ~13 queries for 300-row CSV)
-- ============================================================

-- Update the backend image to v1.3
ALTER SERVICE my_dashboard_db.public.api_backend_svc
  FROM SPECIFICATION $$
    spec:
      containers:
        - name: api-backend
          image: adaglobal-jcb.registry.snowflakecomputing.com/my_dashboard_db/public/my_repo/api-backend:v1.3
          env:
            SNOWFLAKE_ACCOUNT: 'ADAGLOBAL-JCB'
            JWT_SECRET: 'dashboard_secret_key'
            ACCESS_TOKEN_EXPIRE_MINUTES: '60'
      endpoints:
        - name: api-endpoint
          port: 8000
          public: true
  $$;

-- Wait ~30 seconds, then check status
SELECT SYSTEM$GET_SERVICE_STATUS('my_dashboard_db.public.api_backend_svc');

-- Check logs if needed
-- CALL SYSTEM$GET_SERVICE_LOGS('my_dashboard_db.public.api_backend_svc', '0', 'api-backend', 100);
