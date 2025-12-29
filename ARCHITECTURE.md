# システムアーキテクチャ

## Docker構成図

### 全体構成

```mermaid
graph TB
    subgraph "WSL2 Host"
        subgraph "Docker Network: kakeibon-network<br/>172.21.0.0/16"
            PostgreSQL["PostgreSQL Container<br/>kakeibon-postgres<br/>172.21.0.2:5432"]
            DevContainer["Development Container<br/>python-claude-dev<br/>172.21.0.3"]
        end

        Volume["Docker Volume<br/>postgres_data"]
        InitScripts["./db/init/<br/>初期化スクリプト"]
    end

    Browser["Web Browser<br/>localhost:8000"]
    DBClient["Database Client<br/>localhost:5432"]

    Browser -->|HTTP| DevContainer
    DBClient -->|PostgreSQL Protocol| PostgreSQL
    DevContainer -->|SQL Query| PostgreSQL
    PostgreSQL -->|永続化| Volume
    InitScripts -.->|初回起動時| PostgreSQL

    style PostgreSQL fill:#336791,color:#fff
    style DevContainer fill:#4B8BBE,color:#fff
    style Volume fill:#FFA500,color:#fff
    style Browser fill:#61DAFB,color:#000
    style DBClient fill:#90EE90,color:#000
```

### コンテナ詳細構成

```mermaid
graph LR
    subgraph "python-claude-dev Container"
        subgraph "FastAPI Application"
            Main["main.py<br/>FastAPI App"]
            API["api/<br/>Endpoints"]
            Core["core/<br/>Config, DB, Security"]
            Models["models/<br/>SQLAlchemy ORM"]
            Schemas["schemas/<br/>Pydantic"]
        end

        Uvicorn["Uvicorn Server<br/>:8000"]
        Alembic["Alembic<br/>Migration Tool"]
    end

    subgraph "kakeibon-postgres Container"
        PG["PostgreSQL 15.15"]
        DB["Database: kakeibo"]
        Tables["Tables:<br/>users, categories,<br/>transactions, budgets"]
    end

    Main --> Uvicorn
    API --> Main
    Core --> Main
    Models --> Core
    Schemas --> API

    Alembic -.->|Migration| PG
    Core -->|SQLAlchemy| PG
    PG --> DB
    DB --> Tables

    style Main fill:#4B8BBE,color:#fff
    style Uvicorn fill:#499848,color:#fff
    style PG fill:#336791,color:#fff
    style DB fill:#87CEEB,color:#000
```

### ネットワーク通信フロー

```mermaid
sequenceDiagram
    participant Browser
    participant Uvicorn as Uvicorn<br/>(python-claude-dev)
    participant FastAPI as FastAPI App
    participant SQLAlchemy as SQLAlchemy
    participant PostgreSQL as PostgreSQL<br/>(kakeibon-postgres)

    Browser->>Uvicorn: HTTP Request<br/>localhost:8000/api/...
    Uvicorn->>FastAPI: Route Request
    FastAPI->>SQLAlchemy: Query Data
    SQLAlchemy->>PostgreSQL: SQL Query<br/>kakeibon-postgres:5432
    PostgreSQL-->>SQLAlchemy: Result Set
    SQLAlchemy-->>FastAPI: ORM Objects
    FastAPI-->>Uvicorn: JSON Response
    Uvicorn-->>Browser: HTTP Response
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

| サービス | コンテナ内ポート | ホスト公開ポート | 用途 |
|---------|----------------|-----------------|------|
| PostgreSQL | 5432 | 5432 | データベース接続 |
| FastAPI/Uvicorn | 8000 | 8000 | API/Webサーバー |

## ボリュームマウント

```mermaid
graph LR
    subgraph "WSLホスト"
        ProjectDir["~/dev/python-docker-env/<br/>projects/kakeibon"]
        InitDir["./db/init/"]
    end

    subgraph "PostgreSQLコンテナ"
        PGData["/var/lib/postgresql/data"]
        EntryPoint["/docker-entrypoint-initdb.d"]
    end

    subgraph "開発コンテナ"
        WorkDir["/usr/src/projects/kakeibon"]
    end

    subgraph "Dockerボリューム"
        Volume["postgres_data"]
    end

    ProjectDir -.->|bind mount| WorkDir
    InitDir -.->|bind mount| EntryPoint
    Volume -->|volume mount| PGData

    style Volume fill:#FFA500,color:#fff
    style PGData fill:#336791,color:#fff
```

## 接続情報まとめ

### コンテナ間通信（内部ネットワーク）

```
開発コンテナ → PostgreSQL
  Host: kakeibon-postgres
  Port: 5432
  Network: kakeibon-network (172.21.0.0/16)
```

### WSLホスト → PostgreSQL

```
WSLホスト → PostgreSQL
  Host: localhost
  Port: 5432
  接続: ポートフォワーディング経由
```

### ブラウザ → FastAPI

```
ブラウザ → FastAPI
  URL: http://localhost:8000
  Swagger UI: http://localhost:8000/docs
```

## セキュリティ考慮事項

### ネットワーク分離

```mermaid
graph TB
    subgraph "外部アクセス可能"
        Browser[ブラウザ<br/>:8000]
        DBClient[DBクライアント<br/>:5432]
    end

    subgraph "内部ネットワーク<br/>kakeibon-network"
        direction LR
        Dev[開発コンテナ]
        DB[PostgreSQL]
        Dev <-->|内部通信| DB
    end

    Browser --> Dev
    DBClient --> DB

    style Browser fill:#90EE90,color:#000
    style DBClient fill:#FFB6C1,color:#000
    style Dev fill:#4B8BBE,color:#fff
    style DB fill:#336791,color:#fff
```

**重要**:
- PostgreSQLは外部にポート公開されていますが、本番環境では非公開にすべきです
- 開発環境でのみポートを公開し、本番環境では内部ネットワークのみで通信します
- 認証情報（パスワード、SECRET_KEY）は必ず環境変数で管理し、.envファイルをgitignoreに追加済みです

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
