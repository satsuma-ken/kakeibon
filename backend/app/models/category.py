"""カテゴリモデル"""
import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class TransactionType(str, enum.Enum):
    """取引タイプ（収入・支出）"""
    INCOME = "income"
    EXPENSE = "expense"


class Category(Base):
    """カテゴリテーブル"""

    __tablename__ = "categories"

    category_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    color = Column(String(7), default="#808080")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # リレーションシップ
    user = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="category", cascade="all, delete-orphan")
