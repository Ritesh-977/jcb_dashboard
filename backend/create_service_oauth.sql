-- Drop existing service
DROP SERVICE IF EXISTS api_backend_svc;

-- Create service using Snowflake's OAuth token (no password needed)
CREATE SERVICE api_backend_svc
  IN COMPUTE POOL my_dashboard_pool
  FROM SPECIFICATION $$
    spec:
      containers:
        - name: api-backend
          image: adaglobal-jcb.registry.snowflakecomputing.com/my_dashboard_db/public/my_repo/api-backend:v1.0
          env:
            SNOWFLAKE_ACCOUNT: 'ADAGLOBAL-JCB'
            JWT_SECRET: 'dashboard_secret_key'
            ACCESS_TOKEN_EXPIRE_MINUTES: '60'
          volumeMounts:
            - name: snowflake-session
              mountPath: /snowflake/session
      volumes:
        - name: snowflake-session
          source: session
      endpoints:
        - name: api-endpoint
          port: 8000
          public: true
  $$
  MIN_INSTANCES = 1
  MAX_INSTANCES = 1;

-- Wait 30 seconds for service to start
-- Then check status
SELECT SYSTEM$GET_SERVICE_STATUS('my_dashboard_db.public.api_backend_svc');

-- Check logs (run this after 30 seconds)
CALL SYSTEM$GET_SERVICE_LOGS('my_dashboard_db.public.api_backend_svc', '0', 'api-backend', 100);

-- Show endpoints (run after service is READY)
SHOW ENDPOINTS IN SERVICE api_backend_svc;
