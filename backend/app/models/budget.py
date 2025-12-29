"""予算モデル"""
import uuid
from datetime import datetime, date

from sqlalchemy import Column, Integer, DateTime, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Budget(Base):
    """予算テーブル"""

    __tablename__ = "budgets"

    budget_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.category_id", ondelete="CASCADE"), nullable=False)
    amount = Column(Integer, nullable=False)
    month = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # リレーションシップ
    user = relationship("User", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")
