# システムアーキテクチャ

## システム全体構成

### 全体構成（3層アーキテクチャ）

```mermaid
graph TB
    subgraph "開発環境"
        Browser["Web Browser"]

        subgraph "フロントエンド層"
            Vite["Vite Dev Server<br/>:5173<br/>(React)"]
        end

        subgraph "アプリケーション層"
            FastAPI["FastAPI<br/>:8000<br/>(Uvicorn)"]
        end

        subgraph "データ層"
            PostgreSQL["PostgreSQL<br/>:5432"]
        end
    end

    Browser -->|http://localhost:5173| Vite
    Vite -->|API: http://localhost:8000| FastAPI
    FastAPI -->|SQL| PostgreSQL

    style PostgreSQL fill:#336791,color:#fff
    style FastAPI fill:#009688,color:#fff
    style Vite fill:#646CFF,color:#fff
    style Browser fill:#61DAFB,color:#000
```

### 3層構成の詳細

```mermaid
graph TB
    subgraph "プレゼンテーション層"
        Browser["Webブラウザ"]
        subgraph "React Frontend :5173"
            Pages["Pages<br/>Login, Dashboard,<br/>Transactions, etc."]
            Components["Components<br/>Layout, PrivateRoute"]
            Context["Context<br/>AuthContext"]
            Services["Services<br/>API Client (Axios)"]
        end
    end

    subgraph "アプリケーション層"
        subgraph "FastAPI Backend :8000"
            API["API Endpoints<br/>/auth, /categories,<br/>/transactions, /budgets"]
            Security["Security<br/>JWT, bcrypt"]
            Schemas["Pydantic Schemas"]
        end
    end

    subgraph "データ層"
        subgraph "PostgreSQL :5432"
            Tables["Tables<br/>users, categories,<br/>transactions, budgets"]
        end
    end

    Browser --> Pages
    Pages --> Components
    Pages --> Context
    Context --> Services
    Services -->|HTTP/JSON| API
    API --> Security
    API --> Schemas
    API -->|SQLAlchemy| Tables

    style Browser fill:#61DAFB,color:#000
    style Pages fill:#646CFF,color:#fff
    style API fill:#009688,color:#fff
    style Tables fill:#336791,color:#fff
```

### アプリケーション構成詳細

#### バックエンド構成

```mermaid
graph LR
    subgraph "FastAPI Application"
        Main["main.py<br/>FastAPIエントリーポイント"]
        API["api/endpoints/<br/>auth, categories,<br/>transactions, budgets"]
        Core["core/<br/>config, database, security"]
        Models["models/<br/>SQLAlchemy ORM"]
        Schemas["schemas/<br/>Pydantic"]
        Deps["api/dependencies.py<br/>認証・DI"]
    end

    Uvicorn["Uvicorn Server<br/>:8000"]
    Alembic["Alembic<br/>マイグレーション"]
    PostgreSQL["PostgreSQL<br/>Database: kakeibon"]

    Main --> Uvicorn
    API --> Main
    Deps --> API
    Core --> Main
    Models --> Core
    Schemas --> API

    Alembic -.->|Migration| PostgreSQL
    Core -->|SQLAlchemy| PostgreSQL

    style Main fill:#4B8BBE,color:#fff
    style Uvicorn fill:#499848,color:#fff
    style PostgreSQL fill:#336791,color:#fff
```

#### フロントエンド構成

```mermaid
graph LR
    subgraph "React Application"
        Main["main.tsx<br/>エントリーポイント"]
        App["App.tsx<br/>ルーティング"]
        Pages["pages/<br/>Dashboard, Transactions,<br/>Categories, Budgets"]
        Components["components/<br/>Layout, PrivateRoute"]
        Context["contexts/<br/>AuthContext"]
        Services["services/api.ts<br/>Axios Client"]
        Types["types/<br/>型定義"]
    end

    Vite["Vite Dev Server<br/>:5173"]
    Backend["Backend API<br/>:8000"]

    Main --> Vite
    App --> Main
    Pages --> App
    Components --> App
    Context --> App
    Services --> Context
    Services --> Pages
    Types --> Services

    Services -->|HTTP/JSON| Backend

    style Main fill:#646CFF,color:#fff
    style Vite fill:#646CFF,color:#fff
    style Backend fill:#009688,color:#fff
```

### ネットワーク通信フロー

```mermaid
sequenceDiagram
    participant Browser
    participant Vite as Vite Dev Server<br/>:5173
    participant React as React App
    participant Axios as Axios Client
    participant FastAPI as FastAPI<br/>:8000
    participant SQLAlchemy as SQLAlchemy
    participant PostgreSQL as PostgreSQL<br/>:5432

    Browser->>Vite: HTTP Request<br/>localhost:5173
    Vite-->>Browser: React App (HTML/JS/CSS)
    Browser->>React: User Action<br/>(e.g., Login)
    React->>Axios: API Call
    Axios->>FastAPI: HTTP Request<br/>localhost:8000/api/auth/login
    FastAPI->>SQLAlchemy: Query Data
    SQLAlchemy->>PostgreSQL: SQL Query
    PostgreSQL-->>SQLAlchemy: Result Set
    SQLAlchemy-->>FastAPI: ORM Objects
    FastAPI-->>Axios: JSON Response<br/>(access_token, user)
    Axios-->>React: Response Data
    React-->>Browser: Update UI
```

### 認証フロー（JWT）

```mermaid
sequenceDiagram
    participant Browser
    participant React
    participant AuthContext
    participant API
    participant FastAPI
    participant DB

    Note over Browser,DB: ユーザー登録/ログイン
    Browser->>React: ログインフォーム送信
    React->>AuthContext: login(email, password)
    AuthContext->>API: POST /api/auth/login
    API->>FastAPI: HTTP Request
    FastAPI->>DB: ユーザー検証
    DB-->>FastAPI: User Record
    FastAPI->>FastAPI: bcryptでパスワード検証
    FastAPI->>FastAPI: JWTトークン生成
    FastAPI-->>API: AuthResponse<br/>(access_token, user)
    API->>AuthContext: トークン保存
    AuthContext->>AuthContext: localStorage.setItem
    AuthContext-->>React: 認証成功
    React-->>Browser: ダッシュボードへリダイレクト

    Note over Browser,DB: 認証が必要なAPI呼び出し
    Browser->>React: データ取得要求
    React->>API: GET /api/transactions
    API->>API: Interceptor:<br/>Authorization Header追加
    API->>FastAPI: HTTP Request<br/>Bearer {token}
    FastAPI->>FastAPI: JWTトークン検証
    FastAPI->>DB: データ取得
    DB-->>FastAPI: Data
    FastAPI-->>API: JSON Response
    API-->>React: Data
    React-->>Browser: UI更新
```

### データベースマイグレーションフロー

```mermaid
graph TD
    A[モデル定義変更<br/>backend/app/models/] --> B[Alembicマイグレーション生成]
    B --> C[alembic revision --autogenerate]
    C --> D[マイグレーションファイル生成<br/>alembic/versions/]
    D --> E[マイグレーション実行<br/>alembic upgrade head]
    E --> F[PostgreSQLテーブル更新]
    F --> G[alembic_versionテーブル更新]

    style A fill:#FFE4B5,color:#000
    style C fill:#4B8BBE,color:#fff
    style E fill:#499848,color:#fff
    style F fill:#336791,color:#fff
```

## ポート構成

| サービス | ポート | 用途 |
|---------|-------|------|
| PostgreSQL | 5432 | データベース接続 |
| FastAPI/Uvicorn | 8000 | REST API サーバー |
| Vite Dev Server | 5173 | フロントエンド開発サーバー |

## 接続情報まとめ

### データベース接続

```bash
# ローカル開発環境
Host: localhost
Port: 5432
Database: kakeibon
User: postgres
Password: password

# WSL2コンテナ環境から接続する場合
Host: host.docker.internal
Port: 5432
```

### アプリケーションURL

```
フロントエンド:
  http://localhost:5173

バックエンドAPI:
  http://localhost:8000
  http://localhost:8000/docs (Swagger UI)
  http://localhost:8000/redoc (ReDoc)

APIエンドポイント:
  Base URL: http://localhost:8000/api
  - /api/auth (register, login, me)
  - /api/categories (CRUD)
  - /api/transactions (CRUD + フィルタ)
  - /api/budgets (CRUD + フィルタ)
```

## セキュリティ考慮事項

### 認証・認可

```mermaid
graph LR
    Client[クライアント] -->|1. ログイン| Auth[認証エンドポイント]
    Auth -->|2. JWT発行| Client
    Client -->|3. Bearer Token| API[保護されたAPI]
    API -->|4. トークン検証| Auth
    Auth -->|5. ユーザー情報| API
    API -->|6. レスポンス| Client

    style Auth fill:#FF6347,color:#fff
    style API fill:#009688,color:#fff
```

**実装されているセキュリティ機能**:
- JWT (JSON Web Token) による認証
- bcrypt によるパスワードハッシュ化
- CORS 設定 (localhost:3000, localhost:5173 のみ許可)
- 環境変数による機密情報管理 (.env ファイル)
- 所有者チェック (ユーザーは自分のリソースのみ操作可能)

**本番環境での注意事項**:
- SECRET_KEY を強力なランダム文字列に変更
- PostgreSQL を外部公開しない（アプリケーションからのみアクセス可能に）
- HTTPS を必須化
- CORS 設定を本番ドメインのみに制限
- レート制限の実装
- 定期的なセキュリティアップデート

## スケーリング構成（将来）

```mermaid
graph TB
    subgraph "Production Environment (Future)"
        LB[Load Balancer]

        subgraph "Application Layer"
            API1[FastAPI Instance 1]
            API2[FastAPI Instance 2]
            API3[FastAPI Instance 3]
        end

        subgraph "Database Layer"
            Master[(PostgreSQL<br/>Primary)]
            Replica1[(PostgreSQL<br/>Replica 1)]
            Replica2[(PostgreSQL<br/>Replica 2)]
        end

        Redis[(Redis Cache)]
    end

    Client[Clients] --> LB
    LB --> API1
    LB --> API2
    LB --> API3

    API1 --> Redis
    API2 --> Redis
    API3 --> Redis

    API1 -->|Write| Master
    API2 -->|Write| Master
    API3 -->|Write| Master

    API1 -->|Read| Replica1
    API2 -->|Read| Replica2
    API3 -->|Read| Replica1

    Master -.->|Replication| Replica1
    Master -.->|Replication| Replica2

    style LB fill:#FF6347,color:#fff
    style Master fill:#336791,color:#fff
    style Replica1 fill:#87CEEB,color:#000
    style Replica2 fill:#87CEEB,color:#000
    style Redis fill:#DC382D,color:#fff
```

現在は開発環境のため、単一のPostgreSQLインスタンスとFastAPIインスタンスで構成されていますが、
本番環境では上図のようなスケーラブルな構成を検討できます。
