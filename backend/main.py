from fastapi import FastAPI
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

# Import the routers and cache module
from .routers import players, habits, tasks, routines
from . import neural_vault_cache

# --- Scheduler ---
scheduler = AsyncIOScheduler()

app = FastAPI(
    title="Flickering Letters API",
    description="Backend API for the Flickering Letters application using FastAPI and Redis.",
    version="0.1.0",
)

# --- CORS Middleware ---
# Allow requests from your Next.js frontend development server
# Adjust origins if your frontend runs on a different port or domain
origins = [
    "http://localhost:3000", # Default Next.js dev port
    "http://localhost:3001", # Another common dev port
    # Add any other origins if necessary (e.g., deployed frontend URL)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allow all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"], # Allow all headers
)

# --- Include Routers ---
app.include_router(players.router)
app.include_router(habits.router)
app.include_router(tasks.router)
app.include_router(routines.router)


# --- Root Endpoint (Optional) ---
@app.get("/")
async def read_root():
    return {"message": "Welcome to the Flickering Letters FastAPI Backend!"}

# --- Startup/Shutdown Events ---
@app.on_event("startup")
async def startup_event():
    """Populate the Neural Vault cache and start the scheduler."""
    print("Server starting up...")

    # 1. Run initial cache update in the background
    # Give server a moment to start before potentially heavy I/O
    await asyncio.sleep(2)
    asyncio.create_task(run_initial_cache_update())

    # 2. Schedule daily cache updates
    # Run update_cache daily at 3:00 AM server time
    try:
        scheduler.add_job(
            neural_vault_cache.update_cache, # The function to run
            trigger=CronTrigger(hour=3, minute=0),
            id="daily_cache_update",
            name="Update Neural Vault cache daily",
            replace_existing=True,
        )
        scheduler.start()
        print("Scheduler started. Daily cache update scheduled for 3:00 AM.")
    except Exception as e:
        print(f"Error starting scheduler: {e}")


async def run_initial_cache_update():
    """Wrapper to run the potentially blocking cache update."""
    print("Running initial Neural Vault cache update...")
    try:
        # Since update_cache uses the blocking 'requests' library,
        # running it directly might block the event loop briefly.
        # For true async, use httpx in neural_vault_cache.py or run in executor:
        # loop = asyncio.get_running_loop()
        # await loop.run_in_executor(None, neural_vault_cache.update_cache)
        neural_vault_cache.update_cache() # Running sync directly for now
        print("Initial cache update task finished.")
    except Exception as e:
        print(f"Error during initial cache update: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown the scheduler gracefully."""
    print("Server shutting down...")
    if scheduler.running:
        scheduler.shutdown()
        print("Scheduler shut down.")

# --- How to Run ---
# Activate the virtual environment: source backend/venv/bin/activate
# Run the server: uvicorn backend.main:app --reload --port 8000
#
# Make sure Redis is running locally on localhost:6379 (or update .env)
