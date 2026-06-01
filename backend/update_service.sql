-- Drop and recreate service without explicit volume mount
DROP SERVICE IF EXISTS api_backend_svc;

CREATE SERVICE api_backend_svc
  IN COMPUTE POOL my_dashboard_pool
  FROM SPECIFICATION $$
    spec:
      containers:
        - name: api-backend
          image: adaglobal-jcb.registry.snowflakecomputing.com/my_dashboard_db/public/my_repo/api-backend:v1.1
          env:
            SNOWFLAKE_ACCOUNT: 'ADAGLOBAL-JCB'
            JWT_SECRET: 'dashboard_secret_key'
            ACCESS_TOKEN_EXPIRE_MINUTES: '60'
      endpoints:
        - name: api-endpoint
          port: 8000
          public: true
  $$
  MIN_INSTANCES = 1
  MAX_INSTANCES = 1;

-- Check status after 30 seconds
SELECT SYSTEM$GET_SERVICE_STATUS('my_dashboard_db.public.api_backend_svc');

-- Check logs
CALL SYSTEM$GET_SERVICE_LOGS('my_dashboard_db.public.api_backend_svc', '0', 'api-backend', 100);

-- Show endpoints when READY
SHOW ENDPOINTS IN SERVICE api_backend_svc;
