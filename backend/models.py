from pydantic import BaseModel, Field, field_validator, field_serializer
from typing import List, Optional, Union
from enum import Enum
import uuid
from datetime import date, datetime

# Define an Enum
class Occurence(str, Enum):
    WEEKS = "weeks"
    MONTHS = "months"
    DAYS = "days"

def generate_uuid():
    return str(uuid.uuid4())

def validate_date_format(v: Union[str, date]) -> Union[str, date]:
    """Allow DD-MM-YY format in addition to default YYYY-MM-DD."""
    if isinstance(v, date):
        return v  
    if isinstance(v, str):
        try:
            return datetime.strptime(v, '%d-%m-%y').date()
        except ValueError:
            return v
    return v

class Player(BaseModel):
    username: str
    level: int = 0
    aura: int = 0
    description: str = "You are weak, You lack consistency, You need to work hard, Future You would be dissapointed if you stay like this"
    password: str

class PlayerUpdate(BaseModel):
    level: Optional[int] = None
    aura: Optional[int] = None
    description: Optional[str] = None

class Habit(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    userId: str
    name: str
    aura: int = 5
    start_date: date
    last_completed: date
    occurence: Occurence
    x_occurence: int # Number of units of occurence
    _validate_habit_dates = field_validator('start_date', 'last_completed', mode='before')(validate_date_format)

    @field_serializer('start_date', 'last_completed')
    def serialize_date(self, v: date):
        return v.strftime('%d-%m-%y')

class HabitUpdate(BaseModel):
    name: Optional[str] = None
    aura: Optional[int] = None
    start_date: Optional[date] = None
    occurence: Optional[Occurence] = None
    x_occurence: Optional[int] = None
    last_completed: Optional[date] = None

    _validate_routine_dates = field_validator('start_date','last_completed', mode='before')(validate_date_format)
    
    @field_serializer('start_date', 'last_completed')
    def serialize_date(self, v: date):
        return v.strftime('%d-%m-%y')

class Task(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    userId: str
    name: str
    due_date: date
    aura: int = 5
    completed: bool = False
    _validate_task_date = field_validator('due_date', mode='before')(validate_date_format)

    @field_serializer('due_date')
    def serialize_date(self, v: date):
        return v.strftime('%d-%m-%y')

class TaskUpdate(BaseModel):
    name: Optional[str] = None
    due_date: Optional[str] = None
    aura: Optional[int] = None
    completed: Optional[bool] = None

class Routine(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    userId: str
    name: str
    aura: int = 5
    start_date: date
    occurence: Occurence
    x_occurence: int # Number of units of occurence
    last_completed: date
    checklist: str

    # Apply reusable validator
    _validate_routine_dates = field_validator('start_date','last_completed', mode='before')(validate_date_format)

    @field_serializer('start_date', 'last_completed')
    def serialize_date(self, v: date):
        return v.strftime('%d-%m-%y')

class RoutineUpdate(BaseModel):
    name: Optional[str] = None
    aura: Optional[int] = None
    start_date: Optional[date] = None
    occurence: Optional[Occurence] = None
    x_occurence: Optional[int] = None
    checklist: Optional[str] = None 
    last_completed: Optional[date] = None

    _validate_routine_dates = field_validator('start_date','last_completed', mode='before')(validate_date_format)
    
    @field_serializer('start_date', 'last_completed')
    def serialize_date(self, v: date):
        return v.strftime('%d-%m-%y')

class PlayerFullInfo(BaseModel):
    player: Player 
    habits: List[Habit]
    tasks: List[Task]
    routines: List[Routine]

class NeuralVaultEntry(BaseModel):
    fileName: str
    content: str
