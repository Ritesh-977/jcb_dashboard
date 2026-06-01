-- Check dashboard frontend logs
CALL SYSTEM$GET_SERVICE_LOGS('my_dashboard_db.public.dashboard_website_svc', '0', 'dashboard-frontend', 100);

-- If you also deployed admin frontend, check its logs too
-- CALL SYSTEM$GET_SERVICE_LOGS('my_dashboard_db.public.frontend_admin_svc', '0', 'frontend-admin', 100);
