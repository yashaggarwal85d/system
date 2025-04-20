import logging
from typing import List, Type
from fastapi import HTTPException, status
import redis.asyncio as redis
from sqlalchemy.orm import Session

from models import pg_models, redis_models

from utils.operations.crud_types import (
    CreateSchemaType,
    KeyFunc,
    ModelType,
    PatternFunc,
    UpdateSchemaType,
)
from utils.database import redis_database

logger = logging.getLogger(__name__)


async def generic_create_item(
    item_data: CreateSchemaType,
    current_username: str,
    db: redis.Redis,
    key_func: KeyFunc,
    model_class: Type[ModelType],
) -> ModelType:

    if not hasattr(item_data, "userId") or not hasattr(item_data, "id"):
        logger.error("Item data missing 'userId' or 'id' attribute for creation.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid item data structure.",
        )

    if item_data.userId != current_username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create item for another user.",
        )
    key = key_func(current_username, item_data.id)
    await redis_database.redis_set(db, key, item_data)

    if isinstance(item_data, model_class):
        return item_data
    else:
        try:
            validated_item = model_class.model_validate(item_data.model_dump())
            return validated_item
        except Exception as e:
            logger.error(
                f"Failed to validate created item against model {model_class.__name__}: {e}"
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process created item.",
            )


async def generic_read_user_items(
    current_username: str,
    db: redis.Redis,
    pattern_func: PatternFunc,
    model_class: Type[ModelType],
) -> List[ModelType]:
    pattern = pattern_func(current_username)
    items = await redis_database.redis_get_all_by_prefix(db, pattern, model_class)
    return items


async def generic_read_item(
    item_id: str,
    current_username: str,
    db: redis.Redis,
    key_func: KeyFunc,
    model_class: Type[ModelType],
) -> ModelType:
    key = key_func(current_username, item_id)
    item = await redis_database.redis_get(db, key, model_class)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    if not hasattr(item, "userId"):
        logger.error(
            f"Item retrieved from key {key} missing 'userId' attribute for authorization."
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Item data structure error.",
        )

    if item.userId != current_username:

        logger.warning(
            f"Authorization failed: User {current_username} attempted to access item {item_id} owned by {item.userId}"
        )
        raise HTTPException(
            status_code=403, detail="Not authorized to access this item"
        )
    return item


async def generic_update_item(
    item_id: str,
    item_update: UpdateSchemaType,
    current_username: str,
    db: redis.Redis,
    key_func: KeyFunc,
    model_class: Type[ModelType],
) -> ModelType:
    key = key_func(current_username, item_id)
    updated_item = await redis_database.redis_update(
        db, key, item_update.model_dump(exclude_unset=True), model_class
    )

    if updated_item is None:
        logger.error(f"Update failed unexpectedly for key {key} after existence check.")
        raise HTTPException(status_code=500, detail="Item update failed unexpectedly")

    return updated_item


async def generic_delete_item(
    item_id: str,
    current_username: str,
    db: redis.Redis,
    key_func: KeyFunc,
    model_class: Type[ModelType],
) -> None:
    key = key_func(current_username, item_id)

    item_to_delete = await redis_database.redis_get(db, key, model_class)
    if item_to_delete is None:
        raise HTTPException(status_code=404, detail="Item not found")

    deleted_count = await redis_database.redis_delete(db, key)
    if deleted_count == 0:

        raise HTTPException(
            status_code=404, detail="Item not found (possibly deleted concurrently)"
        )
    return None


async def get_player_history_records(
    user_id: str, db: Session, limit: int = 25
) -> List[pg_models.History]:
    history_records = (
        db.query(pg_models.History)
        .filter(pg_models.History.user_id == user_id)
        .order_by(pg_models.History.timestamp.desc())
        .limit(limit)
        .all()
    )
    return history_records


async def get_all_players(db: redis.Redis) -> List[redis_models.Player]:
    players = await redis_database.redis_get_all_by_prefix(
        db, "player:*", redis_models.Player
    )
    return players
