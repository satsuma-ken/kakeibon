"""取引スキーマ"""
from datetime import datetime, date
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.category import TransactionType


class TransactionBase(BaseModel):
    """取引ベーススキーマ"""
    category_id: UUID
    amount: int = Field(..., gt=0)
    type: TransactionType
    date: date
    memo: str | None = None


class TransactionCreate(TransactionBase):
    """取引作成スキーマ"""
    pass


class TransactionUpdate(BaseModel):
    """取引更新スキーマ"""
    category_id: UUID | None = None
    amount: int | None = Field(None, gt=0)
    type: TransactionType | None = None
    date: date | None = None
    memo: str | None = None


class TransactionResponse(TransactionBase):
    """取引レスポンススキーマ"""
    transaction_id: UUID
    user_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}
