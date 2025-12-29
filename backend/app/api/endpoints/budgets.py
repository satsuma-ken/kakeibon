"""予算関連のエンドポイント"""
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.budget import Budget
from app.models.category import Category
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetResponse, BudgetUpdate

router = APIRouter()


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    budget_data: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    予算を作成

    Args:
        budget_data: 予算作成情報
        current_user: 認証済みユーザー
        db: データベースセッション

    Returns:
        作成された予算

    Raises:
        HTTPException: カテゴリが見つからない、または権限がない場合
    """
    # カテゴリの存在チェックと所有者確認
    category = db.query(Category).filter(Category.category_id == budget_data.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="カテゴリが見つかりません",
        )

    if category.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="このカテゴリを使用する権限がありません",
        )

    # 同じカテゴリ・同じ月の予算が既に存在しないかチェック
    existing_budget = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.user_id,
            Budget.category_id == budget_data.category_id,
            Budget.month == budget_data.month,
        )
        .first()
    )

    if existing_budget:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="このカテゴリと月の予算は既に存在します",
        )

    new_budget = Budget(
        user_id=current_user.user_id,
        category_id=budget_data.category_id,
        amount=budget_data.amount,
        month=budget_data.month,
    )

    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)

    return new_budget


@router.get("", response_model=list[BudgetResponse])
def get_budgets(
    month: date | None = Query(None, description="月（YYYY-MM-DD）"),
    category_id: UUID | None = Query(None, description="カテゴリID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    予算一覧を取得（フィルタリング対応）

    Args:
        month: 月
        category_id: カテゴリID
        current_user: 認証済みユーザー
        db: データベースセッション

    Returns:
        予算一覧
    """
    query = db.query(Budget).filter(Budget.user_id == current_user.user_id)

    # フィルタリング
    if month:
        query = query.filter(Budget.month == month)
    if category_id:
        query = query.filter(Budget.category_id == category_id)

    budgets = query.order_by(Budget.month.desc(), Budget.created_at.desc()).all()

    return budgets


@router.get("/{budget_id}", response_model=BudgetResponse)
def get_budget(
    budget_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    特定の予算を取得

    Args:
        budget_id: 予算ID
        current_user: 認証済みユーザー
        db: データベースセッション

    Returns:
        予算情報

    Raises:
        HTTPException: 予算が見つからない、または権限がない場合
    """
    budget = db.query(Budget).filter(Budget.budget_id == budget_id).first()

    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="予算が見つかりません",
        )

    # 所有者チェック
    if budget.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="この予算にアクセスする権限がありません",
        )

    return budget


@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: UUID,
    budget_data: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    予算を更新

    Args:
        budget_id: 予算ID
        budget_data: 予算更新情報
        current_user: 認証済みユーザー
        db: データベースセッション

    Returns:
        更新された予算

    Raises:
        HTTPException: 予算が見つからない、または権限がない場合
    """
    budget = db.query(Budget).filter(Budget.budget_id == budget_id).first()

    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="予算が見つかりません",
        )

    # 所有者チェック
    if budget.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="この予算を更新する権限がありません",
        )

    # カテゴリIDが更新される場合は、カテゴリの存在チェック
    if budget_data.category_id:
        category = db.query(Category).filter(Category.category_id == budget_data.category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="カテゴリが見つかりません",
            )

        if category.user_id != current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="このカテゴリを使用する権限がありません",
            )

    # 更新処理
    update_data = budget_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(budget, field, value)

    db.commit()
    db.refresh(budget)

    return budget


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    予算を削除

    Args:
        budget_id: 予算ID
        current_user: 認証済みユーザー
        db: データベースセッション

    Raises:
        HTTPException: 予算が見つからない、または権限がない場合
    """
    budget = db.query(Budget).filter(Budget.budget_id == budget_id).first()

    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="予算が見つかりません",
        )

    # 所有者チェック
    if budget.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="この予算を削除する権限がありません",
        )

    db.delete(budget)
    db.commit()
