# データベース接続設定手順

## 問題

WSL上のDockerコンテナ内から、WSLホストで起動したPostgreSQLコンテナに接続する必要があります。

## 解決方法

### オプション1: 既存のコンテナをネットワークに接続（推奨）

現在動作中のkakeibon-postgresコンテナを、開発環境のコンテナと同じネットワークに接続します。

```bash
# WSLのターミナルで実行

# 1. PostgreSQLを一度停止
cd /usr/src/projects/kakeibon/db
docker-compose down

# 2. 再起動（ネットワーク設定が適用されます）
docker-compose up -d

# 3. 開発コンテナをkakeibon-networkに接続
# （開発コンテナのIDまたは名前を確認してから実行）
docker network connect kakeibon-network <開発コンテナ名>

# 4. ネットワーク接続を確認
docker network inspect kakeibon-network
```

### オプション2: DATABASE_URLを更新

開発コンテナから`kakeibon-postgres`というホスト名で接続できるようになったら、
`backend/.env`を以下のように変更：

```
DATABASE_URL=postgresql://postgres:password@kakeibon-postgres:5432/kakeibo
```

### オプション3: ホストのIPアドレスを直接指定

WSLのIPアドレスを確認して直接指定する方法：

```bash
# WSLのターミナルで実行
hostname -I | awk '{print $1}'
```

出力されたIPアドレスを使用：

```
DATABASE_URL=postgresql://postgres:password@<WSLのIPアドレス>:5432/kakeibo
```

## 接続テスト

```bash
cd /usr/src/projects/kakeibon/backend
uv run python -c "
from sqlalchemy import create_engine, text
from app.core.config import settings
engine = create_engine(settings.DATABASE_URL)
with engine.connect() as conn:
    result = conn.execute(text('SELECT version()'))
    print('✅ 接続成功!', result.fetchone()[0][:50])
"
```
