from fastapi import FastAPI
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger


from .routers import players, habits, tasks, routines
from . import neural_vault_cache
from . import scheduler as app_scheduler


app = FastAPI(
    title="Flickering Letters API",
    description="Backend API for the Flickering Letters application using FastAPI and Redis.",
    version="0.1.0",
)


origins = [
    "http://localhost:3000",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(players.router)
app.include_router(habits.router)
app.include_router(tasks.router)
app.include_router(routines.router)


@app.get("/")
async def read_root():
    return {"message": "Welcome to the Flickering Letters FastAPI Backend!"}


@app.on_event("startup")
async def startup_event():
    """Populate the Neural Vault cache and start the scheduler."""
    print("Server starting up...")

    await asyncio.sleep(2)
    asyncio.create_task(run_initial_cache_update())

    app_scheduler.start_scheduler()


async def run_initial_cache_update():
    """Wrapper to run the potentially blocking cache update."""
    print("Running initial Neural Vault cache update...")
    try:

        neural_vault_cache.update_cache()
        print("Initial cache update task finished.")
    except Exception as e:
        print(f"Error during initial cache update: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown the scheduler gracefully."""
    print("Server shutting down...")
    app_scheduler.stop_scheduler()


#
