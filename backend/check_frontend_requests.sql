-- Check frontend logs to see what's happening
CALL SYSTEM$GET_SERVICE_LOGS('my_dashboard_db.public.dashboard_website_svc', '0', 'dashboard-frontend', 100);

-- Also check if the frontend is actually making requests
-- The GET / requests suggest the frontend might be calling the wrong URL
