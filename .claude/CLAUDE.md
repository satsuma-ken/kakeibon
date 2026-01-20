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

## Claude Codeエージェント分業ポリシー

### 基本方針

**担当できそうなサブエージェントがある場合、Taskツールを使って専門エージェントに作業を委譲してください。**

メインエージェントが直接作業するのではなく、専門知識を持つサブエージェントを活用することで：
- **包括性**: より多角的な視点でタスクを実行
- **一貫性**: プロジェクトルールを統合的に適用
- **品質向上**: 専門エージェントの知識ベースを活用

### 利用可能なサブエージェント

| エージェント | 使用タイミング | 起動方法 |
|------------|-------------|---------|
| **code-review-advisor** | PRレビュー、包括的なコードレビュー依頼 | `Task` tool, `subagent_type: "code-review-advisor"` |
| **architecture-advisor** | 設計資料の作成・更新（ユーザーが明示的に指示した時のみ） | `Task` tool, `subagent_type: "architecture-advisor"` |
| **security-advisor** | セキュリティ専門レビュー（認証、SQL、XSS、データ保護） | `Task` tool, `subagent_type: "security-advisor"` |
| **Explore** | コードベース探索、複数ファイルの検索、構造理解 | `Task` tool, `subagent_type: "Explore"` |
| **Plan** | 実装計画の立案、アーキテクチャ設計 | `Task` tool, `subagent_type: "Plan"` |

### architecture-advisorの特別な扱い

**architecture-advisor**は、他のサブエージェントとは異なる使い方をします：

- **用途**: `doc/01_設計資料/`内の設計資料（アーキテクチャ図、システム設計書）の作成・更新
- **呼び出し方**: ユーザーが明示的に「architecture-advisorを使って設計資料を作成/更新して」と指示した時のみ使用
- **自動実行禁止**:
  - メインエージェントから勝手に呼び出さない
  - 「実装方針を提案して」「アーキテクチャ規約に従っているか確認して」という要求では呼び出さない
- **日常的な開発**:
  - アーキテクチャの確認が必要な時は`doc/01_設計資料/ARCHITECTURE.md`を参照
  - コーディング規約の確認が必要な時は`.claude/CLAUDE.md`または`.claude/rules/`を参照

**理由**: 設計資料は一度作成すれば参照できるため、毎回エージェントを呼び出す必要はありません。設計資料を最新に保つための更新時のみ使用します。

### タスク別のエージェント選択ガイド

#### コードレビュー関連

- **「PRをレビューして」**: → `code-review-advisor`
- **「コードをレビューして」**: → `code-review-advisor`
- **「セキュリティチェックして」**: → `security-advisor`

#### 実装・設計関連

- **「新機能を実装したい」**: → `Plan` で計画立案 → 実装
- **「実装方針を提案して」**: → `Explore` でコードベース探索 → `doc/01_設計資料/`を参照して提案
- **「どこに実装すべきか」**: → `Explore` でコードベース探索 → `doc/01_設計資料/`を参照
- **「アーキテクチャ規約に従っているか確認して」**: → `doc/01_設計資料/ARCHITECTURE.md`と`.claude/CLAUDE.md`を読んで確認
- **「設計資料を作成/更新して」**: → `architecture-advisor`（ユーザーの明示的な指示時のみ）

#### 調査・探索関連

- **「XXXの実装はどこにある？」**: → `Explore`
- **「このエラーの原因を調査して」**: → `Explore`
- **「コードベースの構造を教えて」**: → `Explore`

### メインエージェントで対応可能なケース

以下の場合のみ、メインエージェントが直接対応できます：

- ✅ 簡単な質問（「この関数は何をしていますか？」）
- ✅ 単一ファイルの確認・説明
- ✅ 明確な単純作業（タイポ修正、簡単な変数名変更）
- ✅ ドキュメント作成（ただし、内容の検証は専門エージェントに依頼）

### サブエージェント使用の具体例

#### 例1: PRレビュー

```
❌ 間違い:
ユーザー: 「PR #36 をレビューして」
メインエージェント: [直接ファイルを読んでレビュー]

✅ 正しい:
ユーザー: 「PR #36 をレビューして」
メインエージェント: [Taskツールでcode-review-advisorを起動]
```

#### 例2: 新機能実装

```
❌ 間違い:
ユーザー: 「CSVエクスポート機能を追加して」
メインエージェント: [いきなり実装開始]

✅ 正しい:
ユーザー: 「CSVエクスポート機能を追加して」
メインエージェント: [Planエージェントで計画立案] → [doc/01_設計資料/を参照して設計確認] → [実装]
```

#### 例3: セキュリティ確認

```
❌ 間違い:
ユーザー: 「認証機能のセキュリティをチェックして」
メインエージェント: [直接コードを読んで簡易チェック]

✅ 正しい:
ユーザー: 「認証機能のセキュリティをチェックして」
メインエージェント: [Taskツールでsecurity-advisorを起動]
```

#### 例4: アーキテクチャ規約の確認

```
❌ 間違い:
ユーザー: 「この実装がアーキテクチャ規約に従っているか確認して」
メインエージェント: [Taskツールでarchitecture-advisorを起動]

✅ 正しい:
ユーザー: 「この実装がアーキテクチャ規約に従っているか確認して」
メインエージェント: [doc/01_設計資料/ARCHITECTURE.mdと.claude/CLAUDE.mdを読んで規約を確認] → [実装コードと比較してフィードバック]
```

### 複数エージェントの連携

サブエージェント同士も連携できます：

- `code-review-advisor` → `security-advisor`（セキュリティ面の詳細確認）
- `Explore` → `Plan`（探索結果を元に計画立案）

**注意**: `architecture-advisor`は設計資料の作成・更新専用のため、他のエージェントから自動的に呼び出すことはしません。代わりに`doc/01_設計資料/`を参照します。

### 判断基準

**「このタスクは専門知識が必要か？」**

- はい → サブエージェントを使用
- いいえ → メインエージェントで対応

迷ったら、サブエージェントを使用してください。過剰に使用しても問題ありませんが、使用不足は品質低下につながります。

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
