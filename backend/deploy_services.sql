USE DATABASE my_dashboard_db;
USE SCHEMA public;

-- Update API Backend to v1.4 (port 3000)
ALTER SERVICE api_backend_svc
  FROM SPECIFICATION $$
    spec:
      containers:
        - name: api-backend
          image: eyspzto-yz14021.registry.snowflakecomputing.com/my_dashboard_db/public/my_repo/api-backend:v1.4
          env:
            SNOWFLAKE_ACCOUNT: 'EYSPZTO-YZ14021'
            SNOWFLAKE_USER: 'RITESH8848'
      endpoints:
        - name: api-endpoint
          port: 3000
          public: true
  $$;

-- Update Dashboard Frontend to v1.2 (with internal service communication)
ALTER SERVICE dashboard_website_svc FROM SPECIFICATION $$
  spec:
    containers:
      - name: dashboard-frontend
        image: eyspzto-yz14021.registry.snowflakecomputing.com/my_dashboard_db/public/my_repo/dashboard-website:v1.2
    endpoints:
      - name: web-endpoint
        port: 80
        public: true
$$;

-- Check Status
SELECT SYSTEM$GET_SERVICE_STATUS('api_backend_svc');
SELECT SYSTEM$GET_SERVICE_STATUS('dashboard_website_svc');

-- Get URLs
SHOW ENDPOINTS IN SERVICE api_backend_svc;
SHOW ENDPOINTS IN SERVICE dashboard_website_svc;
