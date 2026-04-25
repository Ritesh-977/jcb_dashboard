from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
    allow_origins=["*"],
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