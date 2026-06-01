@echo off
echo Building Docker image...
docker build -t api-backend:v1.1 .

echo Tagging image for Snowflake registry...
docker tag api-backend:v1.1 adaglobal-jcb.registry.snowflakecomputing.com/my_dashboard_db/public/my_repo/api-backend:v1.2

echo Pushing to Snowflake registry...
docker push adaglobal-jcb.registry.snowflakecomputing.com/my_dashboard_db/public/my_repo/api-backend:v1.2

echo Done! Now run the SQL to update the service.
