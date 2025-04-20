import logging

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

from models.pg_models import Base
from utils.database.pg_database import engine
from routers import players, habits, tasks, routines, chat, jobs
from utils.general import scheduler as app_scheduler
from utils.general.get_env import getenv

app = FastAPI(
    title="Ascend AI API",
    description="Backend API for the Ascend AI.",
    version="1.0.1",
)

allowed_origins_str = getenv("ALLOWED_ORIGINS", "")
origins = [
    origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allow_headers=["*"],
)
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

app.include_router(players.router)
app.include_router(habits.router)
app.include_router(tasks.router)
app.include_router(routines.router)
app.include_router(chat.router)
app.include_router(jobs.router)


@app.on_event("startup")
async def startup_event():
    logger.info("Creating database tables if they don't exist...")
    try:
        Base.metadata.create_all(bind=engine)
        app_scheduler.start_scheduler()
        logger.info("Database tables checked/created successfully.")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}", exc_info=True)


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Server shutting down...")
    app_scheduler.stop_scheduler()
