# Wrike API Tools

Wrike API Toolsは、Wrike APIを使用してWrikeのデータにアクセスし、操作するためのローカルUIを提供するツールです。

## 機能

- OAuth2認証によるWrikeアカウントへの安全なアクセス
- スペース、タスク、ユーザー情報の表示
- タスクの作成と管理
- ユーザーの招待

## インストール方法

### 前提条件

- Node.js (v14以上)
- npm (v6以上)

### インストール手順

1. リポジトリをクローンします：

```bash
git clone https://github.com/yourusername/wrike-api-tools.git
cd wrike-api-tools
```

2. 依存関係をインストールします：

```bash
npm install
```

3. 環境変数を設定します：

`.env`ファイルを作成し、以下の内容を設定します：

```
PORT=3000
NODE_ENV=development
SESSION_SECRET=your_session_secret
WRIKE_CLIENT_ID=your_wrike_client_id
WRIKE_CLIENT_SECRET=your_wrike_client_secret
WRIKE_REDIRECT_URI=http://localhost:3000/auth/callback
```

4. アプリケーションをビルドします：

```bash
npm run build
```

5. アプリケーションを起動します：

```bash
npm start
```

6. ブラウザで `http://localhost:3000` にアクセスします。

## 開発

開発モードで実行するには：

```bash
npm run dev
```

## ライセンス

MIT
