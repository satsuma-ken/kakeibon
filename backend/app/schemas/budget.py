"""予算スキーマ"""
from datetime import datetime, date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class BudgetBase(BaseModel):
    """予算ベーススキーマ"""
    category_id: UUID
    amount: int = Field(..., gt=0)
    month: date


class BudgetCreate(BudgetBase):
    """予算作成スキーマ"""
    pass


class BudgetUpdate(BaseModel):
    """予算更新スキーマ"""
    category_id: Optional[UUID] = None
    amount: Optional[int] = Field(None, gt=0)
    month: Optional[date] = None


class BudgetResponse(BudgetBase):
    """予算レスポンススキーマ"""
    budget_id: UUID
    user_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}
