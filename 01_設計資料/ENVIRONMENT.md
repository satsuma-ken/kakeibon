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

### バックエンド（FastAPI）
- **フレームワーク**: FastAPI 0.109.0
- **サーバー**: Uvicorn 0.27.0
- **ポート**: 8000

### フロントエンド（React + Vite）
- **Reactバージョン**: 19.2.0
- **ビルドツール**: Vite 7.2.4
- **TypeScript**: 5.9.3
- **ポート**: 5173

## 主要な依存関係

### バックエンド（pyproject.toml）

```toml
dependencies = [
    "fastapi==0.109.0",
    "uvicorn[standard]==0.27.0",
    "sqlalchemy==2.0.25",
    "psycopg2-binary==2.9.9",
    "alembic==1.13.1",
    "pydantic[email]==2.5.3",
    "pydantic-settings==2.1.0",
    "python-jose[cryptography]==3.3.0",
    "passlib[bcrypt]==1.7.4",
    "python-multipart==0.0.6",
    "email-validator>=2.3.0",
]
```

### フロントエンド（package.json）

```json
{
  "dependencies": {
    "axios": "^1.13.2",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-hot-toast": "^2.6.0",
    "react-router-dom": "^7.11.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.18",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "autoprefixer": "^10.4.23",
    "eslint": "^9.39.1",
    "tailwindcss": "^4.1.18",
    "typescript": "~5.9.3",
    "vite": "^7.2.4"
  }
}
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
│   │   ├── App.tsx           # ルートコンポーネント + ルーティング
│   │   ├── pages/            # ページコンポーネント
│   │   │   ├── Home.tsx     # ランディングページ
│   │   │   ├── Login.tsx    # ログインページ
│   │   │   ├── Register.tsx # ユーザー登録ページ
│   │   │   ├── Dashboard.tsx # ダッシュボード
│   │   │   ├── Transactions.tsx # 取引管理
│   │   │   ├── Categories.tsx # カテゴリ管理
│   │   │   └── Budgets.tsx  # 予算管理
│   │   ├── components/       # 共通コンポーネント
│   │   │   ├── Layout.tsx   # レイアウトコンポーネント
│   │   │   ├── PrivateRoute.tsx # 認証ルート
│   │   │   └── RecurringCategoryBanner.tsx # バナー
│   │   ├── contexts/         # React Context
│   │   │   └── AuthContext.tsx # 認証状態管理
│   │   ├── services/         # API通信
│   │   │   └── api.ts       # Axios Client + Interceptors
│   │   ├── types/            # TypeScript型定義
│   │   │   └── index.ts     # 型定義集約
│   │   ├── utils/            # ユーティリティ関数
│   │   │   └── errorHandler.ts # エラーハンドリング
│   │   └── assets/           # 静的ファイル
│   ├── package.json          # Node.js依存関係
│   ├── .env                  # 環境変数（gitignore対象）
│   └── .env.example          # 環境変数サンプル
├── doc/                       # ドキュメント（git worktree管理）
│   └── 01_設計資料/
│       ├── ARCHITECTURE.md        # アーキテクチャ設計書
│       ├── ENVIRONMENT.md         # 環境情報（このファイル）
│       ├── SETUP.md              # セットアップ手順書
│       └── NOTES.md              # 注意事項
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
