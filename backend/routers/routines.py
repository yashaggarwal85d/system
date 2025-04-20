import logging

from models import redis_models
from utils.operations.auth import get_current_username
from utils.operations.crud_obj import create_crud_router

logger = logging.getLogger(__name__)

def routine_key(user_id: str, routine_id: str) -> str:
    return f"routine:{user_id}:{routine_id}"

def user_routines_pattern(user_id: str) -> str:
    return f"routine:{user_id}"

router = create_crud_router(
    prefix="routines",
    tags=["routines"],
    key_func=routine_key,
    pattern_func=user_routines_pattern,
    model_class=redis_models.Routine,
    update_model_class=redis_models.RoutineUpdate, 
    get_username_dependency=get_current_username
)
