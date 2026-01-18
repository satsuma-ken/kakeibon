# web-python-env

## 0. このリポジトリについて

このリポジトリはweb-pythonの環境を構築するためのdocker関連ファイルを管理するリポジトリです。  
使い方については「1. 使い方」セクションを参照してください。  

> [!Warning]
> このdockerはWSL上で動くことを想定して作成しています。  
> wslを未インストールの方は先にインストールしてから以下の手順を進めてください。  

## 1. 使い方

### 初めて利用する場合

#### 簡易手順

1. コマンドプロンプトを起動
2. wslへログインする
3. 開発用のディレクトリへ移動
4. 当リポジトリをclone
5. 任意のプロジェクトをcloneする
6. 起動用batをデスクトップなどに展開
7. batの「SEARCH_PATHS」を、3で移動したディレクトリへ変更する
8. ダブルクリックで起動
9. docker containerを起動
10. docker containerへ接続する

11. workspaceにプロジェクトを追加する

#### 詳細手順

##### 1. コマンドプロンプトを起動

windowsキーを押下し、「cmd」と入力してEnterキーを押下する

##### 2. wslへログインする

以下のコマンドを入力し、wslへログインする
```shell
wsl
```

##### 3. 開発用のディレクトリへ移動

以下コマンドで
```shell
DEV_DIR=~/dev
echo """"""""""""""""""""""""""""""""""
echo DEV_DIR is setted === $DEV_DIR ===
echo """"""""""""""""""""""""""""""""""
cd $DEV_DIR
```

##### 4. 当リポジトリをclone

以下コマンドで当リポジトリをcloneする
```shell
ENV_DIR=~/dev/web # のちにcloneするリポジトリを格納するディレクトリ名
git clone https://github.com/satsuma-ken/env-web-python.git $ENV_DIR
```

##### 5. 任意のプロジェクトをcloneする

以下コマンドで、任意のプロジェクトをcloneする
```shell
PJ_DIR=~/dev/web/projects
cd $PJ_DIR
REPO=https://github.com/satsuma-ken/kakeibon.git # REPOには任意のリポジトリを入力する  
git clone $REPO
```

##### 6. 起動用batをデスクトップなどに展開

cloneした当リポジトリ内の以下のファイルをデスクトップなどにコピー&ペーストする

##### 7. batの「SEARCH_PATHS」を、3で移動したディレクトリへ変更する

batファイルを 右クリック > 「メモ帳で編集」を選択 で メモ帳で開き、
`set "SEARCH_PATHS=~/dev"`を3で移動したディレクトリへ変更する
編集が完了したら Ctrl + S で保存する

##### 8. ダブルクリックで起動

6で編集したbatファイルをダブルクリックして起動する

##### 9. docker containerを起動

ツールを正常に開けると、以下の図のように複数の選択肢が出てくる  
その中から、「1. Search and start docker-compose projects」を選択する（1を入力してEnrterを押下）
![alt text](image.png)

画面が切り替わり、git cloneしてきたディレクトリ名が出てくるので、それを選択する（1を入力してEnterを押下）
![alt text](image-1.png)

以下のように docker image をbuildするか聞かれるので、「y」を入力してEnterを押下  
※passwordはEnterキーでスキップする
```shell
Build images before starting? (y/n, default=n):
```

ビルドが完了するまで待つ  
以下の画像のように`Project started successfully`というログが出ればOK  
Enterキーなどを押下して container への接続画面に遷移する
![alt text](image-2.png)

##### 10. docker containerへ接続する

8の手順が完了すると、以下の画像のような選択肢が出てくるため、接続したいコンテナを選択する  
※ webのコーディングを行う時は「python-dev」を選択する
![alt text](image-3.png)

以下のように接続する方法を聞かれるので好きなものを選択する  
※ コーディングを行う場合は「v」を選択してVSCodeで接続する
```shell
Enter container number (1-7): 2

  Selected: [python-dev]

  s. Shell
  v. VSCode
  b. Back

How to connect? (s/v/b):
```

##### 11. workspaceにプロジェクトを追加する



### 一度設定が完了している場合

#### 簡易手順

1. デスクトップのbatファイルをダブルクリックして起動する



