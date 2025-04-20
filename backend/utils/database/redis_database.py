import logging
import redis.asyncio as redis
from typing import List, Optional, Type, TypeVar, Dict, Any
from pydantic import BaseModel

from utils.general.get_env import getenv

logger = logging.getLogger(__name__)
T = TypeVar("T", bound=BaseModel)


async def get_redis_connection() -> redis.Redis:
    redis_pool = redis.ConnectionPool.from_url(
        getenv("REDIS_URL"), decode_responses=True
    )
    return redis.Redis(connection_pool=redis_pool)


async def redis_set(r: redis.Redis, key: str, model_instance: BaseModel):
    await r.set(key, model_instance.model_dump_json())


async def redis_get(r: redis.Redis, key: str, model_class: Type[T]) -> Optional[T]:
    data = await r.get(key)
    if data:

        return model_class.model_validate_json(data)
    return None


async def redis_delete(r: redis.Redis, key: str) -> int:
    return await r.delete(key)


async def redis_scan_keys(r: redis.Redis, match: str) -> List[str]:
    keys = []
    async for key in r.scan_iter(match=match):
        keys.append(key)
    return keys


async def redis_get_all_by_prefix(
    r: redis.Redis, prefix: str, model_class: Type[T]
) -> List[T]:
    keys = await redis_scan_keys(r, f"{prefix}*")
    items = []
    if not keys:
        return items

    pipe = r.pipeline()
    for key in keys:
        pipe.get(key)

    raw_data = await pipe.execute()
    valid_data = [item for item in raw_data if item is not None]

    for item_json in valid_data:
        try:
            items.append(model_class.model_validate_json(item_json))
        except Exception as e:
            logger.error(
                f"Error parsing JSON for key (prefix: {prefix}): {e}. Data: '{item_json}'",
                exc_info=True,
            )
    return items


async def redis_update(
    r: redis.Redis, key: str, update_data: Dict[str, Any], model_class: Type[T]
) -> Optional[T]:
    existing_item = await redis_get(r, key, model_class)
    if not existing_item:
        return None

    item_dict = existing_item.model_dump()

    for field, value in update_data.items():
        if value is not None:
            item_dict[field] = value

    updated_item = model_class.model_validate(item_dict)
    await redis_set(r, key, updated_item)
    return updated_item
