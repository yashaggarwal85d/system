import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, String, Text, DateTime, Enum as SQLEnum
from sqlalchemy.orm import declarative_base
from sqlalchemy.dialects.postgresql import UUID, JSONB

Base = declarative_base()


class HistoryType(PyEnum):
    TASK = "task"
    ROUTINE = "routine"
    HABIT = "habit"
    PLAYER = "player"


class History(Base):
    __tablename__ = "history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False, index=True)
    type = Column(
        SQLEnum(HistoryType, name="history_type_enum"), nullable=False, index=True
    )
    data = Column(JSONB, nullable=True)
    comments = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    def __repr__(self):
        return f"<History(id={self.id}, user_id='{self.user_id}', type='{self.type.name}', timestamp='{self.timestamp}')>"


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False, index=True)
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    def __repr__(self):
        return f"<ChatHistory(id={self.id}, user_id='{self.user_id}', role='{self.role}', timestamp='{self.timestamp}')>"
