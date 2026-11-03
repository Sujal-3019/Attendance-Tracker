import asyncio
import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints.health import router as health_router
from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.db.session import SessionLocal
from app.api.deps import get_db
from app.services.attendance import mark_absences_for_all_organizations


settings = get_settings()
configure_logging()
logger = logging.getLogger(__name__)


def _mark_scheduled_absences() -> None:
    with SessionLocal() as db:
        mark_absences_for_all_organizations(db)


async def _run_absence_scheduler() -> None:
    while True:
        try:
            await asyncio.to_thread(_mark_scheduled_absences)
        except Exception:
            logger.exception("Scheduled attendance absence marking failed")
        # shortcut: polling runs every 60 seconds; use an external scheduler if marking must continue while the API is down.
        await asyncio.sleep(60)


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncIterator[None]:
    scheduler = (
        asyncio.create_task(_run_absence_scheduler())
        if get_db not in application.dependency_overrides
        else None
    )
    try:
        yield
    finally:
        if scheduler is not None:
            scheduler.cancel()
            try:
                await scheduler
            except asyncio.CancelledError:
                pass


app = FastAPI(
    title="Attendance Tracker API",
    description="Backend API for the Attendance Tracker application.",
    version="1.0.0",
    openapi_url="/api/v1/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)
app.include_router(api_router, prefix="/api/v1")
app.include_router(health_router)
