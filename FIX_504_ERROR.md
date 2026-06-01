# Steps to Fix 504 Error

## 1. Get Your Backend Endpoint URL

Run this in Snowflake:
```sql
SHOW ENDPOINTS IN SERVICE api_backend_svc;
```

Copy the `ingress_url` value (e.g., https://abc123xyz.snowflakecomputing.app)

## 2. Update Frontend .env Files

Replace the URL in both:
- frontend/.env
- frontend_admin/.env

Change from:
```
VITE_API_URL=/api
```

To (use YOUR actual endpoint URL):
```
VITE_API_URL=https://your-endpoint-url.snowflakecomputing.app
```

## 3. Rebuild Frontend

```bash
cd frontend
npm run build

cd ../frontend_admin
npm run build
```

## 4. Test Login

Try logging in again. The 504 error should be resolved.

## Alternative: Check if Backend is Actually Running

Run in Snowflake:
```sql
SELECT SYSTEM$GET_SERVICE_STATUS('my_dashboard_db.public.api_backend_svc');
```

Status should be "READY". If not, check logs:
```sql
CALL SYSTEM$GET_SERVICE_LOGS('my_dashboard_db.public.api_backend_svc', '0', 'api-backend', 100);
```
