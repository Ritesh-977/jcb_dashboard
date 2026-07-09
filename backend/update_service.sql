-- Create a persistent stage for image uploads if it doesn't exist
CREATE STAGE IF NOT EXISTS my_dashboard_db.public.dashboard_uploads_stage
  ENCRYPTION = (TYPE = 'SNOWFLAKE_SSE');

-- Update service with persistent volume mount
ALTER SERVICE my_dashboard_db.public.api_backend_svc
  FROM SPECIFICATION $$
    spec:
      containers:
        - name: api-backend
          image: adaglobal-jcb.registry.snowflakecomputing.com/my_dashboard_db/public/my_repo/api-backend:v5.1
          env:
            SNOWFLAKE_ACCOUNT: 'ADAGLOBAL-JCB'
            JWT_SECRET: 'dashboard_secret_key'
            ACCESS_TOKEN_EXPIRE_MINUTES: '60'
          volumeMounts:
            - name: uploads-volume
              mountPath: /app/uploads
      endpoints:
        - name: api-endpoint
          port: 8000
          public: true
      volumes:
        - name: uploads-volume
          source: "@my_dashboard_db.public.dashboard_uploads_stage"
      serviceRoles:
        - name: api_endpoint_user
          endpoints:
            - api-endpoint
  $$;

-- Check status after 30 seconds
SELECT SYSTEM$GET_SERVICE_STATUS('my_dashboard_db.public.api_backend_svc');

-- Check logs
CALL SYSTEM$GET_SERVICE_LOGS('my_dashboard_db.public.api_backend_svc', '0', 'api-backend', 100);

-- Show endpoints when READY
SHOW ENDPOINTS IN SERVICE my_dashboard_db.public.api_backend_svc;
