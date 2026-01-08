"""セキュリティ関連の機能（パスワードハッシュ化、JWTトークン生成・検証）"""
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    プレーンテキストパスワードとハッシュ化されたパスワードを検証

    Args:
        plain_password: プレーンテキストのパスワード
        hashed_password: ハッシュ化されたパスワード

    Returns:
        パスワードが一致する場合True、それ以外はFalse

    Note:
        bcryptは72バイトまでのパスワードしか処理できないため、
        自動的に切り詰めます。
    """
    # bcryptの72バイト制限に対応
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]

    # ハッシュ化されたパスワードをバイト列に変換
    hashed_bytes = hashed_password.encode('utf-8')

    return bcrypt.checkpw(password_bytes, hashed_bytes)


def get_password_hash(password: str) -> str:
    """
    パスワードをハッシュ化

    Args:
        password: プレーンテキストのパスワード

    Returns:
        ハッシュ化されたパスワード

    Note:
        bcryptは72バイトまでのパスワードしか処理できないため、
        自動的に切り詰めます。
    """
    # bcryptの72バイト制限に対応
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]

    # saltを生成してハッシュ化
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)

    # 文字列として返す
    return hashed.decode('utf-8')


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
