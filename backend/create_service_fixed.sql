-- Drop existing service if needed
DROP SERVICE IF EXISTS api_backend_svc;

-- Create service with complete configuration
CREATE SERVICE api_backend_svc
  IN COMPUTE POOL my_dashboard_pool
  FROM SPECIFICATION $$
    spec:
      containers:
        - name: api-backend
          image: adaglobal-jcb.registry.snowflakecomputing.com/my_dashboard_db/public/my_repo/api-backend:v1.0
          env:
            SNOWFLAKE_ACCOUNT: 'ADAGLOBAL-JCB'
            SNOWFLAKE_USER: 'RITESH.SINGH@ADAGLOBAL.COM'
            SNOWFLAKE_PASSWORD: 'Riteshsingh@8848'
            SNOWFLAKE_AUTHENTICATOR: 'snowflake'
            SNOWFLAKE_PORT: '443'
            JWT_SECRET: 'dashboard_secret_key'
            ACCESS_TOKEN_EXPIRE_MINUTES: '60'
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 10
      endpoints:
        - name: api-endpoint
          port: 8000
          public: true
  $$
  MIN_INSTANCES = 1
  MAX_INSTANCES = 1;

-- Wait a moment then check status
SELECT SYSTEM$GET_SERVICE_STATUS('my_dashboard_db.public.api_backend_svc');

-- Check logs
CALL SYSTEM$GET_SERVICE_LOGS('my_dashboard_db.public.api_backend_svc', '0', 'api-backend', 100);

-- Show endpoints
SHOW ENDPOINTS IN SERVICE api_backend_svc;
