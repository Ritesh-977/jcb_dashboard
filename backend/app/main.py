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


import urllib.request
import urllib.parse
from fastapi.responses import HTMLResponse

# ✅ Python-based Reverse Proxy for Facebook
# This safely bypasses Nginx 502 errors on Snowflake and manually strips Facebook's security headers.
import re

@app.get("/fb-proxy")
async def fb_proxy(href: str):
    try:
        url = f"https://www.facebook.com/plugins/post.php?href={href}&width=500&show_text=true"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            
        # 1. Inject base tag for relative paths
        if "<head>" in html:
            html = html.replace("<head>", '<head><base href="https://www.facebook.com/" />', 1)
            
        # 2. Strip CORS and SRI checks to prevent requireLazy crashes
        html = re.sub(r'\s+crossorigin="anonymous"', '', html)
        html = re.sub(r'\s+integrity="[^"]+"', '', html)
        
        # 3. Create a custom CSP header allowing Facebook
        csp_header = (
            "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://*.facebook.com https://*.fbcdn.net; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.facebook.com https://*.fbcdn.net; "
            "img-src 'self' data: blob: https://*.facebook.com https://*.fbcdn.net; "
            "frame-src 'self' https://*.facebook.com; "
            "base-uri 'self' https://www.facebook.com; "
        )
            
        # Return only the raw HTML. 
        # This completely strips Facebook's X-Frame-Options and CSP headers!
        return HTMLResponse(content=html, status_code=200, headers={"Content-Security-Policy": csp_header})
    except Exception as e:
        return HTMLResponse(content=f"Error proxying Facebook: {str(e)}", status_code=502)