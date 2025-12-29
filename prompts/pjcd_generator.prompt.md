# 家計簿アプリ（Kakeibo App）環境構築指示書

## 概要
公開を視野に入れた家計簿Webアプリを作成します。
GitHubリポジトリの作成から環境構築までをお願いします。

## 技術スタック
- フロントエンド: React
- バックエンド: Python (FastAPI)
- データベース: PostgreSQL
- 認証: JWT

## GitHubリポジトリ
- リポジトリ名: kakeibon
- 公開設定: Private
- README.md を含める
- .gitignore は Python と Node.js の両方に対応

## プロジェクト構成

```
kakeibon/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── endpoints/
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── category.py
│   │   │   ├── transaction.py
│   │   │   └── budget.py
│   │   └── schemas/
│   │       ├── __init__.py
│   │       ├── user.py
│   │       ├── category.py
│   │       ├── transaction.py
│   │       └── budget.py
│   ├── requirements.txt
│   ├── .env.example
│   └── alembic/（マイグレーション用）
├── frontend/
│   └── （React プロジェクト）
├── README.md
├── .gitignore
└── docker-compose.yml（開発環境用）
```

## データベース設計

### users テーブル
| カラム名 | 型 | 制約 |
|---------|-----|------|
| user_id | UUID | PRIMARY KEY |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| name | VARCHAR(100) | NOT NULL |
| created_at | TIMESTAMP | DEFAULT now() |

### categories テーブル
| カラム名 | 型 | 制約 |
|---------|-----|------|
| category_id | UUID | PRIMARY KEY |
| user_id | UUID | FOREIGN KEY → users.user_id |
| name | VARCHAR(100) | NOT NULL |
| type | ENUM('income', 'expense') | NOT NULL |
| color | VARCHAR(7) | DEFAULT '#808080' |
| created_at | TIMESTAMP | DEFAULT now() |

### transactions テーブル
| カラム名 | 型 | 制約 |
|---------|-----|------|
| transaction_id | UUID | PRIMARY KEY |
| user_id | UUID | FOREIGN KEY → users.user_id |
| category_id | UUID | FOREIGN KEY → categories.category_id |
| amount | INTEGER | NOT NULL |
| type | ENUM('income', 'expense') | NOT NULL |
| date | DATE | NOT NULL |
| memo | TEXT | NULLABLE |
| created_at | TIMESTAMP | DEFAULT now() |

### budgets テーブル
| カラム名 | 型 | 制約 |
|---------|-----|------|
| budget_id | UUID | PRIMARY KEY |
| user_id | UUID | FOREIGN KEY → users.user_id |
| category_id | UUID | FOREIGN KEY → categories.category_id |
| amount | INTEGER | NOT NULL |
| month | DATE | NOT NULL |
| created_at | TIMESTAMP | DEFAULT now() |

## バックエンド依存関係 (requirements.txt)

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
psycopg2-binary==2.9.9
alembic==1.13.1
pydantic==2.5.3
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
```

## 環境変数 (.env.example)

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/kakeibo
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 実装してほしいファイル

### 1. app/core/config.py
pydantic-settings を使用した設定管理

### 2. app/core/database.py
SQLAlchemy のエンジンとセッション設定

### 3. app/core/security.py
- パスワードのハッシュ化 (passlib + bcrypt)
- JWTトークンの生成・検証 (python-jose)

### 4. app/models/*.py
上記のテーブル設計に基づいた SQLAlchemy モデル
- リレーションシップを適切に設定
- IDは各テーブル名をsuffixにする（user_id, category_id など）

### 5. app/schemas/*.py
Pydantic スキーマ（リクエスト/レスポンス用）

### 6. app/main.py
FastAPI アプリケーションのエントリーポイント
- CORS設定を含める

### 7. docker-compose.yml
開発用のPostgreSQLコンテナ設定

### 8. alembic 設定
データベースマイグレーション用の初期設定

## フロントエンド

React プロジェクトを作成してください（Vite推奨）
- TypeScript を使用
- 必要最小限の初期設定のみでOK

## 作業完了後の確認

1. docker-compose up -d でDBが起動すること
2. alembic upgrade head でマイグレーションが実行できること
3. uvicorn app.main:app --reload でAPIが起動すること
4. http://localhost:8000/docs でSwagger UIが表示されること
5. フロントエンドが npm run dev で起動すること

## 注意事項

- コミットは機能単位で細かく分ける
- 各ファイルには適切なコメントを含める
- セキュリティのベストプラクティスに従う