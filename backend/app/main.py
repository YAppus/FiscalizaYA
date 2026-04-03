from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import lifespan
from app.core.errors import register_exception_handlers
from app.routers import auth, categories, health, history, occurrences, priorities


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(health.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(categories.router, prefix="/api/v1")
app.include_router(priorities.router, prefix="/api/v1")
app.include_router(occurrences.router, prefix="/api/v1")
app.include_router(history.router, prefix="/api/v1")
