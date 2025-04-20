from pydantic import BaseModel

class ChatResponse(BaseModel):
    reply: str

class ChatHistoryEntry(BaseModel):
    role: str
    content: str
    timestamp: str

    class Config:
        from_attributes = True