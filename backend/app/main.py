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
from app.db import init_connection_pool

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Don't initialize connection at startup - let it initialize on first use
    yield

from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        csp = (
    "default-src 'self'; "
    
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' "
    "https://connect.facebook.net https://www.facebook.com; "
    
    "style-src 'self' 'unsafe-inline'; "
    
    "frame-src 'self' "
    "https://www.facebook.com https://*.facebook.com; "
    
    "img-src 'self' data: blob: "
    "https://*.facebook.com https://*.fbcdn.net; "
    
    "connect-src 'self' "
    "https://www.facebook.com https://connect.facebook.net; "
)
        response.headers["Content-Security-Policy"] = csp
        response.headers["Content-Security-Policy-Report-Only"] = csp
        return response

app = FastAPI(title="JCB Dashboard API", lifespan=lifespan)

app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth_router)
app.include_router(comments_router)
app.include_router(dashboard_router)
app.include_router(admin_router)
app.include_router(etl_router)

@app.get("/health")
async def health():
    return {"status": "ok"}