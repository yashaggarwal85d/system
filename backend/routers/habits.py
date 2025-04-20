import logging

from models import redis_models
from utils.operations.auth import get_current_username
from utils.operations.crud_obj import create_crud_router

logger = logging.getLogger(__name__)

def habit_key(user_id: str, habit_id: str) -> str:
    return f"habit:{user_id}:{habit_id}"

def user_habits_pattern(user_id: str) -> str:
    return f"habit:{user_id}"

router = create_crud_router(
    prefix="habits",
    tags=["habits"],
    key_func=habit_key,
    pattern_func=user_habits_pattern,
    model_class=redis_models.Habit,
    update_model_class=redis_models.HabitUpdate, 
    get_username_dependency=get_current_username
)
