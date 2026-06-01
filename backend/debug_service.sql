-- Check service status
SELECT SYSTEM$GET_SERVICE_STATUS('my_dashboard_db.public.api_backend_svc');

-- Check service logs (most important for debugging)
CALL SYSTEM$GET_SERVICE_LOGS('my_dashboard_db.public.api_backend_svc', '0', 'api-backend', 100);

-- Show service details
SHOW SERVICES LIKE 'api_backend_svc';

-- Check compute pool status
SHOW COMPUTE POOLS LIKE 'my_dashboard_pool';

-- If service is stuck, drop and recreate
-- DROP SERVICE IF EXISTS api_backend_svc;
