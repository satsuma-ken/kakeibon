"""カテゴリスキーマ"""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.category import TransactionType


class CategoryBase(BaseModel):
    """カテゴリベーススキーマ"""
    name: str = Field(..., min_length=1, max_length=100)
    type: TransactionType
    color: str = Field(default="#808080", pattern=r"^#[0-9A-Fa-f]{6}$")


class CategoryCreate(CategoryBase):
    """カテゴリ作成スキーマ"""
    pass


class CategoryUpdate(BaseModel):
    """カテゴリ更新スキーマ"""
    name: str | None = Field(None, min_length=1, max_length=100)
    type: TransactionType | None = None
    color: str | None = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")


class CategoryResponse(CategoryBase):
    """カテゴリレスポンススキーマ"""
    category_id: UUID
    user_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}
