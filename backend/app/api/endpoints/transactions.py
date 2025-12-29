"""取引関連のエンドポイント"""
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionUpdate

router = APIRouter()


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    transaction_data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    取引を作成

    Args:
        transaction_data: 取引作成情報
        current_user: 認証済みユーザー
        db: データベースセッション

    Returns:
        作成された取引

    Raises:
        HTTPException: カテゴリが見つからない、または権限がない場合
    """
    # カテゴリの存在チェックと所有者確認
    category = db.query(Category).filter(Category.category_id == transaction_data.category_id).first()
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

    new_transaction = Transaction(
        user_id=current_user.user_id,
        category_id=transaction_data.category_id,
        amount=transaction_data.amount,
        type=transaction_data.type,
        date=transaction_data.date,
        memo=transaction_data.memo,
    )

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    return new_transaction


@router.get("", response_model=list[TransactionResponse])
def get_transactions(
    skip: int = Query(0, ge=0, description="スキップする件数"),
    limit: int = Query(100, ge=1, le=1000, description="取得する件数"),
    start_date: date | None = Query(None, description="開始日（YYYY-MM-DD）"),
    end_date: date | None = Query(None, description="終了日（YYYY-MM-DD）"),
    category_id: UUID | None = Query(None, description="カテゴリID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    取引一覧を取得（フィルタリング・ページネーション対応）

    Args:
        skip: スキップする件数
        limit: 取得する件数
        start_date: 開始日
        end_date: 終了日
        category_id: カテゴリID
        current_user: 認証済みユーザー
        db: データベースセッション

    Returns:
        取引一覧
    """
    query = db.query(Transaction).filter(Transaction.user_id == current_user.user_id)

    # フィルタリング
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)

    transactions = (
        query.order_by(Transaction.date.desc(), Transaction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return transactions


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    特定の取引を取得

    Args:
        transaction_id: 取引ID
        current_user: 認証済みユーザー
        db: データベースセッション

    Returns:
        取引情報

    Raises:
        HTTPException: 取引が見つからない、または権限がない場合
    """
    transaction = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="取引が見つかりません",
        )

    # 所有者チェック
    if transaction.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="この取引にアクセスする権限がありません",
        )

    return transaction


@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: UUID,
    transaction_data: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    取引を更新

    Args:
        transaction_id: 取引ID
        transaction_data: 取引更新情報
        current_user: 認証済みユーザー
        db: データベースセッション

    Returns:
        更新された取引

    Raises:
        HTTPException: 取引が見つからない、または権限がない場合
    """
    transaction = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="取引が見つかりません",
        )

    # 所有者チェック
    if transaction.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="この取引を更新する権限がありません",
        )

    # カテゴリIDが更新される場合は、カテゴリの存在チェック
    if transaction_data.category_id:
        category = db.query(Category).filter(Category.category_id == transaction_data.category_id).first()
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
    update_data = transaction_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transaction, field, value)

    db.commit()
    db.refresh(transaction)

    return transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    取引を削除

    Args:
        transaction_id: 取引ID
        current_user: 認証済みユーザー
        db: データベースセッション

    Raises:
        HTTPException: 取引が見つからない、または権限がない場合
    """
    transaction = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="取引が見つかりません",
        )

    # 所有者チェック
    if transaction.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="この取引を削除する権限がありません",
        )

    db.delete(transaction)
    db.commit()
