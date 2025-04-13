import logging

from .. import models
from .players import get_current_username 
from ..utils.crud_utils import create_crud_router

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
    model_class=models.Habit,
    update_model_class=models.HabitUpdate, 
    get_username_dependency=get_current_username
)
