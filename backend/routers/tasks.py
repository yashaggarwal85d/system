import logging

from .. import models
from .players import get_current_username 
from ..utils.crud_utils import create_crud_router
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
    model_class=models.Task,
    update_model_class=models.TaskUpdate, 
    get_username_dependency=get_current_username
)
