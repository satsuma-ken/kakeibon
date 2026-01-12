"""カテゴリモデル"""
import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class TransactionType(str, enum.Enum):
    """取引タイプ（収入・支出）"""
    INCOME = "income"
    EXPENSE = "expense"


class RecurringFrequency(str, enum.Enum):
    """固定費の頻度"""
    MONTHLY = "monthly"
    YEARLY = "yearly"


class Category(Base):
    """カテゴリテーブル"""

    __tablename__ = "categories"

    category_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    color = Column(String(7), default="#808080")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # 固定費関連フィールド
    is_recurring = Column(Boolean, default=False, nullable=False)
    frequency = Column(Enum(RecurringFrequency), nullable=True)
    default_amount = Column(Integer, nullable=True)

    # リレーションシップ
    user = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="category", cascade="all, delete-orphan")
