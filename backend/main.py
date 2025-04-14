import logging
import asyncio
import logging
import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware # <-- Import the middleware

from .routers import players, habits, tasks, routines
from .jobs import neural_vault_cache
from .utils import scheduler as app_scheduler
from .jobs.penalise import check_overdue_and_penalize

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

dotenv_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=dotenv_path)

app = FastAPI(
    title="Flickering Letters API",
    description="Backend API for the Flickering Letters application using FastAPI and Redis.",
    version="0.1.0",
)

allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")
origins = [
    origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

app.include_router(players.router)
app.include_router(habits.router)
app.include_router(tasks.router)
app.include_router(routines.router)


@app.get("/")
async def read_root():
    return {"message": "Welcome to the Flickering Letters FastAPI Backend!"}


@app.on_event("startup")
async def startup_event():
    """Start the scheduler and run initial cache update."""
    logger.info("Server starting up...")
    app_scheduler.start_scheduler()
    logger.info("Scheduling initial tasks (Cache Update & Penalize Check)...")
    asyncio.create_task(initial_cache_update_task())
    asyncio.create_task(initial_penalize_check_task())


async def initial_cache_update_task():
    """Task to run the initial cache update."""
    logger.info("Running initial Neural Vault cache update (async)...")
    try:
        await neural_vault_cache.update_cache_async()
        logger.info("Initial cache update task finished.")
    except Exception as e:
        logger.error(f"Error during initial cache update: {e}", exc_info=True)


async def initial_penalize_check_task():
    """Task to run the initial penalize check."""
    logger.info("Running initial penalize check (async)...")
    try:
        await check_overdue_and_penalize()
        logger.info("Initial penalize check task finished.")
    except Exception as e:
        logger.error(f"Error during initial penalize check: {e}", exc_info=True)


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown the scheduler gracefully."""
    logger.info("Server shutting down...")
    app_scheduler.stop_scheduler()
