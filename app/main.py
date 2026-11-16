"""FastAPI application entry point."""

from __future__ import annotations

import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

# Make sure project root is on path
sys.path.insert(0, str(Path(__file__).parent.parent))

from config import settings
from database import Database
from migrations.initial import MIGRATION_SQL
from modules.matching.router import router as matching_router
from modules.plans.router import router as plans_router
from modules.scholarships.router import router as scholarships_router
from modules.students.router import router as students_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await Database.initialize()
    # Apply migration
    import aiosqlite
    async with aiosqlite.connect(settings.database_url) as db:
        await db.executescript(MIGRATION_SQL)
        await db.commit()
    logger.info("Database ready")
    yield
    await Database.close()
    logger.info("Database closed")


app = FastAPI(
    title="Scholarship Agent API",
    description="AI-powered scholarship matching, evaluation, and planning system",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Error handlers — ASAAS frontend reads from `message`
@app.exception_handler(StarletteHTTPException)
async def http_error(request: Request, error: StarletteHTTPException) -> JSONResponse:
    return JSONResponse({"message": str(error.detail)}, status_code=error.status_code)


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, error: RequestValidationError) -> JSONResponse:
    first = error.errors()[0]
    field = ".".join(str(p) for p in first["loc"][1:])
    return JSONResponse(
        {"message": f"{field}: {first['msg']}" if field else first["msg"]},
        status_code=422,
    )


# Routers
app.include_router(students_router)
app.include_router(scholarships_router)
app.include_router(matching_router)
app.include_router(plans_router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "version": "1.0.0"}
