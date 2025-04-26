from datetime import datetime
from typing import List
from pydantic import BaseModel, Field, validator


class GeminiTransaction(BaseModel):
    transaction_date: str
    description: str
    amount: float = Field(gt=0)
    category: str
    is_credit: bool

    @validator("transaction_date")
    def validate_date_format(cls, v):
        try:
            datetime.strptime(v, "%Y-%m-%d")
            return v
        except ValueError:
            raise ValueError("Invalid date format, expected YYYY-MM-DD")


class GeminiResponse(BaseModel):
    transactions: List[GeminiTransaction]


class CategorizedTransactionResponse(BaseModel):
    id: str
    Timestamp: str
    Amount: float
    CrDr: str
    Category: str
    Description: str

    class Config:
        orm_mode = True


class FinanceDataResponse(BaseModel):
    transactions: List[CategorizedTransactionResponse]
    suggestions: List[str] = []


class UploadResponse(BaseModel):
    message: str
    added: int
    skipped: int
    failed: int
