from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel

from .. import models, database, auth
from .players import get_current_username # Reuse the dependency

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"],
    dependencies=[Depends(auth.get_current_user)], # Protect all routes
)

# Redis key prefix for tasks associated with a user
def task_key(user_id: str, task_id: str) -> str:
    return f"task:{user_id}:{task_id}"

# Redis key pattern for scanning user's tasks
def user_tasks_pattern(user_id: str) -> str:
    return f"task:{user_id}:*"

# Optional Pydantic model for updates
class TaskUpdate(BaseModel):
    name: Optional[str] = None
    due_date: Optional[str] = None
    aura_value: Optional[int] = None

@router.post("/", response_model=models.Task, status_code=status.HTTP_201_CREATED)
async def create_task(task_data: models.Task, current_username: str = Depends(get_current_username)):
    """Creates a new task for the current user."""
    r = await database.get_redis_connection()
    if task_data.userId != current_username:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create task for another user.",
        )

    key = task_key(current_username, task_data.id)
    await database.redis_set(r, key, task_data)
    return task_data

@router.get("/", response_model=List[models.Task])
async def read_user_tasks(current_username: str = Depends(get_current_username)):
    """Lists all tasks for the current user."""
    r = await database.get_redis_connection()
    pattern = user_tasks_pattern(current_username)
    tasks = await database.redis_get_all_by_prefix(r, pattern, models.Task)
    return tasks

@router.get("/{task_id}", response_model=models.Task)
async def read_task(task_id: str, current_username: str = Depends(get_current_username)):
    """Gets a specific task by ID for the current user."""
    r = await database.get_redis_connection()
    key = task_key(current_username, task_id)
    task = await database.redis_get(r, key, models.Task)
    if task is None or task.userId != current_username:
        raise HTTPException(status_code=404, detail="Task not found or not authorized")
    return task

@router.put("/{task_id}", response_model=models.Task)
async def update_task(task_id: str, task_update: TaskUpdate, current_username: str = Depends(get_current_username)):
    """Updates a specific task by ID for the current user."""
    r = await database.get_redis_connection()
    key = task_key(current_username, task_id)

    updated_task = await database.redis_update(
        r, key, task_update.model_dump(exclude_unset=True), models.Task
    )

    if updated_task is None:
        raise HTTPException(status_code=404, detail="Task not found or update failed")
    if updated_task.userId != current_username:
         raise HTTPException(status_code=500, detail="Internal error during update")

    return updated_task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: str, current_username: str = Depends(get_current_username)):
    """Deletes a specific task by ID for the current user."""
    r = await database.get_redis_connection()
    key = task_key(current_username, task_id)
    # Verify ownership before deleting
    task = await database.redis_get(r, key, models.Task)
    if task is None or task.userId != current_username:
         raise HTTPException(status_code=404, detail="Task not found or not authorized")

    deleted_count = await database.redis_delete(r, key)
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return None
