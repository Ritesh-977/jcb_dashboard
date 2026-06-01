-- Check frontend service status
SELECT SYSTEM$GET_SERVICE_STATUS('my_dashboard_db.public.dashboard_website_svc');

-- Check frontend logs (nginx access logs)
CALL SYSTEM$GET_SERVICE_LOGS('my_dashboard_db.public.dashboard_website_svc', '0', 'dashboard-frontend', 100);

-- Check backend logs with more lines
CALL SYSTEM$GET_SERVICE_LOGS('my_dashboard_db.public.api_backend_svc', '0', 'api-backend', 200);

-- Get frontend URL
SHOW ENDPOINTS IN SERVICE dashboard_website_svc;

-- Get backend URL
SHOW ENDPOINTS IN SERVICE api_backend_svc;
