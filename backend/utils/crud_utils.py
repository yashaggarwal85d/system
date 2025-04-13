import logging
from typing import List, Type, TypeVar, Callable
from fastapi import Depends, HTTPException, status, APIRouter, Body
from pydantic import BaseModel
import redis.asyncio as redis

from . import auth, database

logger = logging.getLogger(__name__)

ModelType = TypeVar("ModelType", bound=BaseModel)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)
GetCurrentUsernameFunc = Callable[..., str]
KeyFunc = Callable[[str, str], str]
PatternFunc = Callable[[str], str]


async def generic_create_item(
    item_data: CreateSchemaType,
    current_username: str,
    db: redis.Redis,
    key_func: KeyFunc,
    model_class: Type[ModelType],
) -> ModelType:
    """Generic function to create an item."""

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
    await database.redis_set(db, key, item_data)

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
    """Generic function to list items for the current user."""
    pattern = pattern_func(current_username)
    items = await database.redis_get_all_by_prefix(db, pattern, model_class)
    return items


async def generic_read_item(
    item_id: str,
    current_username: str,
    db: redis.Redis,
    key_func: KeyFunc,
    model_class: Type[ModelType],
) -> ModelType:
    """Generic function to get a specific item by ID for the current user."""
    key = key_func(current_username, item_id)
    item = await database.redis_get(db, key, model_class)
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
    """Generic function to update a specific item by ID for the current user."""
    key = key_func(current_username, item_id)

    updated_item = await database.redis_update(
        db, key, item_update.model_dump(exclude_unset=True), model_class
    )

    if updated_item is None:
        raise HTTPException(status_code=404, detail="Item not found or update failed")

    if not hasattr(updated_item, "userId"):
        logger.error(f"Updated item {item_id} missing 'userId' attribute after update.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Item data structure error after update.",
        )

    if updated_item.userId != current_username:

        logger.critical(
            f"CRITICAL: Post-update userId mismatch for item {item_id}. Expected {current_username}, got {updated_item.userId}. Potential data integrity issue."
        )
        raise HTTPException(
            status_code=500, detail="Internal data consistency error after update."
        )

    return updated_item


async def generic_delete_item(
    item_id: str,
    current_username: str,
    db: redis.Redis,
    key_func: KeyFunc,
    model_class: Type[ModelType],
) -> None:
    """Generic function to delete a specific item by ID for the current user."""
    key = key_func(current_username, item_id)

    item_to_delete = await database.redis_get(db, key, model_class)
    if (
        item_to_delete is None
        or not hasattr(item_to_delete, "userId")
        or item_to_delete.userId != current_username
    ):

        raise HTTPException(status_code=404, detail="Item not found or not authorized")

    deleted_count = await database.redis_delete(db, key)
    if deleted_count == 0:

        logger.warning(
            f"Attempted to delete item with key {key}, but it was not found (possibly deleted concurrently)."
        )
        raise HTTPException(
            status_code=404, detail="Item not found (possibly deleted concurrently)"
        )
    return None


def create_crud_router(
    prefix: str,
    tags: List[str],
    key_func: KeyFunc,
    pattern_func: PatternFunc,
    model_class: Type[ModelType],
    update_model_class: Type[UpdateSchemaType], 
    get_username_dependency: GetCurrentUsernameFunc,
) -> APIRouter:
    """Creates a FastAPI router with generic CRUD endpoints."""

    router = APIRouter(
        prefix=f"/{prefix}",
        tags=tags,
        dependencies=[Depends(auth.get_current_user)],
    )

    @router.post("/", response_model=model_class, status_code=status.HTTP_201_CREATED)
    async def create_item_endpoint(
        item_data: model_class = Body(...), 
        current_username: str = Depends(get_username_dependency),
        db: redis.Redis = Depends(database.get_redis_connection),
    ):
        """Creates a new item."""
        if hasattr(item_data, "userId") and item_data.userId != current_username:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Provided userId does not match authenticated user.",
            )

        return await generic_create_item(
            item_data, current_username, db, key_func, model_class
        )

    @router.get("/", response_model=List[model_class])
    async def read_items_endpoint(
        current_username: str = Depends(get_username_dependency),
        db: redis.Redis = Depends(database.get_redis_connection),
    ):
        """Lists all items for the current user."""
        return await generic_read_user_items(
            current_username, db, pattern_func, model_class
        )

    @router.get("/{item_id}", response_model=model_class)
    async def read_item_endpoint(
        item_id: str,
        current_username: str = Depends(get_username_dependency),
        db: redis.Redis = Depends(database.get_redis_connection),
    ):
        """Gets a specific item by ID."""
        return await generic_read_item(
            item_id, current_username, db, key_func, model_class
        )

    @router.put("/{item_id}", response_model=model_class)
    async def update_item_endpoint(
        item_id: str,
        item_update: update_model_class = Body(...), 
        current_username: str = Depends(get_username_dependency),
        db: redis.Redis = Depends(database.get_redis_connection),
    ):
        """Updates a specific item by ID."""
        return await generic_update_item(
            item_id, item_update, current_username, db, key_func, model_class
        )

    @router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
    async def delete_item_endpoint(
        item_id: str,
        current_username: str = Depends(get_username_dependency),
        db: redis.Redis = Depends(database.get_redis_connection),
    ):
        """Deletes a specific item by ID."""
        await generic_delete_item(item_id, current_username, db, key_func, model_class)
        return None

    return router
