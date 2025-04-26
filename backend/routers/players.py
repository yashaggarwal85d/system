import logging
import random

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timezone
from typing import List
from fastapi import Query
from sqlalchemy.orm import Session
from jose import JWTError, jwt

import redis.asyncio as redis

from utils.general import notes_utils
from models import pydantic_models, redis_models

from models.pydantic_models import NotesEntry, Token, RefreshTokenRequest, TokenData
from utils.ai.data_format import parseResponseToJson
from utils.ai.handle_ai_action import handle_create_action
from utils.ai import prompts, gemini

from utils.database import pg_database, redis_database
from utils.operations import auth
from utils.general.history_logger import log_history, HistoryType
from utils.operations import crud_func
from routers.habits import habit_key
from routers.routines import routine_key
from routers.tasks import task_key

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/players",
    tags=["players"],
)


@router.post(
    "/signup", response_model=redis_models.Player, status_code=status.HTTP_201_CREATED
)
async def signup_player(
    player_data: redis_models.Player, pg_db: Session = Depends(pg_database.get_pg_db)
):
    r = await redis_database.get_redis_connection()

    existing_player = await redis_database.redis_get(
        r, f"player:{player_data.username}", redis_models.Player
    )
    if existing_player:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered, use another username",
        )

    hashed_password = auth.get_password_hash(player_data.password)
    player_to_save = player_data.model_copy(update={"password": hashed_password})

    await redis_database.redis_set(r, f"player:{player_data.username}", player_to_save)

    try:
        logger.info(f"Generating initial feed for player: {player_data.username}")
        profile_data = {
            "current_problems": player_to_save.current_problems,
            "ideal_future": player_to_save.ideal_future,
            "biggest_fears": player_to_save.biggest_fears,
            "past_issues": player_to_save.past_issues,
        }
        gemini_model = gemini.get_gemini_model()
        chat_session = gemini_model.start_chat()
        initial_prompt: str = prompts.generate_initial_feed(
            profile_data, player_to_save.mentor
        )
        response = await chat_session.send_message_async(initial_prompt)
        feed_objects = parseResponseToJson(response.text).get("objects", [])
        for feed_object in feed_objects:
            feed: dict = feed_object
            entity_type = feed.get("type", None)
            details = feed.get("details", None)
            if entity_type and details:
                await handle_create_action(
                    r, pg_db, player_data.username, entity_type, details
                )

    except Exception as e:
        logger.error(
            f"Error generating initial feed for player {player_data.username}: {e}",
            exc_info=True,
        )
    log_history(
        db=pg_db,
        user_id=player_data.username,
        history_type=HistoryType.PLAYER,
        data=player_to_save,
        comments="Player account created.",
    )
    return player_data.model_copy(update={"password": "hidden"})


@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    r = await redis_database.get_redis_connection()
    player = await redis_database.redis_get(
        r, f"player:{form_data.username}", redis_models.Player
    )

    if not player or not auth.verify_password(form_data.password, player.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": player.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }





@router.get("/", response_model=List[redis_models.Player])
async def read_all_players(
    current_user: auth.TokenData = Depends(auth.get_current_user),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        100, ge=1, le=1000, description="Maximum number of records to return"
    ),
):
    r = await redis_database.get_redis_connection()
    current_player_profile = await redis_database.redis_get(
        r, f"player:{current_user.username}", redis_models.Player
    )
    if not current_player_profile or not current_player_profile.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required.",
        )
    all_players = await redis_database.redis_get_all_by_prefix(
        r, "player:*", redis_models.Player
    )
    paginated_players = all_players[skip : skip + limit]
    players_out = [
        p.model_copy(update={"password": "hidden"}) for p in paginated_players
    ]
    return players_out


@router.get("/me", response_model=redis_models.Player)
async def read_players_me(current_username: str = Depends(auth.get_current_username)):
    r = await redis_database.get_redis_connection()
    player = await redis_database.redis_get(
        r, f"player:{current_username}", redis_models.Player
    )
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")

    return player.model_copy(update={"password": "hidden"})


@router.get("/me/history", response_model=List[pydantic_models.HistoryResponse])
async def get_player_history(
    current_username: str = Depends(auth.get_current_username),
    pg_db: Session = Depends(pg_database.get_pg_db),
):
    history_records = await crud_func.get_player_history_records(
        user_id=current_username, db=pg_db, limit=100
    )
    return history_records


@router.get("/me/full", response_model=pydantic_models.PlayerFullInfo)
async def read_player_full_info(
    current_username: str = Depends(auth.get_current_username),
):
    r = await redis_database.get_redis_connection()
    player = await redis_database.redis_get(
        r, f"player:{current_username}", redis_models.Player
    )
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")

    habits, tasks, routines = await get_all_redis(r, current_username)
    return pydantic_models.PlayerFullInfo(
        player=player.model_copy(update={"password": "hidden"}),
        habits=habits,
        tasks=tasks,
        routines=routines,
    )


@router.put("/me", response_model=redis_models.Player)
async def update_player_me(
    player_update: redis_models.PlayerUpdate,
    current_username: str = Depends(auth.get_current_username),
    pg_db: Session = Depends(pg_database.get_pg_db),
):
    r = await redis_database.get_redis_connection()
    existing_player = await redis_database.redis_get(
        r, f"player:{current_username}", redis_models.Player
    )
    if not existing_player:
        raise HTTPException(status_code=404, detail="Player not found")

    update_data = player_update.model_dump(exclude_unset=True)
    updated_player_data = await redis_database.redis_update(
        r, f"player:{current_username}", update_data, redis_models.Player
    )
    if not updated_player_data:
        raise HTTPException(status_code=404, detail="Player not found during update")

    update_details = player_update.model_dump(exclude_unset=True)
    log_history(
        db=pg_db,
        user_id=current_username,
        history_type=HistoryType.PLAYER,
        data=updated_player_data,
        comments=f"Player profile updated. Changes: {update_details}",
    )

    return updated_player_data.model_copy(update={"password": "hidden"})


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_player_me(
    current_username: str = Depends(auth.get_current_username),
    pg_db: Session = Depends(pg_database.get_pg_db),
) -> None:
    r = await redis_database.get_redis_connection()
    deleted_count = await redis_database.redis_delete(r, f"player:{current_username}")
    if deleted_count == 0:
        logger.warning(
            f"Logged player deletion for {current_username}, but Redis delete returned 0."
        )
        raise HTTPException(status_code=404, detail="Player not found for deletion")
    log_history(
        db=pg_db,
        user_id=current_username,
        history_type=HistoryType.PLAYER,
        data={"username": current_username},
        comments="Player account deleted.",
    )


@router.get("/{username}", response_model=redis_models.Player)
async def read_player(
    username: str, current_user: auth.TokenData = Depends(auth.get_current_user)
):
    r = await redis_database.get_redis_connection()
    current_player_profile = await redis_database.redis_get(
        r, f"player:{current_user.username}", redis_models.Player
    )
    if not current_player_profile or not current_player_profile.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required.",
        )

    player = await redis_database.redis_get(
        r, f"player:{username}", redis_models.Player
    )
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return player.model_copy(update={"password": "hidden"})


@router.get("/me/notes", response_model=NotesEntry)
async def get_random_note(
    current_user: auth.TokenData = Depends(auth.get_current_user),
):
    r = await redis_database.get_redis_connection()
    current_player_profile = await redis_database.redis_get(
        r, f"player:{current_user.username}", redis_models.Player
    )
    if not current_player_profile or not current_player_profile.obsidian_notes:
        raise HTTPException(
            status_code=404, detail="Player profile or Obsidian notes URL not found."
        )

    logger.debug(
        f"Fetching random note for {current_user.username} from {current_player_profile.obsidian_notes}"
    )

    try:
        owner, repo = notes_utils.extract_owner_repo(
            current_player_profile.obsidian_notes
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    tree = notes_utils.fetch_github_repo_tree(owner, repo)

    md_files = notes_utils.get_markdown_files(tree)

    if not md_files:
        logger.warning(
            f"No Markdown files found in repository {owner}/{repo} for player {current_user.username}"
        )
        raise HTTPException(
            status_code=404, detail="No Markdown files found in the linked repository."
        )

    selected_file_path = random.choice(md_files)
    logger.debug(f"Selected random file: {selected_file_path}")

    raw_content = notes_utils.fetch_file_content(owner, repo, selected_file_path)

    processed_content = notes_utils.process_note_content(raw_content, tree, owner, repo)

    return NotesEntry(fileName=selected_file_path, content=processed_content)


async def get_all_redis(db: redis.Redis, username: str):
    habits = await redis_database.redis_get_all_by_prefix(
        db, habit_key(username, "*"), redis_models.Habit
    )
    tasks = await redis_database.redis_get_all_by_prefix(
        db, task_key(username, "*"), redis_models.Task
    )
    routines = await redis_database.redis_get_all_by_prefix(
        db, routine_key(username, "*"), redis_models.Routine
    )
    return habits, tasks, routines
