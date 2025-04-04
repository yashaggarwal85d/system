from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel

from .. import models, database, auth
from .players import get_current_username # Reuse the dependency

router = APIRouter(
    prefix="/routines",
    tags=["routines"],
    dependencies=[Depends(auth.get_current_user)], # Protect all routes
)

# Redis key prefix for routines associated with a user
def routine_key(user_id: str, routine_id: str) -> str:
    return f"routine:{user_id}:{routine_id}"

# Redis key pattern for scanning user's routines
def user_routines_pattern(user_id: str) -> str:
    return f"routine:{user_id}:*"

# Optional Pydantic model for updates
class RoutineUpdate(BaseModel):
    name: Optional[str] = None
    aura: Optional[int] = None
    next_due_date: Optional[str] = None
    start_date: Optional[str] = None
    occurence: Optional[models.Occurence] = None
    x_occurence: Optional[int] = None
    repeat: Optional[int] = None
    checklist: Optional[str] = None # Allow updating the checklist string

@router.post("/", response_model=models.Routine, status_code=status.HTTP_201_CREATED)
async def create_routine(routine_data: models.Routine, current_username: str = Depends(get_current_username)):
    """Creates a new routine for the current user."""
    r = await database.get_redis_connection()
    if routine_data.userId != current_username:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create routine for another user.",
        )

    key = routine_key(current_username, routine_data.id)
    await database.redis_set(r, key, routine_data)
    return routine_data

@router.get("/", response_model=List[models.Routine])
async def read_user_routines(current_username: str = Depends(get_current_username)):
    """Lists all routines for the current user."""
    r = await database.get_redis_connection()
    pattern = user_routines_pattern(current_username)
    routines = await database.redis_get_all_by_prefix(r, pattern, models.Routine)
    return routines

@router.get("/{routine_id}", response_model=models.Routine)
async def read_routine(routine_id: str, current_username: str = Depends(get_current_username)):
    """Gets a specific routine by ID for the current user."""
    r = await database.get_redis_connection()
    key = routine_key(current_username, routine_id)
    routine = await database.redis_get(r, key, models.Routine)
    if routine is None or routine.userId != current_username:
        raise HTTPException(status_code=404, detail="Routine not found or not authorized")
    return routine

@router.put("/{routine_id}", response_model=models.Routine)
async def update_routine(routine_id: str, routine_update: RoutineUpdate, current_username: str = Depends(get_current_username)):
    """Updates a specific routine by ID for the current user."""
    r = await database.get_redis_connection()
    key = routine_key(current_username, routine_id)

    updated_routine = await database.redis_update(
        r, key, routine_update.model_dump(exclude_unset=True), models.Routine
    )

    if updated_routine is None:
        raise HTTPException(status_code=404, detail="Routine not found or update failed")
    if updated_routine.userId != current_username:
         raise HTTPException(status_code=500, detail="Internal error during update")

    return updated_routine

@router.delete("/{routine_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_routine(routine_id: str, current_username: str = Depends(get_current_username)):
    """Deletes a specific routine by ID for the current user."""
    r = await database.get_redis_connection()
    key = routine_key(current_username, routine_id)
    # Verify ownership before deleting
    routine = await database.redis_get(r, key, models.Routine)
    if routine is None or routine.userId != current_username:
         raise HTTPException(status_code=404, detail="Routine not found or not authorized")

    deleted_count = await database.redis_delete(r, key)
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Routine not found")
    return None
