@echo off
echo Testing frontend Docker image locally...

cd ..\frontend

echo Building image...
docker build -t frontend-test:local .

echo Running container on port 3000...
docker run -d -p 3000:80 --name frontend-test frontend-test:local

echo Waiting 5 seconds...
timeout /t 5 /nobreak

echo Testing if container is running...
docker ps | findstr frontend-test

echo.
echo If container is running, test at: http://localhost:3000
echo.
echo To see logs: docker logs frontend-test
echo To stop: docker stop frontend-test
echo To remove: docker rm frontend-test

cd ..\backend
