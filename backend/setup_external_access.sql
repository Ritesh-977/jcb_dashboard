-- Step 1: Create network rule to allow access to Snowflake
CREATE OR REPLACE NETWORK RULE snowflake_db_access_rule
  TYPE = HOST_PORT
  MODE = EGRESS
  VALUE_LIST = ('adaglobal-jcb.snowflakecomputing.com:443');

-- Step 2: Create external access integration
CREATE OR REPLACE EXTERNAL ACCESS INTEGRATION snowflake_db_access
  ALLOWED_NETWORK_RULES = (snowflake_db_access_rule)
  ENABLED = TRUE;

-- Step 3: Grant usage to your role
GRANT USAGE ON INTEGRATION snowflake_db_access TO ROLE ACCOUNTADMIN;

-- Step 4: Update the backend service to use the external access integration
ALTER SERVICE api_backend_svc
  FROM SPECIFICATION $$
    spec:
      containers:
        - name: api-backend
          image: adaglobal-jcb.registry.snowflakecomputing.com/my_dashboard_db/public/my_repo/api-backend:v1.2
          env:
            SNOWFLAKE_ACCOUNT: 'ADAGLOBAL-JCB'
            JWT_SECRET: 'dashboard_secret_key'
            ACCESS_TOKEN_EXPIRE_MINUTES: '60'
      endpoints:
        - name: api-endpoint
          port: 8000
          public: true
      externalAccessIntegrations:
        - snowflake_db_access
  $$;

-- Wait 30 seconds then check status
SELECT SYSTEM$GET_SERVICE_STATUS('my_dashboard_db.public.api_backend_svc');
