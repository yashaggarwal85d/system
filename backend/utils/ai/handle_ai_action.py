import json
import logging
from sqlalchemy.orm import Session
import uuid
from datetime import date, datetime
from typing import List, Dict, Any, Optional, Tuple
from pydantic import ValidationError
import redis.asyncio as redis

from utils.general import history_logger
from models import pg_models, redis_models
from utils.operations import crud_obj
from routers.tasks import task_key
from routers.habits import habit_key
from routers.routines import routine_key

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


async def handle_create_action(
    db: redis.Redis,
    pg_db: Session,
    username: str,
    entity_type: str,
    details: Dict[str, Any],
) -> Tuple[bool, Any]:
    details["id"] = str(uuid.uuid4())
    details["userId"] = username

    model_class: Optional[type] = None
    key_func: Optional[callable] = None
    history_type: Optional[pg_models.HistoryType] = None

    try:
        if entity_type == "task":
            model_class = redis_models.Task
            key_func = task_key
            history_type = pg_models.HistoryType.TASK

            if "due_date" not in details:
                details["due_date"] = date.today()
            else:
                details["due_date"] = datetime.strptime(details["due_date"], "%Y-%m-%d").date()
                if details["due_date"] < date.today():
                    details["due_date"] = date.today()
            
            if "completed" not in details:
                details["completed"] = False
            item_data = redis_models.Task(**redis_models.Task(**details).model_dump())

        elif entity_type == "habit":
            model_class = redis_models.Habit
            key_func = habit_key
            history_type = pg_models.HistoryType.HABIT

            if "start_date" not in details:
                details["start_date"] = date.today()
            if "last_completed" not in details:
                details["last_completed"] = date.today()

            item_data = redis_models.Habit(**redis_models.Habit(**details).model_dump())

        elif entity_type == "routine":
            model_class = redis_models.Routine
            key_func = routine_key
            history_type = pg_models.HistoryType.ROUTINE

            if "checklist" not in details:
                details["checklist"] = "[]"
            else:
                details["checklist"] = json.dumps(details["checklist"])

            if "start_date" not in details:
                details["start_date"] = date.today()
            if "last_completed" not in details:
                details["last_completed"] = date.today()

            item_data = redis_models.Routine(
                **redis_models.Routine(**details).model_dump()
            )
        else:
            return False, f"Unknown entity type: {entity_type}"

        created_item = await crud_obj.generic_create_item(
            item_data=item_data,
            current_username=username,
            db=db,
            key_func=key_func,
            model_class=model_class,
        )
        history_logger.log_history(
            pg_db,
            username,
            history_type,
            created_item.model_dump(),
            f"{entity_type.capitalize()} created via AI Chat: {created_item.name}",
        )
        return True, created_item
    except Exception as e:
        logger.error(f"Failed to create {entity_type} via AI chat: {e}", exc_info=True)
        return False, f"An unexpected error occurred during creation: {str(e)}"


async def handle_edit_action(
    db: redis.Redis,
    pg_db: Session,
    username: str,
    entity_type: str,
    changes: Dict[str, Any],
    existing_entities: List[Any],
) -> Tuple[bool, Any]:
    entity_id: Optional[str] = None

    try:
        for entity in existing_entities:
            if (str(entity.id) == str(changes.get("id"))) or (
                str(entity.name).lower() == str(changes.get("name")).lower()
            ):
                entity_id = entity.id
                update_model_class: Optional[type] = None
                history_type: Optional[pg_models.HistoryType] = None
                key_func: Optional[callable] = None
                model_class: Optional[type] = None

                if entity_type == "task":
                    update_model_class = redis_models.TaskUpdate
                    history_type = pg_models.HistoryType.TASK
                    key_func = task_key
                    model_class = redis_models.Task

                elif entity_type == "habit":
                    update_model_class = redis_models.HabitUpdate
                    history_type = pg_models.HistoryType.HABIT
                    key_func = habit_key
                    model_class = redis_models.Habit

                elif entity_type == "routine":
                    update_model_class = redis_models.RoutineUpdate
                    history_type = pg_models.HistoryType.ROUTINE
                    key_func = routine_key
                    model_class = redis_models.Routine

                    if "checklist" in changes:
                        changes["checklist"] = str(changes["checklist"])
                else:
                    return False, f"Unknown entity type: {entity_type}"

                if not update_model_class or not key_func or not model_class:
                    return False, "Internal configuration error for edit action."

                update_data = update_model_class(**changes)
                updated_entity = await crud_obj.generic_update_item(
                    item_id=entity_id,
                    item_update=update_data,
                    current_username=username,
                    db=db,
                    key_func=key_func,
                    model_class=model_class,
                )

                history_logger.log_history(
                    pg_db,
                    username,
                    history_type,
                    updated_entity.model_dump(),
                    f"{entity_type.capitalize()} updated via AI Chat: {changes}",
                )
                return True, updated_entity.name
        return False, "No match found for your edit request."
    except Exception as e:
        logger.error(
            f"Failed to update {entity_type} via AI chat: {e}",
            exc_info=True,
        )
        return False, f"An unexpected error occurred during update: {str(e)}"
