---
name: architecture-check
description: Kakeibonプロジェクトのアーキテクチャ準拠をチェックします。ディレクトリ構造、レイヤー分離、命名規則、API設計パターンを検証します。新機能実装やリファクタリング時に使用してください。
---

# Architecture Check Skill - Kakeibon プロジェクト

このスキルは、Kakeibonプロジェクトのアーキテクチャの一貫性と設計原則への準拠をチェックします。

## アーキテクチャ概要

### 技術スタック
- **バックエンド**: FastAPI + SQLAlchemy + PostgreSQL
- **フロントエンド**: React 18 + TypeScript + Vite + TailwindCSS
- **認証**: JWT (python-jose)

### アーキテクチャパターン
- **バックエンド**: レイヤードアーキテクチャ（モデル、スキーマ、エンドポイント）
- **フロントエンド**: コンポーネントベースアーキテクチャ + Context API

## チェック項目

### 1. ディレクトリ構造の一貫性

#### バックエンド構造
```
backend/
├── app/
│   ├── api/endpoints/    # APIエンドポイント
│   ├── core/            # 設定、セキュリティ
│   ├── models/          # SQLAlchemyモデル
│   ├── schemas/         # Pydanticスキーマ
│   └── main.py          # エントリーポイント
├── alembic/             # マイグレーション
└── tests/               # テストコード
```

#### フロントエンド構造
```
frontend/
├── src/
│   ├── components/      # 再利用可能なコンポーネント
│   ├── pages/          # ページコンポーネント
│   ├── contexts/       # React Context
│   ├── services/       # API通信ロジック
│   ├── types/          # TypeScript型定義
│   └── App.tsx         # ルートコンポーネント
└── public/             # 静的ファイル
```

### 2. レイヤー分離

#### バックエンド

**モデル層（models/）**
- [ ] データベーステーブルの定義のみに集中しているか
- [ ] ビジネスロジックが含まれていないか

**スキーマ層（schemas/）**
- [ ] Create, Update, Responseスキーマが分離されているか
- [ ] バリデーションルールが適切に設定されているか

**エンドポイント層（api/endpoints/）**
- [ ] HTTPリクエスト/レスポンスの処理に集中しているか
- [ ] 認証/認可が適切に実装されているか

#### フロントエンド

**コンポーネント層（components/, pages/）**
- [ ] API呼び出しがservicesに分離されているか
- [ ] 再利用可能なコンポーネントがcomponentsにあるか

**サービス層（services/）**
- [ ] APIクライアントが適切に実装されているか
- [ ] エラーハンドリングが一貫しているか

### 3. 依存関係の方向性

#### バックエンド依存関係
```
endpoints → schemas → models
     ↓
   core (security, config)
```

- [ ] 上位層が下位層に依存しているか（逆はNG）
- [ ] 循環依存がないか

#### フロントエンド依存関係
```
pages → components → types
  ↓         ↓
services  contexts
```

- [ ] componentsがpagesに依存していないか
- [ ] 循環依存がないか

### 4. 命名規則の一貫性

#### Python（バックエンド）
- **ファイル名**: snake_case (`transaction.py`)
- **クラス名**: PascalCase (`User`, `TransactionCreate`)
- **関数名**: snake_case (`get_user`)
- **定数名**: UPPER_SNAKE_CASE (`MAX_ITEMS`)

#### TypeScript（フロントエンド）
- **ファイル名**: PascalCase for components (`Dashboard.tsx`)
- **コンポーネント名**: PascalCase (`Dashboard`)
- **関数名**: camelCase (`getUserData`)
- **型/インターフェース名**: PascalCase (`User`)

### 5. APIデザインパターン

#### RESTful原則
```
GET    /api/v1/transactions      # 一覧取得
POST   /api/v1/transactions      # 作成
GET    /api/v1/transactions/{id} # 詳細取得
PUT    /api/v1/transactions/{id} # 更新
DELETE /api/v1/transactions/{id} # 削除
```

- [ ] 適切なHTTPメソッド使用
- [ ] すべてのエンドポイントが`/api/v1/`プレフィックスを使用

## 出力フォーマット

```markdown
## アーキテクチャチェック結果

### 📊 全体評価: [優良 / 良好 / 要改善 / 不適切]

### 🏗️ ディレクトリ構造
- ✅ 適切な項目
- ⚠️ 改善が必要な項目
- ❌ 不適切な項目

### 🔄 レイヤー分離
**評価**: [適切 / 改善が必要 / 不適切]
[詳細な説明]

### 🔗 依存関係
**循環依存の有無**: [なし / あり]
**問題のある依存関係**:
- [ファイルA] → [ファイルB]: 不適切な依存関係の説明

### 📝 命名規則
**評価**: [一貫している / 部分的に一貫 / 不一貫]
**問題のある命名**:
- [ファイル名]: [問題の説明と推奨される命名]

### 🌐 API設計
**RESTful原則への準拠**: [適切 / 部分的に適切 / 不適切]

### 💡 アーキテクチャ改善提案
1. **[提案タイトル]**
   - **現状**: [現在の実装]
   - **提案**: [改善案]
   - **メリット**: [改善のメリット]

### 🎯 推奨アクション（優先度順）
1. [最も重要な改善項目]
2. [次に重要な改善項目]
```

## 使用例

```bash
# プロジェクト全体のアーキテクチャチェック
/architecture-check

# バックエンドのみチェック
/architecture-check backend/

# フロントエンドのみチェック
/architecture-check frontend/
```

## 重点チェック項目（Kakeibon固有）

1. **バックエンドの層分離**: models, schemas, endpointsの責務が明確か
2. **フロントエンドのコンポーネント分離**: pages, componentsの使い分けが適切か
3. **API設計**: `/api/v1/`プレフィックスとRESTful原則への準拠
4. **認証フロー**: JWT認証が適切に実装されているか
5. **状態管理**: AuthContextの適切な使用

## 注意事項

- アーキテクチャの一貫性を重視
- 既存の設計パターンからの逸脱を特定
- 技術的負債の蓄積を防ぐための提案
- 実装の詳細よりも、全体的な構造と設計原則に焦点を当てる
