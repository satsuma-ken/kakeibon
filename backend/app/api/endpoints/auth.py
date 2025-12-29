"""認証関連のエンドポイント"""
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    新規ユーザー登録

    Args:
        user_data: ユーザー登録情報
        db: データベースセッション

    Returns:
        作成されたユーザー情報

    Raises:
        HTTPException: メールアドレスが既に使用されている場合
    """
    # メールアドレスの重複チェック
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="このメールアドレスは既に使用されています",
        )

    # 新規ユーザーの作成
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=get_password_hash(user_data.password),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    ユーザーログイン

    Args:
        credentials: ログイン情報（メールアドレスとパスワード）
        db: データベースセッション

    Returns:
        アクセストークン

    Raises:
        HTTPException: 認証に失敗した場合
    """
    # ユーザーの検索
    user = db.query(User).filter(User.email == credentials.email).first()

    # ユーザーが存在しない、またはパスワードが間違っている場合
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # アクセストークンの生成
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.user_id)}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}
