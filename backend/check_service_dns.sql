-- Check backend service details
SHOW SERVICES LIKE 'api_backend_svc';

-- Get internal endpoint
SHOW ENDPOINTS IN SERVICE api_backend_svc;

-- The internal endpoint format in Snowflake is typically:
-- <service-name>.<database>.<schema>
-- OR just <service-name> if in same database/schema

-- Check if services can communicate
-- You may need to use the service name without database/schema
