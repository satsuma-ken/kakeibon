# データベース設定

## 概要

このディレクトリにはKakeibon（家計簿）アプリケーションのデータベース関連ファイルが含まれています。

## ファイル構成

```
db/
├── docker-compose.yml  # PostgreSQL開発環境
├── init/               # データベース初期化スクリプト
└── README.md          # このファイル
```

## 使い方

### 1. PostgreSQLの起動

```bash
cd db
docker-compose up -d
```

### 2. データベースの状態確認

```bash
docker-compose ps
```

### 3. PostgreSQLへの接続

```bash
docker-compose exec postgres psql -U postgres -d kakeibo
```

### 4. PostgreSQLの停止

```bash
docker-compose down
```

### 5. データベースを完全にリセット（ボリュームも削除）

```bash
docker-compose down -v
```

## データベース接続情報

- **ホスト**: localhost
- **ポート**: 5432
- **ユーザー**: postgres
- **パスワード**: password
- **データベース名**: kakeibo

## 初期化スクリプト

`init/` ディレクトリに `.sql` ファイルを配置すると、コンテナ初回起動時に自動実行されます。

例:
- `init/01_create_extension.sql` - PostgreSQL拡張機能の有効化
- `init/02_seed_data.sql` - 初期データの投入

## 注意事項

- 本番環境では、環境変数を使用してセキュアに接続情報を管理してください
- パスワードは必ず変更してください
- データベースボリュームは永続化されるため、コンテナを削除してもデータは残ります
