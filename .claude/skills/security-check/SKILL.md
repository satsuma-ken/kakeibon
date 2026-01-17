---
name: security-check
description: Kakeibonプロジェクトのセキュリティ脆弱性を専門的にチェックします。認証、SQLインジェクション、XSS、機密情報の漏洩などをスキャンします。セキュリティレビューが必要な時に使用してください。
---

# Security Check Skill - Kakeibon プロジェクト

このスキルは、Kakeibonプロジェクトのセキュリティ脆弱性を専門的にチェックします。

## チェック対象

- **バックエンド**: FastAPI + SQLAlchemy (認証、データベース、API)
- **フロントエンド**: React + TypeScript (XSS、CSRF、データ処理)
- **環境設定**: .env、Docker、シークレット管理

## セキュリティチェック項目

### 1. 機密情報の保護

#### 環境変数とシークレット
- [ ] `.env`ファイルがgitignoreに含まれているか
- [ ] コード内にハードコードされたパスワード、APIキー、トークンがないか
- [ ] JWTシークレットキーが環境変数から読み込まれているか
- [ ] データベース認証情報が環境変数から読み込まれているか

### 2. 認証とアクセス制御

#### JWT認証
- [ ] JWTトークンの有効期限が設定されているか
- [ ] トークンの検証が適切に実装されているか
- [ ] ログアウト時のトークン無効化

#### パスワード管理
- [ ] パスワードのハッシュ化（bcrypt, Argon2など）
- [ ] パスワードの平文保存がないか

#### アクセス制御
- [ ] 認証が必要なエンドポイントに`Depends(get_current_user)`が適用されているか
- [ ] ユーザーが自分のデータのみアクセスできるか確認

### 3. インジェクション攻撃対策

#### SQLインジェクション
- [ ] SQLAlchemyのORMを使用しているか（生SQLの回避）
- [ ] ユーザー入力が直接クエリに挿入されていないか

```python
# ❌ 危険な例
query = f"SELECT * FROM users WHERE username = '{username}'"

# ✅ 安全な例
query = select(User).where(User.username == username)
```

#### コマンドインジェクション
- [ ] OSコマンドの実行がないか
- [ ] ユーザー入力がシェルコマンドに渡されていないか

### 4. XSS (Cross-Site Scripting) 対策

- [ ] ユーザー入力が適切にエスケープされているか
- [ ] `dangerouslySetInnerHTML`の使用を避けているか

```typescript
// ❌ 危険な例
<div dangerouslySetInnerHTML={{__html: userInput}} />

// ✅ 安全な例
<div>{userInput}</div>
```

### 5. CSRF対策とCORS設定

- [ ] FastAPIのCORSMiddleware設定が適切か
- [ ] 許可するオリジンが明示的に指定されているか（`*`を避ける）

```python
# ✅ 安全な例
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # 明示的に指定
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

### 6. データバリデーション

- [ ] すべてのAPIエンドポイントでPydanticスキーマを使用しているか
- [ ] 適切なバリデーションルール（max_length, min_length, regex）
- [ ] 型の適切な定義

### 7. エラーハンドリングと情報漏洩

- [ ] 詳細なエラー情報（スタックトレース）が本番環境で公開されないか
- [ ] ログに機密情報（パスワード、トークン）が含まれないか

```python
# ❌ 危険な例
raise HTTPException(status_code=500, detail=str(e))

# ✅ 安全な例
logger.error(f"Database error: {e}")
raise HTTPException(status_code=500, detail="An internal error occurred")
```

## 出力フォーマット

```markdown
## セキュリティチェック結果

### 🛡️ セキュリティスコア: [X/100]

### 🔴 クリティカル（即座に修正が必要）
1. **[カテゴリ]**: 問題の説明
   - **ファイル**: [ファイル名:行番号]
   - **脆弱性**: [具体的な脆弱性の説明]
   - **影響**: [攻撃者が何をできるか]
   - **修正方法**: [具体的な修正手順]

### 🟡 警告（可能な限り早く修正）
1. **[カテゴリ]**: 問題の説明
   - **ファイル**: [ファイル名:行番号]
   - **リスク**: [潜在的なリスク]
   - **推奨対応**: [推奨される修正方法]

### 🟢 情報（ベストプラクティスの提案）
1. **[カテゴリ]**: 改善提案

### ✅ 安全な実装
- [セキュリティのベストプラクティスに従っている項目]

### 💡 推奨アクション（優先度順）
1. [最も重要な修正項目]
2. [次に重要な修正項目]

### 📚 参考資料
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- FastAPI Security: https://fastapi.tiangolo.com/tutorial/security/
```

## 使用例

```bash
# プロジェクト全体のセキュリティチェック
/security-check

# 特定のディレクトリをチェック
/security-check backend/app/api/endpoints/

# 特定のファイルをチェック
/security-check backend/app/core/security.py
```

## 重点チェック項目（Kakeibon固有）

1. **JWT認証**: `backend/app/core/security.py`
2. **ユーザー管理**: `backend/app/api/endpoints/auth.py`
3. **データアクセス**: `backend/app/api/endpoints/transactions.py`, `categories.py`, `budgets.py`
4. **CORS設定**: `backend/app/main.py`
5. **環境変数**: `.env`, `.env.example`

## 注意事項

- セキュリティ問題は最優先で対応
- 発見された脆弱性は詳細に説明し、具体的な修正方法を提示
- 本番環境とテスト環境で異なる設定が必要な項目を明確に
