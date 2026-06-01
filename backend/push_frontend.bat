@echo off
echo Building frontend...
cd ..\frontend
call npm run build

echo Building Docker image...
docker build -t frontend-dashboard:v1.0 .

echo Tagging for Snowflake registry...
docker tag frontend-dashboard:v1.0 adaglobal-jcb.registry.snowflakecomputing.com/my_dashboard_db/public/my_repo/frontend-dashboard:v1.0

echo Pushing to Snowflake...
docker push adaglobal-jcb.registry.snowflakecomputing.com/my_dashboard_db/public/my_repo/frontend-dashboard:v1.0

echo Done!
cd ..\backend
