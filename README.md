# Kakeibon（家計簿）

公開を視野に入れた家計簿Webアプリケーション

## 概要

Kakeibon（家計簿）は、個人の収支を管理するためのWebアプリケーションです。
FastAPIとReactを使用した、モダンなフルスタック構成で開発されています。

## 技術スタック

### バックエンド
- **フレームワーク**: FastAPI 0.109.0
- **言語**: Python 3.11
- **ORM**: SQLAlchemy 2.0
- **マイグレーション**: Alembic
- **認証**: JWT (python-jose)
- **バリデーション**: Pydantic v2

### データベース
- **DBMS**: PostgreSQL 15
- **コンテナ**: Docker Compose

### フロントエンド
- **フレームワーク**: React 18
- **ビルドツール**: Vite
- **言語**: TypeScript
- **ルーティング**: React Router v6
- **HTTPクライアント**: Axios
- **スタイリング**: TailwindCSS

## 主な機能

- ユーザー認証（JWT）
- 収支の記録・管理
- カテゴリ管理
- 予算設定
- 統計・レポート機能（予定）

## ドキュメント

詳細なドキュメントは`doc/`ディレクトリにあります：

- [環境情報](doc/ENVIRONMENT.md) - 開発環境の詳細情報
- [アーキテクチャ](doc/ARCHITECTURE.md) - Docker構成図とシステムアーキテクチャ
- [セットアップ手順](doc/SETUP.md) - 初期セットアップと日常的な開発フロー
- [注意ポイント](doc/NOTES.md) - セキュリティや開発上の重要事項

## 開発起動手順

このアプリケーションは、バックエンド（FastAPI）、データベース（PostgreSQL）、フロントエンド（React）の3つのサービスで構成されています。

### 前提条件

- **WSL2** がインストールされていること
- **Docker & Docker Compose** がインストールされていること
- **Python 3.11以上** がインストールされていること
- **uv** (Pythonパッケージマネージャー) がインストールされていること
- **Node.js 18以上** と **npm** がインストールされていること

### 初回セットアップ

#### 1. 依存関係のインストール

**バックエンド:**
```bash
# プロジェクトルートで実行
uv sync
```

**フロントエンド:**
```bash
cd frontend
npm install
```

#### 2. PostgreSQLの起動

**WSLターミナルで実行:**
```bash
cd db
docker-compose up -d
```

起動確認:
```bash
docker-compose ps
```

`kakeibon-postgres`コンテナが`Up`状態であることを確認してください。

#### 3. 開発コンテナをネットワークに接続

開発コンテナがPostgreSQLと通信できるように、同じDockerネットワークに接続します。

```bash
# 開発コンテナ名を確認
docker ps --format "{{.Names}}"

# kakeibon-networkに接続（コンテナ名は環境に応じて変更）
docker network connect kakeibon-network <your-container-name>
```

接続確認:
```bash
docker network inspect kakeibon-network
```

開発コンテナと`kakeibon-postgres`の両方が表示されることを確認します。

#### 4. 環境変数の設定

```bash
cd backend
cp .env.example .env
```

必要に応じて`.env`ファイルを編集してください。

#### 5. データベースマイグレーション

```bash
cd backend
uv run alembic upgrade head
```

### 日常的な開発起動手順

開発時は以下の3つのサービスを起動する必要があります。**それぞれ別のターミナルで実行してください。**

#### ターミナル1: PostgreSQL

```bash
cd /usr/src/projects/kakeibon/db
docker-compose up -d
```

停止する場合:
```bash
docker-compose down
```

#### ターミナル2: FastAPIバックエンド（開発コンテナ内）

```bash
cd /usr/src/projects/kakeibon/backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

停止する場合: `Ctrl + C`

#### ターミナル3: React フロントエンド（開発コンテナ内）

```bash
cd /usr/src/projects/kakeibon/frontend
npm run dev
```

停止する場合: `Ctrl + C`

### アクセスURL

すべてのサービスが起動したら、以下のURLにアクセスできます:

- **フロントエンド**: http://localhost:5173
  - ユーザー登録・ログイン
  - ダッシュボード
  - 取引管理
  - カテゴリ管理
  - 予算管理

- **バックエンドAPI**:
  - **Swagger UI**: http://localhost:8000/docs
  - **ReDoc**: http://localhost:8000/redoc
  - **Health Check**: http://localhost:8000/health

- **データベース**: localhost:5432
  - ユーザー: `postgres`
  - パスワード: `password`
  - データベース: `kakeibo`

### トラブルシューティング

#### データベースに接続できない

```bash
# PostgreSQLが起動しているか確認
cd db
docker-compose ps

# ネットワーク接続を確認
docker network inspect kakeibon-network

# 開発コンテナを再接続
docker network connect kakeibon-network <your-container-name>
```

#### ポートが既に使用されている

```bash
# ポート8000を使用しているプロセスを探す
lsof -i :8000  # または netstat -tlnp | grep 8000

# プロセスを終了
kill -9 <PID>
```

#### フロントエンドが表示されない

- Viteの設定で `host: '0.0.0.0'` が設定されているか確認
- ブラウザのキャッシュをクリア
- ブラウザの開発者ツールでエラーを確認

### 詳細なドキュメント

より詳細な情報は以下のドキュメントを参照してください:

- [セットアップ手順書](doc/SETUP.md) - 初期セットアップと詳細な設定
- [環境情報](doc/ENVIRONMENT.md) - 開発環境の詳細情報
- [アーキテクチャ](doc/ARCHITECTURE.md) - システムアーキテクチャ
- [注意ポイント](doc/NOTES.md) - セキュリティや開発上の重要事項

## プロジェクト構成

```
kakeibon/
├── backend/              # バックエンドアプリケーション
│   ├── app/
│   │   ├── api/         # APIエンドポイント
│   │   │   └── endpoints/ # 認証、カテゴリ、取引、予算API
│   │   ├── core/        # コア機能（設定、セキュリティ）
│   │   ├── models/      # データベースモデル
│   │   ├── schemas/     # Pydanticスキーマ
│   │   └── main.py      # エントリーポイント
│   ├── alembic/         # マイグレーション
│   └── .env             # 環境変数
├── db/                  # データベース関連
│   ├── docker-compose.yml
│   └── init/            # 初期化スクリプト
├── doc/                 # ドキュメント
└── frontend/            # フロントエンドアプリケーション
    ├── src/
    │   ├── components/  # 共通コンポーネント
    │   ├── pages/       # ページコンポーネント
    │   ├── contexts/    # React Context
    │   ├── services/    # API通信
    │   └── types/       # TypeScript型定義
    └── package.json
```

## データベーススキーマ

- **users** - ユーザー情報
- **categories** - カテゴリ情報
- **transactions** - 取引情報
- **budgets** - 予算情報

詳細は[環境情報ドキュメント](doc/ENVIRONMENT.md#データベーススキーマ)を参照してください。

## 開発状況

- [x] バックエンド基盤構築
  - [x] FastAPI セットアップ
  - [x] データベースモデル定義
  - [x] マイグレーション設定
  - [x] JWT認証機能
- [x] API エンドポイント実装
  - [x] ユーザー登録・ログイン
  - [x] カテゴリCRUD
  - [x] 取引CRUD
  - [x] 予算管理
- [x] フロントエンド実装
  - [x] React + TypeScript + Vite セットアップ
  - [x] 認証機能（ログイン・登録）
  - [x] ダッシュボード
  - [x] 取引管理画面
  - [x] カテゴリ管理画面
  - [x] 予算管理画面
- [ ] テスト実装
- [ ] デプロイ設定

## ライセンス

TBD

## 貢献

TBD
