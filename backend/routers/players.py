import requests
import random
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta

from typing import List, Dict, Any

from pydantic import BaseModel
from .. import models, database, auth, neural_vault_cache


# --- Response Models ---

class PlayerFullInfo(BaseModel):
    player: models.Player # Consider creating a PlayerOut model without password
    habits: List[models.Habit]
    tasks: List[models.Task]
    routines: List[models.Routine]

class NeuralVaultEntry(BaseModel):
    fileName: str
    content: str


router = APIRouter(
    prefix="/players",
    tags=["players"],
)


# --- Neural Vault Endpoint (Uses Cache) ---

@router.get("/neural-vault", response_model=NeuralVaultEntry)
async def get_random_neural_vault_entry_cached():
    """Fetches a random markdown file entry from the local Neural Vault cache."""
    cached_entry = neural_vault_cache.get_random_cached_entry()

    if cached_entry is None:
        # Attempt to update cache if it's empty or failed to load
        print("Cache miss or error, attempting cache update...")
        try:
            neural_vault_cache.update_cache()
            cached_entry = neural_vault_cache.get_random_cached_entry()
            if cached_entry is None:
                 raise HTTPException(status_code=404, detail="Neural Vault cache is empty or could not be populated.")
        except Exception as e:
             # Catch potential errors during the update_cache call itself
             print(f"Error during cache update attempt: {e}")
             raise HTTPException(status_code=500, detail=f"Failed to update or access Neural Vault cache: {e}")

    filename, content = cached_entry
    return NeuralVaultEntry(fileName=filename, content=content)



# --- Authentication Endpoints ---

@router.post("/signup", response_model=models.Player, status_code=status.HTTP_201_CREATED)
async def signup_player(player_data: models.Player):
    """Creates a new player (user) account."""
    r = await database.get_redis_connection()
    # Check if username already exists
    existing_player = await database.redis_get(r, f"player:{player_data.username}", models.Player)
    if existing_player:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )

    # Hash the password before saving
    hashed_password = auth.get_password_hash(player_data.password)
    player_to_save = player_data.model_copy(update={"password": hashed_password})

    await database.redis_set(r, f"player:{player_data.username}", player_to_save)
    # Return the player data *without* the password
    return player_data.model_copy(update={"password": "hidden"}) # Or create a PlayerOut model

@router.post("/login")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Logs in a player and returns a JWT access token."""
    r = await database.get_redis_connection()
    player = await database.redis_get(r, f"player:{form_data.username}", models.Player)

    if not player or not auth.verify_password(form_data.password, player.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": player.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- Standard CRUD Endpoints (Protected) ---

# Dependency to get the current user's username from the token
async def get_current_username(token_data: auth.TokenData = Depends(auth.get_current_user)) -> str:
    return token_data.username

# Note: For simplicity, these CRUD operations use the username as the ID.
# You might want to use a separate unique ID (like UUID) in a real application.

@router.get("/", response_model=List[models.Player])
async def read_all_players(current_user: auth.TokenData = Depends(auth.get_current_user)): # Add admin check if needed
    """Gets a list of all registered players (potentially admin only)."""
    r = await database.get_redis_connection()
    all_players = await database.redis_get_all_by_prefix(r, "player", models.Player)
    # Exclude passwords from the response
    players_out = [p.model_copy(update={"password": "hidden"}) for p in all_players]
    return players_out

@router.get("/me", response_model=models.Player)
async def read_players_me(current_username: str = Depends(get_current_username)):
    """Gets the profile of the currently logged-in player."""
    r = await database.get_redis_connection()
    player = await database.redis_get(r, f"player:{current_username}", models.Player)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    # Return player data without password
    # Return player data without password
    return player.model_copy(update={"password": "hidden"})


@router.get("/me/full", response_model=PlayerFullInfo)
async def read_player_full_info(current_username: str = Depends(get_current_username)):
    """Gets the profile, habits, tasks, and routines for the currently logged-in player."""
    r = await database.get_redis_connection()

    # 1. Get Player Info
    player = await database.redis_get(r, f"player:{current_username}", models.Player)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")

    # 2. Get Habits (fetch all, then filter)
    all_habits = await database.redis_get_all_by_prefix(r, "habit", models.Habit)
    player_habits = [h for h in all_habits if h.userId == current_username]

    # 3. Get Tasks (fetch all, then filter)
    all_tasks = await database.redis_get_all_by_prefix(r, "task", models.Task)
    player_tasks = [t for t in all_tasks if t.userId == current_username]

    # 4. Get Routines (fetch all, then filter)
    all_routines = await database.redis_get_all_by_prefix(r, "routine", models.Routine)
    player_routines = [rt for rt in all_routines if rt.userId == current_username]

    # 5. Construct Response
    return PlayerFullInfo(
        player=player.model_copy(update={"password": "hidden"}), # Exclude password
        habits=player_habits,
        tasks=player_tasks,
        routines=player_routines
    )


@router.put("/me", response_model=models.Player)
async def update_player_me(player_update: models.PlayerUpdate, current_username: str = Depends(get_current_username)):
    """Updates the profile of the currently logged-in player (level, aura, description)."""
    # Uses PlayerUpdate model for input, preventing username/password changes here.
    r = await database.get_redis_connection()

    # Fetch existing player to update
    existing_player = await database.redis_get(r, f"player:{current_username}", models.Player)
    if not existing_player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Prepare update data from the PlayerUpdate model, excluding unset fields
    update_data = player_update.model_dump(exclude_unset=True)

    # Use the generic update function
    updated_player_data = await database.redis_update(r, f"player:{current_username}", update_data, models.Player)

    if not updated_player_data:
         raise HTTPException(status_code=404, detail="Player not found during update") # Should not happen if initial get succeeded

    # Return updated data without password
    return updated_player_data.model_copy(update={"password": "hidden"})


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_player_me(current_username: str = Depends(get_current_username)):
    """Deletes the currently logged-in player's account."""
    r = await database.get_redis_connection()
    deleted_count = await database.redis_delete(r, f"player:{current_username}")
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Player not found")
    # Consider deleting associated data (habits, tasks, routines) here as well
    return None

# --- Admin/Optional Endpoints (Example - Get specific player by username) ---
# You might want admin-only access control for these

@router.get("/{username}", response_model=models.Player)
async def read_player(username: str, current_admin_user: auth.TokenData = Depends(auth.get_current_user)): # Add admin check dependency
    """Gets a specific player by username (Admin only)."""
    # Add admin role check here
    r = await database.get_redis_connection()
    player = await database.redis_get(r, f"player:{username}", models.Player)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return player.model_copy(update={"password": "hidden"})
