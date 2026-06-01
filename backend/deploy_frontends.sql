-- Deploy Dashboard Frontend
CREATE SERVICE frontend_dashboard_svc
  IN COMPUTE POOL my_dashboard_pool
  FROM SPECIFICATION $$
    spec:
      containers:
        - name: frontend-dashboard
          image: adaglobal-jcb.registry.snowflakecomputing.com/my_dashboard_db/public/my_repo/frontend-dashboard:v1.0
      endpoints:
        - name: dashboard-endpoint
          port: 80
          public: true
  $$
  MIN_INSTANCES = 1
  MAX_INSTANCES = 1;

-- Deploy Admin Frontend
CREATE SERVICE frontend_admin_svc
  IN COMPUTE POOL my_dashboard_pool
  FROM SPECIFICATION $$
    spec:
      containers:
        - name: frontend-admin
          image: adaglobal-jcb.registry.snowflakecomputing.com/my_dashboard_db/public/my_repo/frontend-admin:v1.0
      endpoints:
        - name: admin-endpoint
          port: 80
          public: true
  $$
  MIN_INSTANCES = 1
  MAX_INSTANCES = 1;

-- Wait 30 seconds, then check status
SELECT SYSTEM$GET_SERVICE_STATUS('my_dashboard_db.public.frontend_dashboard_svc');
SELECT SYSTEM$GET_SERVICE_STATUS('my_dashboard_db.public.frontend_admin_svc');

-- Get the public URLs
SHOW ENDPOINTS IN SERVICE frontend_dashboard_svc;
SHOW ENDPOINTS IN SERVICE frontend_admin_svc;
