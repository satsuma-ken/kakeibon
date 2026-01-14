# Kakeibon プロジェクトメモリ

このファイルは、Claude Codeがkakeibonプロジェクトについて記憶すべき重要な情報を記録します。

## プロジェクト概要

家計簿Webアプリケーション「Kakeibon」
- **バックエンド**: FastAPI + SQLAlchemy + PostgreSQL
- **フロントエンド**: React 18 + TypeScript + Vite + TailwindCSS
- **認証**: JWT (python-jose)
- **開発環境**: WSL2 + Docker

## アーキテクチャの重要なポイント

### バックエンド構成

```
backend/
├── app/
│   ├── api/endpoints/  # 認証、カテゴリ、取引、予算のAPIエンドポイント
│   ├── core/          # 設定、セキュリティ（JWT）
│   ├── models/        # SQLAlchemyモデル
│   ├── schemas/       # Pydanticスキーマ（バリデーション）
│   └── main.py        # FastAPIアプリケーションエントリーポイント
├── alembic/           # データベースマイグレーション
└── .env               # 環境変数（gitignore対象）
```

### フロントエンド構成

```
frontend/
├── src/
│   ├── components/    # 再利用可能なUIコンポーネント
│   ├── pages/        # ページコンポーネント（Dashboard, Transactions, etc.）
│   ├── contexts/     # React Context（AuthContext）
│   ├── services/     # API通信ロジック（axios）
│   └── types/        # TypeScript型定義
└── package.json
```

### データベーススキーマ

- **users**: ユーザー情報（JWT認証用）
- **categories**: 収支カテゴリ
- **transactions**: 取引記録（金額、日付、カテゴリ、メモ）
- **budgets**: 予算管理

## コーディング規約

### Python (Backend)

- **スタイル**: PEP 8準拠
- **型ヒント**: 可能な限り使用
- **Pydantic**: バリデーションとスキーマ定義に使用
- **命名規則**:
  - モデル: PascalCase (例: `User`, `Transaction`)
  - スキーマ: PascalCase + Suffix (例: `UserCreate`, `TransactionResponse`)
  - 関数/変数: snake_case

### TypeScript (Frontend)

- **スタイル**: ESLint設定に準拠
- **型定義**: any型を避け、適切な型を定義
- **コンポーネント**: 関数コンポーネント + Hooks
- **命名規則**:
  - コンポーネント: PascalCase (例: `Dashboard`, `TransactionList`)
  - 関数/変数: camelCase
  - 型/インターフェース: PascalCase

### API設計パターン

- RESTful APIの原則に従う
- エンドポイント: `/api/v1/{resource}`
- 認証: Bearer Token (JWT)
- エラーレスポンス: HTTPステータスコード + JSONメッセージ

## 開発フロー

### バックエンド開発

1. モデル定義 (`app/models/`)
2. Pydanticスキーマ作成 (`app/schemas/`)
3. APIエンドポイント実装 (`app/api/endpoints/`)
4. **Alembicマイグレーション作成**: `uv run alembic revision --autogenerate -m "description"`
5. マイグレーション適用: `uv run alembic upgrade head`
6. テスト実行: `pytest`

### フロントエンド開発

1. 型定義作成 (`src/types/`)
2. APIサービス実装 (`src/services/`)
3. コンポーネント作成 (`src/components/` or `src/pages/`)
4. ビルド確認: `npm run build`
5. テスト実行: `npm test`

### Git運用

- **メインブランチ**: `main`
- **フィーチャーブランch**: `feature/xxx`, `topic/xxx`
- **コミットメッセージ**: 日本語OK、変更の「なぜ」を記述
- **プルリクエスト**: レビュー必須

## 重要な注意事項

### セキュリティ

1. **.envファイルは絶対にコミットしない**
   - データベース認証情報
   - JWTシークレットキー
   - API秘密鍵

2. **認証が必要なエンドポイント**
   - `/api/v1/categories/*`
   - `/api/v1/transactions/*`
   - `/api/v1/budgets/*`
   - 例外: `/api/v1/auth/*` (ログイン・登録)

3. **SQLインジェクション対策**
   - SQLAlchemyのORMを使用（生SQLは避ける）
   - Pydanticでバリデーション

### パフォーマンス

- データベースクエリの N+1 問題に注意
- フロントエンドでの過度な再レンダリング防止（React.memo, useMemo使用）
- 大量データの表示にはページネーション実装

### 開発時の起動順序

1. PostgreSQLコンテナ起動（Docker Compose）
2. バックエンド起動: `cd backend && uv run uvicorn app.main:app --reload`
3. フロントエンド起動: `cd frontend && npm run dev`

### ドキュメント

詳細なドキュメントは `doc/` ディレクトリ（git worktree管理）:
- `doc/ENVIRONMENT.md`: 環境情報
- `doc/ARCHITECTURE.md`: アーキテクチャ図
- `doc/SETUP.md`: セットアップ手順
- `doc/NOTES.md`: 注意ポイント

## よくある問題と解決策

### "Port already in use"

```bash
# ポート8000を使用中のプロセスを終了
lsof -i :8000
kill -9 <PID>
```

### Alembicマイグレーションエラー

```bash
# マイグレーション履歴確認
uv run alembic current
uv run alembic history

# ロールバック
uv run alembic downgrade -1
```

### npm install エラー

```bash
# node_modules削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

## テストカバレッジ目標

- バックエンド: 80%以上（ユニットテスト + 統合テスト）
- フロントエンド: 70%以上（コンポーネントテスト）

## 今後の実装予定

- [ ] テスト実装（pytest, Jest）
- [ ] CI/CDパイプライン（GitHub Actions）
- [ ] デプロイ設定（Docker Compose本番環境）
- [ ] 統計・レポート機能
- [ ] データエクスポート機能（CSV, PDF）
