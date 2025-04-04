import redis.asyncio as redis
import os
from dotenv import load_dotenv
import json
from typing import List, Optional, Type, TypeVar, Dict, Any
from pydantic import BaseModel

# Load environment variables from .env file
load_dotenv()

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))

# Create an asynchronous Redis connection pool
redis_pool = redis.ConnectionPool(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)

async def get_redis_connection() -> redis.Redis:
    """Gets a Redis connection from the pool."""
    return redis.Redis(connection_pool=redis_pool)

# --- Generic CRUD Helper Functions ---

T = TypeVar('T', bound=BaseModel) # Type variable for Pydantic models

async def redis_set(r: redis.Redis, key: str, model_instance: BaseModel):
    """Serializes a Pydantic model and stores it in Redis."""
    await r.set(key, model_instance.model_dump_json())

async def redis_get(r: redis.Redis, key: str, model_class: Type[T]) -> Optional[T]:
    """Retrieves data from Redis and deserializes it into a Pydantic model."""
    data = await r.get(key)
    if data:
        return model_class.model_validate_json(data)
    return None

async def redis_delete(r: redis.Redis, key: str) -> int:
    """Deletes a key from Redis. Returns 1 if deleted, 0 otherwise."""
    return await r.delete(key)

async def redis_scan_keys(r: redis.Redis, match: str) -> List[str]:
    """Scans for keys matching a pattern."""
    keys = []
    async for key in r.scan_iter(match=match):
        keys.append(key)
    return keys

async def redis_get_all_by_prefix(r: redis.Redis, prefix: str, model_class: Type[T]) -> List[T]:
    """Retrieves all items matching a prefix and deserializes them."""
    keys = await redis_scan_keys(r, f"{prefix}:*")
    items = []
    if not keys:
        return items
    # Use MGET for potentially better performance if many keys
    raw_data = await r.mget(keys)
    for item_json in raw_data:
        if item_json: # Ensure data exists before parsing
            try:
                items.append(model_class.model_validate_json(item_json))
            except Exception as e:
                print(f"Error parsing JSON for key (prefix: {prefix}): {e}") # Log potential parsing errors
                # Decide how to handle: skip, raise, etc. Skipping for now.
    return items

async def redis_update(r: redis.Redis, key: str, update_data: Dict[str, Any], model_class: Type[T]) -> Optional[T]:
    """Updates an existing item in Redis."""
    existing_item = await redis_get(r, key, model_class)
    if not existing_item:
        return None

    # Create a dictionary from the existing model
    item_dict = existing_item.model_dump()

    # Update the dictionary with non-None values from update_data
    for field, value in update_data.items():
        if value is not None:
            item_dict[field] = value

    # Validate the updated data with the model and save
    updated_item = model_class.model_validate(item_dict)
    await redis_set(r, key, updated_item)
    return updated_item
