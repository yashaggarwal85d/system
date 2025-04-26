from typing import Optional
from pydantic import BaseModel


class ChatResponse(BaseModel):
    reply: str
    mentor: Optional[str]


class ChatHistoryEntry(BaseModel):
    role: str
    content: str
    timestamp: str
    mentor: Optional[str]

    class Config:
        from_attributes = True
