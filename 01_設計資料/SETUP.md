# セットアップ手順書

## 前提条件

- Python 3.11以上がインストールされていること
- uv (Pythonパッケージマネージャー) がインストールされていること
- Node.js 18以上と npm がインストールされていること
- PostgreSQL 15以上がインストールされているか、起動可能であること

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

### 3. バックエンドの環境変数設定

```bash
cd backend
cp .env.example .env
```

`.env`ファイルを編集し、PostgreSQLの接続情報を設定してください：

```bash
# ローカル開発環境の場合
DATABASE_URL=postgresql://postgres:password@localhost:5432/kakeibon

# WSLコンテナ環境から接続する場合
# DATABASE_URL=postgresql://postgres:password@host.docker.internal:5432/kakeibon

SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**重要**: 本番環境では必ず強力なSECRET_KEYに変更してください。

### 4. フロントエンドの環境変数設定

```bash
cd frontend
cp .env.example .env
```

通常は `.env.example` の内容をそのまま使用できます：

```bash
VITE_API_BASE_URL=http://localhost:8000
```

### 5. PostgreSQLの起動

PostgreSQLが起動していることを確認してください。

#### ローカルにインストールしている場合

```bash
# PostgreSQLの起動確認
psql -U postgres -h localhost -p 5432 -l
```

#### Dockerで起動する場合

```bash
docker run -d \
  --name kakeibon-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=kakeibon \
  -p 5432:5432 \
  postgres:15
```

### 6. フロントエンドの依存関係インストール

```bash
cd frontend
npm install
```

### 7. データベースマイグレーション

データベーステーブルを作成します：

```bash
cd backend
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

### 8. アプリケーションの起動

アプリケーションを起動するには、バックエンドとフロントエンドの2つのサービスを起動する必要があります。
**それぞれ別のターミナルで実行してください。**

#### ターミナル1: FastAPIバックエンド

```bash
cd backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

停止する場合: `Ctrl + C`

#### ターミナル2: Reactフロントエンド

```bash
cd frontend
npm run dev
```

停止する場合: `Ctrl + C`

### 9. アクセス確認

すべてのサービスが起動したら、以下のURLにアクセスできます：

- **フロントエンド**: http://localhost:5173
- **バックエンドAPI Swagger UI**: http://localhost:8000/docs
- **バックエンドAPI ReDoc**: http://localhost:8000/redoc
- **ヘルスチェック**: http://localhost:8000/health

## 日常的な開発フロー

### アプリケーションの起動

開発を開始する際は、以下の手順でサービスを起動します：

#### 1. PostgreSQLの起動確認

PostgreSQLが起動していることを確認してください。

```bash
# ローカルの場合: サービスステータス確認
# Dockerの場合: コンテナステータス確認
docker ps | grep postgres
```

#### 2. バックエンドの起動

```bash
cd backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 3. フロントエンドの起動

別のターミナルで実行：

```bash
cd frontend
npm run dev
```

### アプリケーションの停止

各サービスは `Ctrl + C` で停止できます。

### データベースのリセット

データベースを完全にリセットする場合：

#### Dockerで起動している場合

```bash
# コンテナとボリュームを削除
docker stop kakeibon-postgres
docker rm kakeibon-postgres
docker volume prune

# PostgreSQLを再起動
docker run -d \
  --name kakeibon-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=kakeibon \
  -p 5432:5432 \
  postgres:15

# マイグレーションを再実行
cd backend
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
psycopg2.OperationalError: could not connect to server
```

#### 解決方法

1. PostgreSQLが起動しているか確認

```bash
# ローカルの場合
psql -U postgres -h localhost -p 5432 -l

# Dockerの場合
docker ps | grep postgres
```

2. DATABASE_URLが正しいか確認

```bash
# backend/.env ファイルを確認
cat backend/.env
```

3. ホスト名を確認
   - ローカル環境: `localhost`
   - WSL2コンテナ環境: `host.docker.internal`

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

#### ローカルの場合

```bash
psql -U postgres -h localhost -d kakeibon
```

#### Dockerの場合

```bash
docker exec -it kakeibon-postgres psql -U postgres -d kakeibon
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
