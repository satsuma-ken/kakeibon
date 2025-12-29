"""カテゴリ関連のエンドポイント"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter()


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    カテゴリを作成

    Args:
        category_data: カテゴリ作成情報
        current_user: 認証済みユーザー
        db: データベースセッション

    Returns:
        作成されたカテゴリ
    """
    new_category = Category(
        user_id=current_user.user_id,
        name=category_data.name,
        type=category_data.type,
        color=category_data.color,
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return new_category


@router.get("", response_model=list[CategoryResponse])
def get_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    ユーザーのカテゴリ一覧を取得

    Args:
        current_user: 認証済みユーザー
        db: データベースセッション

    Returns:
        カテゴリ一覧
    """
    categories = (
        db.query(Category)
        .filter(Category.user_id == current_user.user_id)
        .order_by(Category.created_at.desc())
        .all()
    )

    return categories


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(
    category_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    特定のカテゴリを取得

    Args:
        category_id: カテゴリID
        current_user: 認証済みユーザー
        db: データベースセッション

    Returns:
        カテゴリ情報

    Raises:
        HTTPException: カテゴリが見つからない、または権限がない場合
    """
    category = db.query(Category).filter(Category.category_id == category_id).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="カテゴリが見つかりません",
        )

    # 所有者チェック
    if category.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="このカテゴリにアクセスする権限がありません",
        )

    return category


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: UUID,
    category_data: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    カテゴリを更新

    Args:
        category_id: カテゴリID
        category_data: カテゴリ更新情報
        current_user: 認証済みユーザー
        db: データベースセッション

    Returns:
        更新されたカテゴリ

    Raises:
        HTTPException: カテゴリが見つからない、または権限がない場合
    """
    category = db.query(Category).filter(Category.category_id == category_id).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="カテゴリが見つかりません",
        )

    # 所有者チェック
    if category.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="このカテゴリを更新する権限がありません",
        )

    # 更新処理
    update_data = category_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)

    db.commit()
    db.refresh(category)

    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    カテゴリを削除

    Args:
        category_id: カテゴリID
        current_user: 認証済みユーザー
        db: データベースセッション

    Raises:
        HTTPException: カテゴリが見つからない、または権限がない場合
    """
    category = db.query(Category).filter(Category.category_id == category_id).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="カテゴリが見つかりません",
        )

    # 所有者チェック
    if category.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="このカテゴリを削除する権限がありません",
        )

    db.delete(category)
    db.commit()
