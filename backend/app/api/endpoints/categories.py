"""カテゴリ関連のエンドポイント"""
from datetime import date, timedelta
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select


from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.category import Category
from app.models.transaction import Transaction
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
        is_recurring=category_data.is_recurring,
        frequency=category_data.frequency,
        default_amount=category_data.default_amount,
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


@router.get("/recurring/unregistered", response_model=list[CategoryResponse])
def get_unregistered_recurring_categories(
    month: Optional[date] = Query(None, description="対象月（YYYY-MM-DD形式）"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    未登録の固定費カテゴリを取得

    指定された月（デフォルトは当月）で、is_recurring=Trueのカテゴリのうち
    該当月にトランザクションが登録されていないものを返す

    Args:
        month: 対象月（省略時は当月）
        current_user: 認証済みユーザー
        db: データベースセッション

    Returns:
        未登録の固定費カテゴリ一覧
    """
    # 対象月の設定（デフォルトは当月）
    target_date = month if month else date.today()
    year = target_date.year
    month_num = target_date.month

    # 月の開始日と終了日を計算
    start_date = date(year, month_num, 1)
    if month_num == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month_num + 1, 1) - timedelta(days=1)

    # 一度のクエリで未登録の固定費カテゴリを取得（N+1問題を回避）
    # サブクエリ: 対象月に取引があるカテゴリIDを取得
    registered_category_ids = (
        db.query(Transaction.category_id)
        .filter(
            Transaction.user_id == current_user.user_id,
            Transaction.date >= start_date,
            Transaction.date <= end_date
        )
        .distinct()
        .subquery()
    )

    # 固定費カテゴリのうち、対象月に取引がないものを取得
    unregistered = (
        db.query(Category)
        .filter(
            Category.user_id == current_user.user_id,
            Category.is_recurring.is_(True),
            ~Category.category_id.in_(
                select(registered_category_ids)
            )
        )
        .all()
    )

    return unregistered
