# 注意ポイント・重要事項

## セキュリティ関連

### 1. 環境変数とシークレット管理

⚠️ **重要**: 以下のファイルは絶対にGitにコミットしないこと

- `backend/.env` - 実際の環境変数ファイル（.gitignore済み）
- 本番環境の認証情報

**推奨事項**:
- `.env.example`をテンプレートとして使用
- 本番環境では必ず強力なSECRET_KEYを生成
- パスワードは本番環境用に変更
- 環境ごとに異なる.envファイルを使用

```python
# 強力なSECRET_KEYの生成例
import secrets
print(secrets.token_urlsafe(32))
```

### 2. データベース認証情報

現在の設定:
```
User: postgres
Password: password
```

⚠️ **本番環境では必ず変更してください**

推奨事項:
- 複雑なパスワードを使用
- 専用のデータベースユーザーを作成
- 最小権限の原則に従う

### 3. CORS設定

現在の設定（`backend/app/core/config.py`）:
```python
BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5173"]
```

注: React開発サーバーのデフォルトポート5173のみ許可しています。

⚠️ **本番環境では**:
- 実際のフロントエンドのドメインのみを許可
- `allow_origins=["*"]`は絶対に使用しない
- HTTPSを必須にする

## データベース関連

### 1. データベース接続設定

環境によって適切なホスト名を使用してください：

| 実行環境 | DATABASE_URL |
|---------|-------------|
| ローカル環境 | `postgresql://postgres:password@localhost:5432/kakeibon` |
| WSL2コンテナ環境 | `postgresql://postgres:password@host.docker.internal:5432/kakeibon` |

### 2. PostgreSQL起動方法

PostgreSQLはローカルインストールまたはDockerで起動できます。

#### Dockerで起動する場合

```bash
docker run -d \
  --name kakeibon-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=kakeibon \
  -p 5432:5432 \
  postgres:15
```

データの永続化が必要な場合は、ボリュームをマウントしてください：

```bash
docker run -d \
  --name kakeibon-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=kakeibon \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15
```

### 3. アプリケーション起動手順

開発時は以下の順序でサービスを起動します：

```bash
# 1. PostgreSQLが起動していることを確認
docker ps | grep postgres  # Dockerの場合

# 2. バックエンドを起動（別ターミナル）
cd backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 3. フロントエンドを起動（別ターミナル）
cd frontend
npm run dev
```

## データベース設計関連

### 1. UUID使用に関する注意

すべてのテーブルでプライマリキーにUUIDを使用しています。

**メリット**:
- グローバルに一意
- セキュリティ（推測不可能）
- 分散システムでの衝突リスク低減

**デメリット**:
- インデックスサイズが大きい
- パフォーマンス（整数よりも遅い）

**推奨事項**:
- 大規模システムではUUIDv7の使用を検討
- インデックス戦略を適切に設計

### 2. ENUM型の使用

`TransactionType`でENUM型を使用しています:
```python
class TransactionType(str, enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"
```

⚠️ **注意**:
- ENUMの値を変更する際は、データベースマイグレーションが必要
- 新しい値を追加する場合も同様

### 3. タイムスタンプのタイムゾーン

現在`datetime.utcnow()`を使用していますが、Python 3.12以降では非推奨です。

**現在の実装**:
```python
created_at = Column(DateTime, default=datetime.utcnow)
```

**将来的な推奨実装**:
```python
from datetime import timezone
created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
```

注: Python 3.11を使用しているため、現状のままでも問題ありませんが、
Python 3.12以降にアップグレードする際は修正が必要です。

## マイグレーション関連

### 1. マイグレーションの自動生成の限界

`alembic revision --autogenerate`は便利ですが、すべての変更を検出できるわけではありません。

**検出されない変更**:
- テーブル名やカラム名の変更（削除+追加として認識される）
- チェック制約の変更
- インデックスの一部の変更

⚠️ **必ず生成されたマイグレーションファイルを確認してください**

### 2. マイグレーションの順序

マイグレーションは**必ず順番に**実行してください。

```bash
# ❌ 間違い: 特定のバージョンにジャンプ
alembic upgrade abc123

# ✅ 正しい: 最新まで順番に実行
alembic upgrade head
```

### 3. 本番環境でのマイグレーション

⚠️ **本番環境では**:
1. データベースのバックアップを取る
2. メンテナンスモードに切り替える
3. マイグレーションを実行
4. 動作確認
5. メンテナンスモードを解除

ロールバック手順も事前に準備しておくこと。

## FastAPI関連

### 1. 依存性注入（Dependency Injection）

`get_db()`は依存性注入用のジェネレータです。

```python
from app.core.database import get_db

@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    # dbセッションは自動的にクローズされます
    return db.query(User).all()
```

⚠️ **注意**: セッションを手動でクローズしないこと

### 2. Pydanticスキーマのバリデーション

すべてのリクエスト/レスポンスはPydanticスキーマで型検証されます。

```python
# 自動的にバリデーションされる
class UserCreate(BaseModel):
    email: EmailStr  # メールアドレス形式チェック
    password: str = Field(..., min_length=8)  # 最小8文字
```

### 3. パスワードハッシュ化

**絶対に**プレーンテキストのパスワードをDBに保存しないこと。

```python
# ✅ 正しい
from app.core.security import get_password_hash
password_hash = get_password_hash(plain_password)

# ❌ 間違い
user.password = plain_password
```

## パフォーマンス関連

### 1. N+1問題への対処

リレーションシップを使用する際は、N+1問題に注意してください。

```python
# ❌ N+1問題が発生
users = db.query(User).all()
for user in users:
    print(user.categories)  # 各ユーザーごとにクエリ発行

# ✅ 解決策: joinedloadを使用
from sqlalchemy.orm import joinedload
users = db.query(User).options(joinedload(User.categories)).all()
```

### 2. インデックスの活用

頻繁に検索されるカラムにはインデックスを追加してください。

現在の実装:
```python
email = Column(String(255), unique=True, nullable=False, index=True)
```

### 3. ページネーション

大量のデータを取得する場合は、必ずページネーションを実装してください。

```python
# 推奨実装例
@app.get("/transactions")
def get_transactions(
    skip: int = 0,
    limit: int = 100,  # デフォルト100件
    db: Session = Depends(get_db)
):
    return db.query(Transaction).offset(skip).limit(limit).all()
```

## コーディング規約

### 1. 型ヒント

すべての関数に型ヒントを付けてください。

```python
# ✅ 推奨
def create_user(user: UserCreate, db: Session) -> User:
    pass

# ❌ 非推奨
def create_user(user, db):
    pass
```

### 2. docstring

公開APIには必ずdocstringを記述してください。

```python
def create_user(user: UserCreate, db: Session) -> User:
    """
    新しいユーザーを作成します。

    Args:
        user: ユーザー作成リクエスト
        db: データベースセッション

    Returns:
        作成されたユーザー

    Raises:
        ValueError: メールアドレスが既に使用されている場合
    """
    pass
```

### 3. エラーハンドリング

適切な例外処理を実装してください。

**バックエンド**:
```python
from fastapi import HTTPException

try:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
```

**フロントエンド（実装済み）**:
```typescript
// utils/errorHandler.ts を使用
import { handleApiError } from '@/utils/errorHandler';

try {
  const response = await api.post('/api/transactions', data);
} catch (error) {
  handleApiError(error);  // react-hot-toastで通知
}
```

現在の実装では、すべてのエラーは `react-hot-toast` で画面上部に通知されます。

## テスト関連

### 1. テストデータベース

テスト時は必ず専用のテストデータベースを使用してください。

```python
# テスト用の環境変数
TEST_DATABASE_URL = "postgresql://postgres:password@localhost:5432/kakeibo_test"
```

### 2. フィクスチャ

pytestのfixtureを使用して、テストデータを準備してください。

```python
@pytest.fixture
def test_user(db):
    user = User(email="test@example.com", name="Test User")
    db.add(user)
    db.commit()
    return user
```

## 本番環境へのデプロイ

⚠️ **本番環境では以下を必ず実施してください**:

1. **環境変数の適切な設定**
   - 強力なSECRET_KEY
   - 本番用のDATABASE_URL
   - HTTPS必須化

2. **セキュリティ設定**
   - CORS設定の制限
   - レート制限の実装
   - HTTPSリダイレクト

3. **ロギング**
   - 適切なログレベル設定
   - ログローテーション
   - エラー監視

4. **バックアップ**
   - 定期的なデータベースバックアップ
   - リストア手順の確認

5. **監視**
   - ヘルスチェックエンドポイント
   - メトリクス収集
   - アラート設定

## その他の注意事項

### 1. Git管理

以下のファイルは.gitignoreに追加済みです:
- `.env`
- `__pycache__/`
- `.venv/`
- `alembic/versions/*.pyc`

### 2. ドキュメント更新

コードを変更した際は、関連するドキュメントも更新してください:
- API仕様書
- データベーススキーマ
- セットアップ手順

### 3. コードレビュー

以下の観点でコードレビューを実施してください:
- セキュリティ
- パフォーマンス
- 可読性
- テストカバレッジ
