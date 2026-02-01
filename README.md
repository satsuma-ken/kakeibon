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

このアプリケーションは、バックエンド（FastAPI）とフロントエンド（React）の2つのサービスで構成されています。

### 前提条件

- **WSL2** がインストールされていること
- **Docker & Docker Compose** がインストールされていること
- **Python 3.11以上** がインストールされていること
- **uv** (Pythonパッケージマネージャー) がインストールされていること
- **Node.js 18以上** と **npm** がインストールされていること

### 初回セットアップ

#### 1. ドキュメントの取得

このプロジェクトのドキュメントは、orphanブランチ `doc` で管理されています。初回セットアップ時に以下のコマンドでドキュメントを取得してください。

```bash
# プロジェクトルートで実行  
git fetch origin
git worktree add doc origin/orphan-doc
cd doc
git checkout -b orphan-doc
```

これにより、`doc/` ディレクトリが作成され、ドキュメントファイルが配置されます。

> **注意**: `git worktree` を使用するため、`doc/` ディレクトリは別のワーキングツリーとして管理されます。通常のブランチ切り替え時には影響を受けません。

#### 2. 依存関係のインストール

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

#### 3. 環境変数の設定

必要に応じて`.env`ファイルを編集してください。

#### 4. データベースマイグレーション

```bash
cd backend
uv run alembic upgrade head
```

### 日常的な開発起動手順

開発時は以下の2つのサービスを起動する必要があります。以下の2つの方法から選択してください。

#### 方法1: 一括起動スクリプト（推奨）

**最も簡単な方法**: 1つのコマンドで両方のサーバーを起動できます。

```bash
# プロジェクトルートから実行
doc/start-dev.sh
```

**特徴**:
- ✅ 1つのターミナルで完結
- ✅ バックエンドとフロントエンドを同時に起動
- ✅ ポート競合を自動チェック
- ✅ プロセス監視機能付き

**停止方法**:
- **同じターミナルから**: `Ctrl + C`
- **別のターミナルから**: `doc/stop-dev.sh`

**ログの確認**:
```bash
# バックエンドのログ
tail -f .dev/backend.log

# フロントエンドのログ
tail -f .dev/frontend.log
```

#### 方法2: 手動起動（個別制御が必要な場合）

サービスを個別に制御したい場合は、従来通り2つのターミナルで起動できます。

**ターミナル1: FastAPIバックエンド**

```bash
# プロジェクトルートから実行
cd backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

停止する場合: `Ctrl + C`

**ターミナル2: React フロントエンド**

```bash
# プロジェクトルートから実行
cd frontend
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

### トラブルシューティング

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
