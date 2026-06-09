from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.routes.auth import router as auth_router
from app.routes.comments import router as comments_router
from app.routes.dashboard import router as dashboard_router
from app.routes.admin import router as admin_router
from app.routes.etl import router as etl_router


# ✅ Lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Lazy init if needed
    yield


# ✅ ✅ ASGI Middleware (REPLACES BaseHTTPMiddleware completely)
class SecurityHeadersMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                # Convert headers to dict for easy manipulation
                headers = dict(message.get("headers", []))

                # ✅ REMOVE all existing CSP headers (critical)
                headers = {
                    k: v
                    for k, v in headers.items()
                    if k.lower()
                    not in [
                        b"content-security-policy",
                        b"content-security-policy-report-only",
                    ]
                }

                # ✅ Your unified CSP (Facebook fully supported)
                csp = (
    "default-src 'self' "
    "https://www.facebook.com https://*.facebook.com "
    "https://connect.facebook.net https://*.fbcdn.net; "
    
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' "
    "https://connect.facebook.net https://www.facebook.com https://*.fbcdn.net; "
    
    "frame-src 'self' "
    "https://www.facebook.com https://*.facebook.com; "
    
    "child-src https://www.facebook.com https://*.facebook.com; "
    
    "img-src 'self' data: blob: "
    "https://*.facebook.com https://*.fbcdn.net; "
    
    "connect-src 'self' "
    "https://www.facebook.com https://connect.facebook.net; "
    
    "style-src 'self' 'unsafe-inline'; "
    
    "object-src 'none'; "
    "base-uri 'self';"
)

                # ✅ SET ONLY ONE CSP HEADER
                headers[b"content-security-policy"] = csp.encode()

                # ✅ (IMPORTANT)
                # DO NOT re-add report-only unless debugging
                # This prevents Snowflake noise from reappearing

                # Rebuild header list
                message["headers"] = [(k, v) for k, v in headers.items()]

            await send(message)

        await self.app(scope, receive, send_wrapper)


# ✅ App init
app = FastAPI(title="JCB Dashboard API", lifespan=lifespan)

# ✅ MUST be first middleware
app.add_middleware(SecurityHeadersMiddleware)

# ✅ CORS (can stay after)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ✅ Static files
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# ✅ Routers
app.include_router(auth_router)
app.include_router(comments_router)
app.include_router(dashboard_router)
app.include_router(admin_router)
app.include_router(etl_router)


# ✅ Health check
@app.get("/health")
async def health():
    return {"status": "ok"}