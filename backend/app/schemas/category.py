"""カテゴリスキーマ"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.models.category import TransactionType


class CategoryBase(BaseModel):
    """カテゴリベーススキーマ"""
    name: str = Field(..., min_length=1, max_length=100)
    type: TransactionType
    color: str = Field(default="#808080", pattern=r"^#[0-9A-Fa-f]{6}$")
    is_recurring: bool = Field(default=False)
    frequency: Optional[str] = None  # 'monthly' | 'yearly'
    default_amount: Optional[int] = Field(None, ge=0)

    @model_validator(mode='after')
    def validate_recurring_fields(self):
        if self.is_recurring:
            if not self.frequency:
                raise ValueError("固定費の場合は頻度が必要です")
            if not self.default_amount or self.default_amount <= 0:
                raise ValueError("固定費の場合は標準金額が必要です")
        return self


class CategoryCreate(CategoryBase):
    """カテゴリ作成スキーマ"""
    pass


class CategoryUpdate(BaseModel):
    """カテゴリ更新スキーマ"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[TransactionType] = None
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    is_recurring: Optional[bool] = None
    frequency: Optional[str] = None
    default_amount: Optional[int] = Field(None, ge=0)


class CategoryResponse(CategoryBase):
    """カテゴリレスポンススキーマ"""
    category_id: UUID
    user_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}
