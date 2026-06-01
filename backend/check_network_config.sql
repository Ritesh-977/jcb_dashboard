-- Check if there are any network policies blocking outbound connections
SHOW NETWORK POLICIES;

-- Check external access integrations (needed for services to access external resources)
SHOW EXTERNAL ACCESS INTEGRATIONS;

-- Check if the compute pool has external access enabled
SHOW COMPUTE POOLS LIKE 'my_dashboard_pool';

-- Check service configuration
DESC SERVICE api_backend_svc;

-- In your OLD account, check if there was an external access integration
-- You may need to create one for the NEW account

-- Example: Create external access integration for Snowflake database access
-- CREATE OR REPLACE NETWORK RULE snowflake_access_rule
--   TYPE = HOST_PORT
--   MODE = EGRESS
--   VALUE_LIST = ('adaglobal-jcb.snowflakecomputing.com:443');

-- CREATE OR REPLACE EXTERNAL ACCESS INTEGRATION snowflake_access_integration
--   ALLOWED_NETWORK_RULES = (snowflake_access_rule)
--   ENABLED = TRUE;
