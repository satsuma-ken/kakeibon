"""データベース接続設定"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# データベースエンジンの作成
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # 接続の有効性を確認
    echo=False,  # SQLログを出力しない（開発時はTrueに変更可）
)

# セッションファクトリの作成
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ベースクラスの作成
Base = declarative_base()


def get_db():
    """データベースセッションの依存性注入用ジェネレータ"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
