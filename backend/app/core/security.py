"""セキュリティ関連の機能（パスワードハッシュ化、JWTトークン生成・検証）"""
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# パスワードハッシュ化用のコンテキスト
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    プレーンテキストパスワードとハッシュ化されたパスワードを検証

    Args:
        plain_password: プレーンテキストのパスワード
        hashed_password: ハッシュ化されたパスワード

    Returns:
        パスワードが一致する場合True、それ以外はFalse
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    パスワードをハッシュ化

    Args:
        password: プレーンテキストのパスワード

    Returns:
        ハッシュ化されたパスワード
    """
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    JWTアクセストークンを生成

    Args:
        data: トークンに含めるデータ（通常はuser_idなど）
        expires_delta: トークンの有効期限（デフォルトは設定ファイルから取得）

    Returns:
        生成されたJWTトークン
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    JWTトークンをデコードして検証

    Args:
        token: JWTトークン

    Returns:
        デコードされたペイロード、無効な場合はNone
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
