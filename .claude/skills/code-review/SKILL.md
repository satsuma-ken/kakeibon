---
name: code-review
description: Kakeibonプロジェクトのコードを包括的にレビューします。コードの品質、セキュリティ、アーキテクチャの整合性をチェックします。コード変更やプルリクエストのレビュー時に使用してください。
---

# Code Review Skill - Kakeibon プロジェクト

このスキルは、Kakeibonプロジェクト（家計簿Webアプリ）のコード全体を包括的にレビューします。

## 前提条件（必須）

**レビュー開始前に、以下の設計資料を必ず読んでください：**

1. `doc/01_設計資料/ARCHITECTURE.md` - システム全体構成、デザインパターン、コーディング規約
2. `doc/01_設計資料/IMPLEMENTATION_STATUS.md` - 実装状況、技術スタック、ディレクトリ構成

これにより：
- プロジェクト全体のアーキテクチャを理解した上でレビューできます
- 実装済み/未実装機能を把握した上で適切なフィードバックができます
- コーディング規約やデザインパターンに沿ったレビューができます

## レビュー対象

- **バックエンド**: FastAPI + SQLAlchemy + PostgreSQL
- **フロントエンド**: React 18 + TypeScript + Vite + TailwindCSS
- **認証**: JWT (python-jose)

## レビュー項目

### 1. コーディングスタイル

#### Python (Backend)
- [ ] PEP 8準拠（命名規則、インデント、行の長さ）
- [ ] 型ヒントの使用（関数の引数と戻り値）
- [ ] Docstring（複雑な関数のみ）
- [ ] 命名規則:
  - モデル: PascalCase (`User`, `Transaction`)
  - スキーマ: PascalCase + Suffix (`UserCreate`, `TransactionResponse`)
  - 関数/変数: snake_case
  - 定数: UPPER_SNAKE_CASE

#### TypeScript (Frontend)
- [ ] ESLint設定に準拠
- [ ] `any` 型の使用を避ける
- [ ] 関数コンポーネント + Hooks使用
- [ ] 命名規則:
  - コンポーネント: PascalCase
  - 関数/変数: camelCase
  - 型/インターフェース: PascalCase

### 2. セキュリティ

- [ ] `.env`ファイルやシークレットキーへのアクセスがないか
- [ ] SQLインジェクション対策（ORMの適切な使用）
- [ ] XSS対策（ユーザー入力のエスケープ）
- [ ] 認証が必要なエンドポイントに適切なミドルウェアが設定されているか
- [ ] JWTトークンの適切な検証
- [ ] パスワードのハッシュ化

### 3. アーキテクチャの一貫性

**参照: `doc/01_設計資料/ARCHITECTURE.md` - デザインパターン、コーディング規約セクション**

#### バックエンド（レイヤードアーキテクチャ）
- [ ] ディレクトリ構造が規約に従っているか（`api/endpoints/`, `core/`, `models/`, `schemas/`）
- [ ] 適切な層分離:
  - API Layer（endpoints/）→ リクエスト/レスポンス処理
  - Schema Layer（schemas/）→ Pydanticバリデーション
  - Business Logic（endpoints/）→ CRUD操作、認証チェック
  - Data Access Layer（models/）→ SQLAlchemy ORM
- [ ] Dependency Injection: FastAPIの`Depends()`でDBセッションや認証情報を注入
- [ ] Schema Pattern: Create/Update/Responseスキーマを分離
- [ ] 非同期処理の適切な使用（async/await）

#### フロントエンド（Presentational/Container Pattern）
- [ ] ディレクトリ構造が規約に従っているか（`pages/`, `components/`, `contexts/`, `services/`, `types/`, `utils/`）
- [ ] Pages（Container Components）: ビジネスロジック、状態管理
- [ ] Components（Presentational Components）: UIレンダリング、プロップスベース
- [ ] Context API Pattern: AuthContextでグローバル状態管理
- [ ] Service Layer Pattern: api.tsでAPI通信を抽象化
- [ ] Props型定義の適切な使用
- [ ] 再利用可能なコンポーネントの適切な抽象化

#### API設計（RESTful）
- [ ] リソースは複数形（`/categories`）
- [ ] 動詞を使わない（`GET /getCategories` ❌）
- [ ] 適切なHTTPメソッド（GET, POST, PUT, DELETE）
- [ ] 階層構造は3階層まで

### 4. エラーハンドリング

#### バックエンド
- [ ] HTTPExceptionの適切な使用
- [ ] 適切なHTTPステータスコード（400, 401, 403, 404, 500）
- [ ] ユーザーフレンドリーなエラーメッセージ

#### フロントエンド
- [ ] try-catchブロックの使用（API呼び出し）
- [ ] エラー時の適切なユーザーフィードバック
- [ ] ローディング状態の表示

### 5. パフォーマンス

#### バックエンド
- [ ] N+1問題の回避（eager loading使用）
- [ ] 不要なデータベースクエリの削減
- [ ] 適切なインデックスの使用
- [ ] ページネーションの実装（大量データ）

#### フロントエンド
- [ ] 不要な再レンダリングの防止（React.memo, useMemo, useCallback）
- [ ] コード分割（lazy load）
- [ ] 画像最適化

### 6. テスト

- [ ] 重要な機能に対するテストの存在
- [ ] テストカバレッジ目標:
  - バックエンド: 80%以上
  - フロントエンド: 70%以上
- [ ] エッジケースの考慮

## 出力フォーマット

```markdown
## コードレビュー結果

### ✅ 良い点
- [具体的な良い実装や設計の列挙]

### ⚠️ 改善が必要な点
- [ファイル名:行番号] 問題の説明と改善案

### 🔴 重大な問題
- [ファイル名:行番号] セキュリティやバグに関する重大な問題

### 📊 統計
- レビューしたファイル数: X
- 検出された問題数: Y
- 重大な問題: Z

### 💡 推奨事項
1. [優先度の高い改善提案]
2. [次に取り組むべき項目]
```

## 使用例

```bash
# プロジェクト全体をレビュー
/code-review

# 特定のディレクトリをレビュー
/code-review backend/app/api/endpoints/

# 特定のファイルをレビュー
/code-review backend/app/models/transaction.py
```

## 注意事項

- **設計資料を必ず参照**: レビュー前に`doc/01_設計資料/ARCHITECTURE.md`と`IMPLEMENTATION_STATUS.md`を読むこと
- レビューは建設的で、具体的な改善案を含めること
- プロジェクトの規約（.claude/CLAUDE.md, .claude/rules/defaults.md, doc/01_設計資料/）に基づいて評価
- アーキテクチャ逸脱は明確に指摘し、設計資料の該当セクションを参照
- セキュリティ問題は最優先で指摘
- 過度なリファクタリングは推奨しない（要求された変更のみ）
