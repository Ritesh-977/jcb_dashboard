@echo off
echo Building admin frontend...
cd ..\frontend_admin
call npm run build

echo Building Docker image...
docker build -t frontend-admin:v1.0 .

echo Tagging for Snowflake registry...
docker tag frontend-admin:v1.0 adaglobal-jcb.registry.snowflakecomputing.com/my_dashboard_db/public/my_repo/frontend-admin:v1.0

echo Pushing to Snowflake...
docker push adaglobal-jcb.registry.snowflakecomputing.com/my_dashboard_db/public/my_repo/frontend-admin:v1.0

echo Done!
cd ..\backend
