"""取引スキーマ"""
from datetime import datetime, date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.category import TransactionType


class TransactionBase(BaseModel):
    """取引ベーススキーマ"""
    category_id: UUID
    amount: int = Field(..., gt=0)
    type: TransactionType
    date: date
    memo: Optional[str] = None


class TransactionCreate(TransactionBase):
    """取引作成スキーマ"""
    pass


class TransactionUpdate(BaseModel):
    """取引更新スキーマ"""
    category_id: Optional[UUID] = None
    amount: Optional[int] = Field(None, gt=0)
    type: Optional[TransactionType] = None
    date: Optional[date] = None
    memo: Optional[str] = None


class TransactionResponse(TransactionBase):
    """取引レスポンススキーマ"""
    transaction_id: UUID
    user_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}
