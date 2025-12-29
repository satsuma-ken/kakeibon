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

### フロントエンド（予定）
- **フレームワーク**: React
- **ビルドツール**: Vite
- **言語**: TypeScript

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

## クイックスタート

### 前提条件

- WSL2
- Docker & Docker Compose
- Python 3.11以上
- uv (Pythonパッケージマネージャー)

### 1. 依存関係のインストール

```bash
uv sync
```

### 2. PostgreSQLの起動

```bash
cd db
docker-compose up -d
```

### 3. 開発コンテナをネットワークに接続

```bash
docker network connect kakeibon-network python-claude-dev
```

### 4. 環境変数の設定

```bash
cd backend
cp .env.example .env
```

### 5. データベースマイグレーション

```bash
cd backend
uv run alembic upgrade head
```

### 6. サーバーの起動

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 7. アクセス

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

詳細は[セットアップ手順書](doc/SETUP.md)を参照してください。

## プロジェクト構成

```
kakeibon/
├── backend/              # バックエンドアプリケーション
│   ├── app/
│   │   ├── api/         # APIエンドポイント
│   │   ├── core/        # コア機能
│   │   ├── models/      # データベースモデル
│   │   ├── schemas/     # Pydanticスキーマ
│   │   └── main.py      # エントリーポイント
│   └── alembic/         # マイグレーション
├── db/                  # データベース関連
│   ├── docker-compose.yml
│   └── init/            # 初期化スクリプト
├── doc/                 # ドキュメント
└── frontend/            # フロントエンド（予定）
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
- [ ] API エンドポイント実装
  - [ ] ユーザー登録・ログイン
  - [ ] カテゴリCRUD
  - [ ] 取引CRUD
  - [ ] 予算管理
- [ ] フロントエンド実装
- [ ] テスト実装
- [ ] デプロイ設定

## ライセンス

TBD

## 貢献

TBD
