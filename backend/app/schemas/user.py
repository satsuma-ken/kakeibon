"""ユーザースキーマ"""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """ユーザーベーススキーマ"""
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)


class UserCreate(UserBase):
    """ユーザー作成スキーマ"""
    password: str = Field(..., min_length=8, max_length=100)


class UserUpdate(BaseModel):
    """ユーザー更新スキーマ"""
    email: EmailStr | None = None
    name: str | None = Field(None, min_length=1, max_length=100)
    password: str | None = Field(None, min_length=8, max_length=100)


class UserResponse(UserBase):
    """ユーザーレスポンススキーマ"""
    user_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class UserLogin(BaseModel):
    """ユーザーログインスキーマ"""
    email: EmailStr
    password: str


class Token(BaseModel):
    """トークンスキーマ"""
    access_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    """認証レスポンススキーマ"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
