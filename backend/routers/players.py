import logging
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from typing import List
from fastapi import Query

from ..utils import auth, database
from ..jobs import neural_vault_cache
from .. import models

logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/players",
    tags=["players"],
)

@router.get("/neural-vault", response_model=models.NeuralVaultEntry)
async def get_random_neural_vault_entry_cached_async(background_tasks: BackgroundTasks):
    """
    Fetches a random markdown file entry from the local Neural Vault cache asynchronously.
    Always attempts to return an entry if the cache is populated, even if the background update fails.
    Schedules a cache update to run in the background after responding.
    Returns 404 only if the cache is empty at the time of the request.
    """
    logger.debug("Attempting to fetch random entry from Neural Vault cache...")
    cached_entry = await neural_vault_cache.get_random_cached_entry_async()
    
    logger.debug("Scheduling background task for Neural Vault cache update.")
    background_tasks.add_task(neural_vault_cache.update_cache_async)

    if cached_entry:
        logger.info("Neural Vault cache hit. Returning existing cached entry.")
        filename, content = cached_entry
        return models.NeuralVaultEntry(fileName=filename, content=content)
    else:
        logger.warning(
            "Neural Vault cache miss. Cache is empty or inaccessible. Returning 404."
        )
        raise HTTPException(
            status_code=404,
            detail="Neural Vault cache is currently empty. An update has been scheduled.",
        )


@router.post(
    "/signup", response_model=models.Player, status_code=status.HTTP_201_CREATED
)
async def signup_player(player_data: models.Player):
    """Creates a new player (user) account."""
    r = await database.get_redis_connection()

    existing_player = await database.redis_get(
        r, f"player:{player_data.username}", models.Player
    )
    if existing_player:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )

    hashed_password = auth.get_password_hash(player_data.password)
    player_to_save = player_data.model_copy(update={"password": hashed_password})

    await database.redis_set(r, f"player:{player_data.username}", player_to_save)

    return player_data.model_copy(update={"password": "hidden"})


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


async def get_current_username(
    token_data: auth.TokenData = Depends(auth.get_current_user),
) -> str:
    return token_data.username


@router.get("/", response_model=List[models.Player])
async def read_all_players(
    current_user: auth.TokenData = Depends(auth.get_current_user),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        100, ge=1, le=1000, description="Maximum number of records to return"
    ),
):
    """
    Gets a paginated list of all registered players. Requires admin privileges.
    """
    r = await database.get_redis_connection()

    current_player_profile = await database.redis_get(
        r, f"player:{current_user.username}", models.Player
    )
    if not current_player_profile or not current_player_profile.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required.",
        )

    all_players = await database.redis_get_all_by_prefix(r, "player:*", models.Player)

    paginated_players = all_players[skip : skip + limit]

    players_out = [
        p.model_copy(update={"password": "hidden"}) for p in paginated_players
    ]
    return players_out


@router.get("/me", response_model=models.Player)
async def read_players_me(current_username: str = Depends(get_current_username)):
    """Gets the profile of the currently logged-in player."""
    r = await database.get_redis_connection()
    player = await database.redis_get(r, f"player:{current_username}", models.Player)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")

    return player.model_copy(update={"password": "hidden"})


@router.get("/me/full", response_model=models.PlayerFullInfo)
async def read_player_full_info(current_username: str = Depends(get_current_username)):
    """Gets the profile, habits, tasks, and routines for the currently logged-in player."""
    r = await database.get_redis_connection()

    player = await database.redis_get(r, f"player:{current_username}", models.Player)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")

    habit_pattern = f"habit:{current_username}:*"
    player_habits = await database.redis_get_all_by_prefix(
        r, habit_pattern, models.Habit
    )

    task_pattern = f"task:{current_username}:*"
    player_tasks = await database.redis_get_all_by_prefix(r, task_pattern, models.Task)

    routine_pattern = f"routine:{current_username}:*"
    player_routines = await database.redis_get_all_by_prefix(
        r, routine_pattern, models.Routine
    )

    return models.PlayerFullInfo(
        player=player.model_copy(update={"password": "hidden"}),
        habits=player_habits,
        tasks=player_tasks,
        routines=player_routines,
    )


@router.put("/me", response_model=models.Player)
async def update_player_me(
    player_update: models.PlayerUpdate,
    current_username: str = Depends(get_current_username),
):
    """Updates the profile of the currently logged-in player (level, aura, description)."""

    r = await database.get_redis_connection()

    existing_player = await database.redis_get(
        r, f"player:{current_username}", models.Player
    )
    if not existing_player:
        raise HTTPException(status_code=404, detail="Player not found")

    update_data = player_update.model_dump(exclude_unset=True)

    updated_player_data = await database.redis_update(
        r, f"player:{current_username}", update_data, models.Player
    )

    if not updated_player_data:
        raise HTTPException(status_code=404, detail="Player not found during update")

    return updated_player_data.model_copy(update={"password": "hidden"})


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_player_me(current_username: str = Depends(get_current_username)):
    """Deletes the currently logged-in player's account."""
    r = await database.get_redis_connection()
    deleted_count = await database.redis_delete(r, f"player:{current_username}")
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Player not found")

    return None


@router.get("/{username}", response_model=models.Player)
async def read_player(
    username: str, current_user: auth.TokenData = Depends(auth.get_current_user)
):
    """
    Gets a specific player by username.
    TODO: Implement RBAC (Role-Based Access Control) - Should only be accessible by admins.
    """
    r = await database.get_redis_connection()

    current_player_profile = await database.redis_get(
        r, f"player:{current_user.username}", models.Player
    )
    if not current_player_profile or not current_player_profile.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required.",
        )

    player = await database.redis_get(r, f"player:{username}", models.Player)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return player.model_copy(update={"password": "hidden"})
