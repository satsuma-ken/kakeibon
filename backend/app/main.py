"""FastAPI アプリケーションのエントリーポイント"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.endpoints import auth, categories, transactions, budgets

# FastAPIアプリケーションの作成
app = FastAPI(
    title="Kakeibon API",
    description="家計簿アプリケーションのREST API",
    version="0.1.0",
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーター登録
app.include_router(auth.router, prefix="/api/auth", tags=["認証"])
app.include_router(categories.router, prefix="/api/categories", tags=["カテゴリ"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["取引"])
app.include_router(budgets.router, prefix="/api/budgets", tags=["予算"])


@app.get("/")
async def root():
    """ルートエンドポイント"""
    return {
        "message": "Kakeibon API",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """ヘルスチェックエンドポイント"""
    return {"status": "ok"}
