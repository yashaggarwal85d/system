from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import the routers
from .routers import players, habits, tasks, routines

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

# --- Optional: Add startup/shutdown events if needed ---
# @app.on_event("startup")
# async def startup_event():
#     # Initialize resources if needed (Redis pool is already created)
#     pass

# @app.on_event("shutdown")
# async def shutdown_event():
#     # Clean up resources if needed (e.g., close connections explicitly)
#     # redis_pool.disconnect() # redis-py >= 4.2 handles this automatically
#     pass

# --- How to Run ---
# Activate the virtual environment: source backend/venv/bin/activate
# Run the server: uvicorn backend.main:app --reload --port 8000
#
# Make sure Redis is running locally on localhost:6379 (or update .env)
