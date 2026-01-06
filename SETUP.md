# セットアップ手順書

## 前提条件

- WSL2がインストールされていること
- Dockerがインストールされていること
- Python 3.11以上がインストールされていること
- uvがインストールされていること

## 初期セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd kakeibon
```

### 2. Python依存関係のインストール

```bash
# プロジェクトルートで実行
uv sync
```

これにより、`.venv`ディレクトリに仮想環境が作成され、すべての依存関係がインストールされます。

### 3. 環境変数の設定

```bash
# backend/.envファイルを作成
cd backend
cp .env.example .env
```

必要に応じて`.env`ファイルを編集してください：

```bash
DATABASE_URL=postgresql://postgres:password@kakeibon-postgres:5432/kakeibo
SECRET_KEY=your-secret-key-change-in-production-please-use-strong-random-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**重要**: 本番環境では必ず強力なSECRET_KEYに変更してください。

### 4. PostgreSQLの起動

#### WSLターミナルで実行

```bash
cd db
docker-compose up -d
```

起動確認：

```bash
docker-compose ps
```

`kakeibon-postgres`コンテナが`Up`状態であることを確認してください。

### 5. 開発コンテナをDockerネットワークに接続

開発コンテナがPostgreSQLと通信できるように、同じネットワークに接続します。

```bash
# 開発コンテナ名を確認
docker ps --format "{{.Names}}"

# kakeibon-networkに接続（コンテナ名は環境に応じて変更）
docker network connect kakeibon-network python-claude-dev
```

接続確認：

```bash
docker network inspect kakeibon-network
```

`python-claude-dev`と`kakeibon-postgres`の両方が表示されることを確認します。

### 6. データベース接続テスト

開発コンテナ内で実行：

```bash
cd /usr/src/projects/kakeibon/backend
uv run python -c "
from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
with engine.connect() as conn:
    result = conn.execute(text('SELECT version()'))
    print('✅ 接続成功!', result.fetchone()[0][:50])
"
```

### 7. データベースマイグレーション

初回セットアップ時のみ実行：

```bash
cd /usr/src/projects/kakeibon/backend

# マイグレーションファイルの作成（既に作成済みの場合はスキップ）
uv run alembic revision --autogenerate -m "Initial migration"

# マイグレーションの実行
uv run alembic upgrade head
```

テーブル作成の確認：

```bash
uv run python -c "
from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
with engine.connect() as conn:
    result = conn.execute(text('''
        SELECT table_name FROM information_schema.tables
        WHERE table_schema='public' ORDER BY table_name
    '''))
    print('作成されたテーブル:')
    for row in result:
        print(f'  - {row[0]}')
"
```

### 8. FastAPIサーバーの起動

```bash
cd /usr/src/projects/kakeibon/backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

アクセス確認：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- ヘルスチェック: http://localhost:8000/health

### 9. フロントエンドのセットアップ

#### 依存関係のインストール

```bash
cd /usr/src/projects/kakeibon/frontend
npm install
```

#### 環境変数の設定

```bash
# frontend/.envファイルを作成
cp .env.example .env
```

`.env`ファイルの内容（必要に応じて変更）：

```
VITE_API_BASE_URL=http://localhost:8000
```

#### フロントエンド開発サーバーの起動

```bash
cd /usr/src/projects/kakeibon/frontend
npm run dev
```

アクセス確認：
- フロントエンド: http://localhost:5173

**注意**: フロントエンドを使用するには、バックエンドAPI（ポート8000）が起動している必要があります。

## 日常的な開発フロー

### サーバーの起動

#### 1. PostgreSQLの起動

```bash
cd /usr/src/projects/kakeibon/db
docker-compose up -d
```

#### 2. FastAPIサーバーの起動

```bash
cd /usr/src/projects/kakeibon/backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 3. フロントエンド開発サーバーの起動

別のターミナルで実行：

```bash
cd /usr/src/projects/kakeibon/frontend
npm run dev
```

これでフルスタックアプリケーションが起動します：
- フロントエンド: http://localhost:5173
- バックエンドAPI: http://localhost:8000
- Swagger UI: http://localhost:8000/docs

### サーバーの停止

#### フロントエンド開発サーバーの停止

`Ctrl + C`

#### FastAPIサーバーの停止

`Ctrl + C`

#### PostgreSQLの停止

```bash
cd /usr/src/projects/kakeibon/db
docker-compose down
```

**注意**: `docker-compose down`を実行してもデータは永続化されています。

### データベースのリセット

データベースを完全にリセットする場合：

```bash
cd /usr/src/projects/kakeibon/db
docker-compose down -v  # ボリュームも削除
docker-compose up -d

# 再度マイグレーションを実行
cd /usr/src/projects/kakeibon/backend
uv run alembic upgrade head
```

## モデル変更時の手順

1. `backend/app/models/`でモデルを変更
2. マイグレーションファイルを自動生成

```bash
cd /usr/src/projects/kakeibon/backend
uv run alembic revision --autogenerate -m "変更内容の説明"
```

3. 生成されたマイグレーションファイルを確認

```bash
# backend/alembic/versions/ 配下のファイルを確認
ls -la alembic/versions/
```

4. マイグレーションを実行

```bash
uv run alembic upgrade head
```

5. マイグレーションの取り消し（必要な場合）

```bash
# 1つ前のバージョンに戻す
uv run alembic downgrade -1

# 特定のバージョンに戻す
uv run alembic downgrade <revision_id>
```

## トラブルシューティング

### PostgreSQLに接続できない

#### 症状
```
psycopg2.OperationalError: could not translate host name "kakeibon-postgres"
```

#### 解決方法

1. PostgreSQLコンテナが起動しているか確認

```bash
docker ps | grep kakeibon-postgres
```

2. 開発コンテナがネットワークに接続されているか確認

```bash
docker network inspect kakeibon-network
```

3. 接続されていない場合は接続

```bash
docker network connect kakeibon-network python-claude-dev
```

### マイグレーションエラー

#### 症状
```
alembic.util.exc.CommandError: Can't locate revision identified by 'xxxxx'
```

#### 解決方法

1. alembic_versionテーブルを確認

```bash
uv run python -c "
from sqlalchemy import create_engine, text
from app.core.config import settings
engine = create_engine(settings.DATABASE_URL)
with engine.connect() as conn:
    result = conn.execute(text('SELECT * FROM alembic_version'))
    print(result.fetchall())
"
```

2. マイグレーション履歴を確認

```bash
uv run alembic history
```

3. 必要に応じてalembic_versionテーブルを手動で修正

### ポートが既に使用されている

#### 症状
```
Error starting userland proxy: listen tcp4 0.0.0.0:8000: bind: address already in use
```

#### 解決方法

1. ポートを使用しているプロセスを確認

```bash
lsof -i :8000  # FastAPIの場合
lsof -i :5432  # PostgreSQLの場合
```

2. プロセスを終了

```bash
kill -9 <PID>
```

### 依存関係のインストールエラー

#### 解決方法

1. uvを最新版に更新

```bash
pip install --upgrade uv
```

2. キャッシュをクリア

```bash
uv cache clean
```

3. 再度インストール

```bash
uv sync
```

## 補足情報

### データベースへの直接接続

WSLターミナルから：

```bash
docker exec -it kakeibon-postgres psql -U postgres -d kakeibo
```

### ログの確認

#### PostgreSQLのログ

```bash
docker logs kakeibon-postgres
```

#### FastAPIのログ

Uvicornサーバーを起動したターミナルで確認できます。

### 開発時のヒント

1. **ホットリロード**: `--reload`オプションでサーバーを起動すると、コード変更時に自動的に再起動されます
2. **デバッグモード**: 環境変数`DEBUG=True`を設定すると、詳細なエラーメッセージが表示されます
3. **SQLログ**: `backend/app/core/database.py`の`echo=True`にすると、SQLクエリがログに出力されます
