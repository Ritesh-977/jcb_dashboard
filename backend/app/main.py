import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# --- NEW IMPORTS ---
from fastapi.staticfiles import StaticFiles 
from fastapi.responses import FileResponse 

from app.routes.auth import router as auth_router
from app.routes.comments import router as comments_router
from app.routes.dashboard import router as dashboard_router
from app.routes.admin import router as admin_router
from app.db import init_connection_pool

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_connection_pool()
    yield

app = FastAPI(title="JCB Dashboard API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # dashboard (vite default)
        "http://localhost:5174",  # dashboard (vite alt)
        "http://localhost:5175",  # admin frontend
        "http://localhost:5176",  # admin frontend (alt)
        "https://jcb-dashboard.vercel.app",
        os.getenv("FRONTEND_URL", ""),
        os.getenv("ADMIN_FRONTEND_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(comments_router)
app.include_router(dashboard_router)
app.include_router(admin_router)

@app.get("/health")
async def health():
    return {"status": "ok"}

# =========================================================
# NEW CODE TO SERVE REACT FRONTEND IN SNOWFLAKE CONTAINER
# =========================================================

# Locate the compiled React dist folder. 
# Based on our Dockerfile, it will be at /app/frontend/dist
dist_path = os.path.join(os.path.dirname(__file__), "../../frontend/dist")

# Mount the assets directory so CSS/JS load properly
if os.path.exists(dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_path, "assets")), name="assets")

# Catch-all route to serve index.html for React Router
API_PREFIXES = ("api/", "auth/", "comments", "dashboard", "admin", "health")

@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    if full_path.startswith(API_PREFIXES):
        return {"error": "API route not found"}

    index_file = os.path.join(dist_path, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"error": "Frontend build not found. Did you run 'npm run build'?"}