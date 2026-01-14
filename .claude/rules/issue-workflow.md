# Issue対応ワークフロー

このルールは、GitHubのissueを対応する際に従うべき手順を定義します。

## 必須手順

### 1. Issue内容の確認と明確化

- **Issue番号と内容を確認**: ユーザーから指定されたissue番号の内容を `gh issue view <issue-number>` で取得
- **不明点の確認**: Issue内容が不明確な場合、以下を確認する
  - 要件が曖昧な場合 → ユーザーに具体的な実装方法を確認
  - 影響範囲が不明な場合 → どのファイル/機能が対象か確認
  - テスト要件が不明な場合 → テストの必要性を確認
- **AskUserQuestionツールを使用**: 複数の実装アプローチがある場合、ユーザーに選択肢を提示

### 2. 作業ブランチの準備

**作業ブランチ作成前のチェック:**

```bash
# 現在のブランチと変更状態を確認
git status
```

- **変更がある場合の対応**:
  - 未コミットの変更がある → ユーザーに以下を確認:
    - `git stash` で一時退避するか
    - `git commit` でコミットするか
    - `git restore` で変更を破棄するか
  - ステージング済みの変更がある → 同様に確認

**作業ブランチの作成:**

```bash
# mainブランチを最新に更新
git checkout main
git pull origin main

# Issue番号に基づいた作業ブランチを作成
git checkout -b feature/issue-<issue-number>-<short-description>
```

- ブランチ命名規則: `feature/issue-<number>-<short-desc>` または `fix/issue-<number>-<short-desc>`
- 例: `feature/issue-123-add-export-function`, `fix/issue-456-login-bug`

### 3. 作業計画の立案（Plan Mode）

- **EnterPlanModeを使用**: 実装タスクの場合、必ずplan modeで作業計画を立てる
- **計画内容に含めるべき項目**:
  - 変更が必要なファイルのリスト
  - 実装の手順（ステップバイステップ）
  - テストの方針（必要な場合）
  - マイグレーションの必要性（データベース変更の場合）
  - 影響範囲の分析
- **ExitPlanModeで承認を得る**: 計画が完成したら、ユーザーの承認を得る

### 4. 作業計画のIssueへのコメント

作業計画が承認されたら、GitHubのissueにコメントを投稿:

```bash
gh issue comment <issue-number> --body "$(cat <<'EOF'
## 作業計画

### 変更ファイル
- `path/to/file1.py`
- `path/to/file2.tsx`

### 実装手順
1. ステップ1の説明
2. ステップ2の説明
3. ...

### テスト計画
- ユニットテスト: XXXのテスト追加
- 統合テスト: YYYの動作確認

### 影響範囲
- 機能A: 変更あり
- 機能B: 影響なし

作業を開始します。
EOF
)"
```

### 5. 実装作業の実行

- **TodoWriteツールを使用**: 作業計画をTodoリストに変換し、進捗を追跡
- **計画に沿って実装**: 作業計画から逸脱しない
  - 予期しない問題が発生した場合、ユーザーに報告して対応を相談
- **コミットの粒度**: 適切な単位で小まめにコミット
  - 例: 「モデル追加」「APIエンドポイント実装」「フロントエンド統合」など

**実装中の注意点:**

- セキュリティ: `.env`ファイルや秘密情報にアクセスしない（settings.jsonで禁止）
- テスト: 変更後にテストを実行して動作確認
  - バックエンド: `cd backend && pytest`
  - フロントエンド: `cd frontend && npm test`
- マイグレーション: データベース変更がある場合、Alembicマイグレーションを作成

### 6. 動作確認とテスト

実装完了後、以下を確認:

```bash
# バックエンドのテスト
cd backend
uv run pytest

# フロントエンドのビルド確認
cd frontend
npm run build

# リンター/フォーマッターの確認（設定されている場合）
# Python: ruff, mypy など
# TypeScript: ESLint
```

### 7. Pull Requestの作成

**PRの作成前チェック:**

- [ ] すべての変更がコミット済み
- [ ] テストが通過
- [ ] ビルドエラーがない
- [ ] 不要なデバッグコードやコメントを削除

**PRの作成:**

```bash
# リモートにプッシュ
git push -u origin feature/issue-<issue-number>-<short-description>

# PRを作成（devブランチに対して）
gh pr create --base dev --title "Issue #<issue-number>: <title>" --body "$(cat <<'EOF'
## 概要
Closes #<issue-number>

<Issue内容の要約>

## 変更内容
- 変更点1
- 変更点2

## テスト
- [ ] ユニットテスト追加/更新
- [ ] 手動動作確認済み

## 補足事項
（必要に応じて追加情報を記載）

🤖 Generated with Claude Code
EOF
)"
```

**PR作成後:**

- Issueにコメントして、PR作成を報告
- レビュー依頼が必要な場合、レビュアーを指定

## 例外ケース

### mainブランチが存在しない場合

- `git branch -a` でブランチ一覧を確認
- デフォルトブランチを確認: `git remote show origin | grep "HEAD branch"`
- 適切なブランチ（master, developなど）を使用

### devブランチが存在しない場合

- ユーザーに確認: PRのターゲットブランチを指定してもらう
- 通常は `main` または `develop` ブランチを使用

### 緊急度の高いHotfix

- ブランチ名を `hotfix/issue-<number>-<desc>` とする
- mainブランチに対してPRを作成（ユーザーに確認）

## チェックリスト

Issue対応時には、以下のチェックリストを使用してください:

- [ ] Issue内容を確認し、不明点をユーザーに質問
- [ ] 現在のブランチ状態を確認（変更がある場合は対応）
- [ ] mainブランチから作業ブランチを作成・チェックアウト
- [ ] Plan modeで作業計画を立案
- [ ] 作業計画をIssueにコメント
- [ ] TodoWriteで作業を追跡しながら実装
- [ ] テスト実行・動作確認
- [ ] devブランチに対してPRを作成
- [ ] IssueにPR作成を報告

## 備考

このワークフローは、チーム開発での一貫性を保つために定義されています。
状況に応じて柔軟に対応しつつ、基本的な流れは守るようにしてください。
