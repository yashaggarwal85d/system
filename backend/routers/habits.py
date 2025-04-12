from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel

from .. import models, database, auth
from .players import get_current_username 

router = APIRouter(
    prefix="/habits",
    tags=["habits"],
    dependencies=[Depends(auth.get_current_user)], 
)


def habit_key(user_id: str, habit_id: str) -> str:
    return f"habit:{user_id}:{habit_id}"


def user_habits_pattern(user_id: str) -> str:
    return f"habit:{user_id}:*"


@router.post("/", response_model=models.Habit, status_code=status.HTTP_201_CREATED)
async def create_habit(habit_data: models.Habit, current_username: str = Depends(get_current_username)):
    """Creates a new habit for the current user."""
    r = await database.get_redis_connection()
    
    if habit_data.userId != current_username:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create habit for another user.",
        )

    key = habit_key(current_username, habit_data.id)
    await database.redis_set(r, key, habit_data)
    return habit_data

@router.get("/", response_model=List[models.Habit])
async def read_user_habits(current_username: str = Depends(get_current_username)):
    """Lists all habits for the current user."""
    r = await database.get_redis_connection()
    pattern = user_habits_pattern(current_username)
    habits = await database.redis_get_all_by_prefix(r, pattern, models.Habit)
    return habits


@router.get("/{habit_id}", response_model=models.Habit)
async def read_habit(habit_id: str, current_username: str = Depends(get_current_username)):
    """Gets a specific habit by ID for the current user."""
    r = await database.get_redis_connection()
    key = habit_key(current_username, habit_id)
    habit = await database.redis_get(r, key, models.Habit)
    if habit is None:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    if habit.userId != current_username:
         raise HTTPException(status_code=403, detail="Not authorized to access this habit")
    return habit

@router.put("/{habit_id}", response_model=models.Habit)
async def update_habit(habit_id: str, habit_update: models.HabitUpdate, current_username: str = Depends(get_current_username)):
    """Updates a specific habit by ID for the current user."""
    r = await database.get_redis_connection()
    key = habit_key(current_username, habit_id)

    
    updated_habit = await database.redis_update(
        r, key, habit_update.model_dump(exclude_unset=True), models.Habit
    )

    if updated_habit is None:
        raise HTTPException(status_code=404, detail="Habit not found or update failed")

    
    if updated_habit.userId != current_username:
         
         
         raise HTTPException(status_code=500, detail="Internal error during update")

    return updated_habit


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_habit(habit_id: str, current_username: str = Depends(get_current_username)):
    """Deletes a specific habit by ID for the current user."""
    r = await database.get_redis_connection()
    key = habit_key(current_username, habit_id)
    
    habit = await database.redis_get(r, key, models.Habit)
    if habit is None or habit.userId != current_username:
         raise HTTPException(status_code=404, detail="Habit not found or not authorized")

    deleted_count = await database.redis_delete(r, key)
    if deleted_count == 0:
        
        raise HTTPException(status_code=404, detail="Habit not found")
    return None
