import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    Enum as SQLEnum,
    Numeric,
    Boolean,
    Date,
)
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
    mentor = Column(String, default=None, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=True, index=True)

    def __repr__(self):
        return f"<ChatHistory(id={self.id}, user_id='{self.user_id}', role='{self.role}', mentor='{self.mentor}', timestamp='{self.timestamp}')>"

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False, index=True)
    transaction_date = Column(Date, nullable=False, index=True)
    description = Column(Text, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False) 
    currency = Column(String(3), nullable=True) 
    category = Column(String, nullable=True, index=True)
    is_credit = Column(Boolean, nullable=False, default=False) 
    raw_data_hash = Column(String(64), nullable=False, index=True) 
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Transaction(id={self.id}, user_id='{self.user_id}', date='{self.transaction_date}', amount={self.amount}, category='{self.category}')>"
