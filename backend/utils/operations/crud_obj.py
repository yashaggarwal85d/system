import logging
from typing import List, Type, Dict
from fastapi import Depends, status, APIRouter, Body
import redis.asyncio as redis
from sqlalchemy.orm import Session

from utils.operations.crud_func import (
    generic_create_item,
    generic_delete_item,
    generic_read_item,
    generic_read_user_items,
    generic_update_item,
)

from utils.database import pg_database, redis_database
from utils.operations import auth
from utils.general.history_logger import log_history, HistoryType
from utils.operations.crud_types import (
    ModelType,
    UpdateSchemaType,
    GetCurrentUsernameFunc,
    KeyFunc,
    PatternFunc,
)

logger = logging.getLogger(__name__)




def create_crud_router(
    prefix: str,
    tags: List[str],
    key_func: KeyFunc,
    pattern_func: PatternFunc,
    model_class: Type[ModelType],
    update_model_class: Type[UpdateSchemaType],
    get_username_dependency: GetCurrentUsernameFunc,
) -> APIRouter:
    router = APIRouter(
        prefix=f"/{prefix}",
        tags=tags,
        dependencies=[Depends(auth.get_current_user)],
    )
    history_type_map: Dict[str, HistoryType] = {
        "tasks": HistoryType.TASK,
        "habits": HistoryType.HABIT,
        "routines": HistoryType.ROUTINE,
    }
    crud_history_type = history_type_map.get(prefix)
    if crud_history_type is None:
        logger.warning(
            f"No HistoryType mapping found for CRUD prefix '{prefix}'. History logging will be disabled for this router."
        )

    @router.post("/", response_model=model_class, status_code=status.HTTP_201_CREATED)
    async def create_item_endpoint(
        item_data: model_class = Body(...),   # type: ignore
        current_username: str = Depends(get_username_dependency),
        db: redis.Redis = Depends(redis_database.get_redis_connection),
        pg_db: Session = Depends(pg_database.get_pg_db),
    ):
        created_item = await generic_create_item(
            item_data, current_username, db, key_func, model_class
        )
        if crud_history_type:
            log_history(
                db=pg_db,
                user_id=current_username,
                history_type=crud_history_type,
                data=created_item,
                comments=f"Item created: {created_item.name if hasattr(created_item, 'name') else created_item.id}",
            )
        return created_item

    @router.get("/", response_model=List[model_class])
    async def read_items_endpoint(
        current_username: str = Depends(get_username_dependency),
        db: redis.Redis = Depends(redis_database.get_redis_connection),
    ):
        return await generic_read_user_items(
            current_username, db, pattern_func, model_class
        )

    @router.get("/{item_id}", response_model=model_class)
    async def read_item_endpoint(
        item_id: str,
        current_username: str = Depends(get_username_dependency),
        db: redis.Redis = Depends(redis_database.get_redis_connection),
    ):
        return await generic_read_item(
            item_id, current_username, db, key_func, model_class
        )

    @router.put("/{item_id}", response_model=model_class)
    async def update_item_endpoint(
        item_id: str,
        item_update: update_model_class = Body(...),   # type: ignore
        current_username: str = Depends(get_username_dependency),
        db: redis.Redis = Depends(redis_database.get_redis_connection),
        pg_db: Session = Depends(pg_database.get_pg_db),
    ):
        updated_item = await generic_update_item(
            item_id, item_update, current_username, db, key_func, model_class
        )

        if crud_history_type:
            update_details = item_update.model_dump(exclude_unset=True)
            log_history(
                db=pg_db,
                user_id=current_username,
                history_type=crud_history_type,
                data=updated_item,
                comments=f"Item updated. Changes: {update_details}",
            )
        return updated_item

    @router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
    async def delete_item_endpoint(
        item_id: str,
        current_username: str = Depends(get_username_dependency),
        db: redis.Redis = Depends(redis_database.get_redis_connection),
        pg_db: Session = Depends(pg_database.get_pg_db),
    ):
        if crud_history_type:
            item_to_log = await redis_database.redis_get(
                db, key_func(current_username, item_id), model_class
            )
            log_history(
                db=pg_db,
                user_id=current_username,
                history_type=crud_history_type,
                data=item_to_log if item_to_log else {"id": item_id},
                comments=f"Item deleted: {item_to_log.name}",
            )
        await generic_delete_item(item_id, current_username, db, key_func, model_class)

    return router
