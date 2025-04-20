from typing import TypeVar, Callable
from pydantic import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)
GetCurrentUsernameFunc = Callable[..., str]
KeyFunc = Callable[[str, str], str]
PatternFunc = Callable[[str], str]
