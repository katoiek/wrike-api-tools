# Wrike API Tools

[English](#english) | [日本語](#japanese)

<a id="english"></a>
## English

Wrike API Tools is a local UI tool that allows you to access and manage Wrike data, with a focus on user groups and organizational structure, using the Wrike API.

### Features

- Accessing your Wrike account using OAuth2 (permanent token)
- View spaces, user groups, custom fields, and user information
- Advanced sorting and filtering capabilities for all data tables
- Asynchronous data loading for improved performance
- Multi-language support (English/Japanese)

### Installation

#### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

#### Installation Steps

1. Clone the repository:

```bash
git clone https://github.com/katoiek/wrike-api-tools.git
cd wrike-api-tools
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env` file with the following content:

```
PORT=3000
NODE_ENV=development
SESSION_SECRET=your_session_secret
WRIKE_CLIENT_ID=your_wrike_client_id
WRIKE_CLIENT_SECRET=your_wrike_client_secret
WRIKE_REDIRECT_URI=http://localhost:3000/auth/callback
```

4. Build the application:

```bash
npm run build
```

5. Start the application:

```bash
npm start
```

6. Access the application in your browser at `http://localhost:3000`.

### Development

To run in development mode:

```bash
npm run dev
```

### Recent Updates

- Added custom fields view with asynchronous loading for improved performance
- Implemented enhanced sorting functionality with visual indicators for all data tables
- Added client-side filtering for faster data exploration
- Changed folder blueprint view to hierarchical tree display with expand/collapse functionality
- Added user group management with hierarchical view
- Improved API performance and reliability
- Fixed compatibility issues with Wrike API v4

### License

MIT

---

<a id="japanese"></a>
## 日本語

Wrike API Toolsは、Wrike APIを使用してWrikeのデータにアクセスし、ユーザーグループと組織構造に焦点を当てて管理するためのローカルUIを提供するツールです。

### 機能

- OAuth2（永続トークン）によるWrikeアカウントへのアクセス
- スペース、ユーザーグループ、カスタムフィールド、ユーザー情報の表示
- すべてのデータテーブルに対する高度なソートとフィルタリング機能
- パフォーマンス向上のための非同期データ読み込み
- 多言語対応（英語/日本語）

### インストール方法

#### 前提条件

- Node.js (v14以上)
- npm (v6以上)

#### インストール手順

1. リポジトリをクローンします：

```bash
git clone https://github.com/katoiek/wrike-api-tools.git
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

### 開発

開発モードで実行するには：

```bash
npm run dev
```

### 最近の更新

- パフォーマンス向上のための非同期読み込みを備えたカスタムフィールド表示機能を追加
- すべてのデータテーブルに視覚的インジケーターを備えた高度なソート機能を実装
- より高速なデータ探索のためのクライアントサイドフィルタリングを追加
- フォルダブループリントを階層ツリー表示に変更（展開・折りたたみ機能付き）
- ユーザーグループ管理と階層表示機能を追加
- API性能と信頼性の向上
- Wrike API v4との互換性問題を修正

### ライセンス

MIT
