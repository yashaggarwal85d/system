from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Any
import uuid
from datetime import datetime

from models.redis_models import Player, Habit, Task, Routine
from models.pg_models import HistoryType

class PlayerFullInfo(BaseModel):
    player: Player
    habits: List[Habit]
    tasks: List[Task]
    routines: List[Routine]


class NotesEntry(BaseModel):
    fileName: str
    content: str


class HistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: str
    type: HistoryType
    data: Optional[Any] = None
    comments: Optional[str] = None
    timestamp: datetime


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None
