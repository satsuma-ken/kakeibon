# 環境情報

## 開発環境概要

本プロジェクトは、ローカルまたはWSL2環境で開発を行います。

### 環境構成

```
開発環境
├── PostgreSQL (ローカルまたはDockerで起動)
├── FastAPI バックエンド (Uvicorn)
└── React フロントエンド (Vite)
```

## システム情報

### OS・プラットフォーム
- **OS**: Linux (WSL2)
- **カーネル**: 6.6.87.2-microsoft-standard-WSL2
- **プラットフォーム**: linux

### Python環境
- **Pythonバージョン**: 3.11.14
- **パッケージマネージャー**: uv
- **仮想環境**: `.venv` (uvによる自動管理)

### データベース
- **DBMS**: PostgreSQL 15以上
- **データベース名**: kakeibon
- **ポート**: 5432

### Webフレームワーク
- **フレームワーク**: FastAPI 0.109.0
- **サーバー**: Uvicorn 0.27.0
- **ポート**: 8000

## 主要な依存関係

```toml
dependencies = [
    "fastapi==0.109.0",
    "uvicorn[standard]==0.27.0",
    "sqlalchemy==2.0.25",
    "psycopg2-binary==2.9.9",
    "alembic==1.13.1",
    "pydantic==2.5.3",
    "pydantic-settings==2.1.0",
    "python-jose[cryptography]==3.3.0",
    "passlib[bcrypt]==1.7.4",
    "python-multipart==0.0.6",
]
```

## ディレクトリ構成

```
kakeibon/
├── backend/                    # バックエンドアプリケーション
│   ├── app/
│   │   ├── api/               # APIエンドポイント
│   │   │   ├── dependencies.py  # 認証・DI
│   │   │   └── endpoints/     # auth, categories, transactions, budgets
│   │   ├── core/              # コア機能（設定、DB、セキュリティ）
│   │   ├── models/            # SQLAlchemyモデル
│   │   ├── schemas/           # Pydanticスキーマ
│   │   └── main.py            # FastAPIエントリーポイント
│   ├── alembic/               # データベースマイグレーション
│   ├── requirements.txt       # Python依存関係
│   ├── .env                   # 環境変数（gitignore対象）
│   └── .env.example           # 環境変数サンプル
├── frontend/                  # フロントエンドアプリケーション
│   ├── src/
│   │   ├── main.tsx          # エントリーポイント
│   │   ├── App.tsx           # ルートコンポーネント
│   │   ├── pages/            # ページコンポーネント
│   │   ├── components/       # 共通コンポーネント
│   │   ├── contexts/         # React Context
│   │   ├── services/         # API通信
│   │   └── types/            # TypeScript型定義
│   ├── package.json          # Node.js依存関係
│   ├── .env                  # 環境変数（gitignore対象）
│   └── .env.example          # 環境変数サンプル
├── doc/                       # ドキュメント
│   ├── ARCHITECTURE.md        # アーキテクチャ
│   ├── ENVIRONMENT.md         # 環境情報（このファイル）
│   ├── SETUP.md              # セットアップ手順
│   ├── NOTES.md              # 注意事項
│   └── prompts/              # プロンプト・仕様書
├── pyproject.toml             # プロジェクト設定（バックエンド）
├── .python-version            # Pythonバージョン指定
└── README.md                  # プロジェクト概要
```

## 環境変数

### backend/.env

```bash
# ローカル開発環境の場合
DATABASE_URL=postgresql://postgres:password@localhost:5432/kakeibon

# WSLコンテナ環境から接続する場合
# DATABASE_URL=postgresql://postgres:password@host.docker.internal:5432/kakeibon

SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**重要**:
- ローカルで開発する場合は `localhost` を使用
- WSL2のDockerコンテナから接続する場合は `host.docker.internal` を使用
- 本番環境では必ず強力なSECRET_KEYに変更してください

## データベーススキーマ

### テーブル一覧

1. **users** - ユーザー情報
   - user_id (UUID, PK)
   - email (VARCHAR, UNIQUE)
   - password_hash (VARCHAR)
   - name (VARCHAR)
   - created_at (TIMESTAMP)

2. **categories** - カテゴリ情報
   - category_id (UUID, PK)
   - user_id (UUID, FK)
   - name (VARCHAR)
   - type (ENUM: income/expense)
   - color (VARCHAR)
   - created_at (TIMESTAMP)

3. **transactions** - 取引情報
   - transaction_id (UUID, PK)
   - user_id (UUID, FK)
   - category_id (UUID, FK)
   - amount (INTEGER)
   - type (ENUM: income/expense)
   - date (DATE)
   - memo (TEXT)
   - created_at (TIMESTAMP)

4. **budgets** - 予算情報
   - budget_id (UUID, PK)
   - user_id (UUID, FK)
   - category_id (UUID, FK)
   - amount (INTEGER)
   - month (DATE)
   - created_at (TIMESTAMP)

5. **alembic_version** - マイグレーション管理
   - version_num (VARCHAR)

## アクセス情報

### FastAPI (開発サーバー)

- **ベースURL**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **ヘルスチェック**: http://localhost:8000/health

### PostgreSQL

```bash
Host: localhost (または host.docker.internal)
Port: 5432
User: postgres
Password: password
Database: kakeibon
```

## 開発ツール

- **マイグレーション**: Alembic
- **ORM**: SQLAlchemy 2.0
- **バリデーション**: Pydantic v2
- **認証**: JWT (python-jose)
- **パスワードハッシュ化**: bcrypt (passlib)
