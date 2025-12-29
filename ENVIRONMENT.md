# 環境情報

## 開発環境概要

本プロジェクトは、WSL2上のDockerコンテナ内で開発を行っています。

### 環境構成

```
WSL2 (Ubuntu)
├── ホストマシン
│   └── PostgreSQLコンテナ (kakeibon-postgres)
└── 開発コンテナ (python-claude-dev)
    └── FastAPIアプリケーション
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
- **DBMS**: PostgreSQL 15.15 (Alpine Linux)
- **コンテナ名**: kakeibon-postgres
- **データベース名**: kakeibo
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
│   │   ├── core/              # コア機能（設定、DB、セキュリティ）
│   │   ├── models/            # SQLAlchemyモデル
│   │   ├── schemas/           # Pydanticスキーマ
│   │   └── main.py            # FastAPIエントリーポイント
│   ├── alembic/               # データベースマイグレーション
│   ├── requirements.txt       # Python依存関係
│   ├── .env                   # 環境変数（gitignore対象）
│   └── .env.example           # 環境変数サンプル
├── db/                        # データベース関連
│   ├── docker-compose.yml     # PostgreSQL環境定義
│   ├── init/                  # 初期化スクリプト
│   ├── README.md              # DB使用方法
│   └── SETUP.md               # DB接続設定手順
├── doc/                       # ドキュメント
│   ├── ENVIRONMENT.md         # 環境情報（このファイル）
│   └── prompts/               # プロンプト・仕様書
├── pyproject.toml             # プロジェクト設定
├── .python-version            # Pythonバージョン指定
└── README.md                  # プロジェクト概要
```

## 環境変数

### backend/.env

```bash
DATABASE_URL=postgresql://postgres:password@kakeibon-postgres:5432/kakeibo
SECRET_KEY=your-secret-key-change-in-production-please-use-strong-random-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**重要**:
- `kakeibon-postgres` はDockerネットワーク内でのホスト名です
- ローカル開発（WSLホスト側）では `localhost` を使用
- コンテナ環境では `kakeibon-postgres` を使用

## ネットワーク構成

### Dockerネットワーク: kakeibon-network

- **タイプ**: bridge
- **サブネット**: 172.21.0.0/16
- **ゲートウェイ**: 172.21.0.1

### 接続されているコンテナ

| コンテナ名 | IPアドレス | 役割 |
|-----------|-----------|------|
| kakeibon-postgres | 172.21.0.2 | PostgreSQLデータベース |
| python-claude-dev | 172.21.0.3 | 開発環境 |

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

#### コンテナ内から接続
```bash
Host: kakeibon-postgres
Port: 5432
User: postgres
Password: password
Database: kakeibo
```

#### WSLホストから接続
```bash
Host: localhost
Port: 5432
User: postgres
Password: password
Database: kakeibo
```

## 開発ツール

- **マイグレーション**: Alembic
- **ORM**: SQLAlchemy 2.0
- **バリデーション**: Pydantic v2
- **認証**: JWT (python-jose)
- **パスワードハッシュ化**: bcrypt (passlib)
