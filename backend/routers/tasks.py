import logging

from models import redis_models
from utils.operations.auth import get_current_username
from utils.operations.crud_obj import create_crud_router

logger = logging.getLogger(__name__)

def task_key(user_id: str, task_id: str) -> str:
    return f"task:{user_id}:{task_id}"

def user_tasks_pattern(user_id: str) -> str:
    return f"task:{user_id}"

router = create_crud_router(
    prefix="tasks",
    tags=["tasks"],
    key_func=task_key,
    pattern_func=user_tasks_pattern,
    model_class=redis_models.Task,
    update_model_class=redis_models.TaskUpdate, 
    get_username_dependency=get_current_username
)
