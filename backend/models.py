from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
import uuid
from datetime import date

# Define an Enum
class Occurence(str, Enum):
    WEEKS = "weeks"
    MONTHS = "months"
    DAYS = "days"

# Helper function to generate UUIDs
def generate_uuid():
    return str(uuid.uuid4())

class Player(BaseModel):
    username: str
    level: int = 0
    aura: int = 0
    description: str = "You are weak, You lack consistency, You need to work hard, Future You would be dissapointed if you stay like this"
    password: str

# Model for updating player profile (excluding username and password)
class PlayerUpdate(BaseModel):
    level: Optional[int] = None
    aura: Optional[int] = None
    description: Optional[str] = None

class Habit(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    userId: str
    name: str
    aura: int = 5
    next_due_date: date
    start_date: date
    occurence: Occurence
    x_occurence: int # Number of units of occurence
    repeat: int # Number of times to repeat the occurence

class Task(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    userId: str
    name: str
    due_date: date
    aura_value: int = 5 
    completed: bool = False

class Routine(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    userId: str
    name: str
    aura: int = 5
    next_due_date: date
    start_date: date
    occurence: Occurence
    x_occurence: int # Number of units of occurence
    repeat: int # Number of times to repeat the occurence
    checklist: str
