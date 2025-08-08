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
ENCRYPTION_KEY=your_32_character_encryption_key
WRIKE_CLIENT_ID=your_wrike_client_id
WRIKE_CLIENT_SECRET=your_wrike_client_secret
WRIKE_REDIRECT_URI=http://localhost:3000/auth/callback

# Optional: Pre-configure tokens (if you have them)
# WRIKE_ACCESS_TOKEN=your_access_token
# WRIKE_REFRESH_TOKEN=your_refresh_token
# WRIKE_HOST=your_host.wrike.com
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

### Data Storage and Security

This application has been updated to use environment variables and in-memory storage instead of SQLite database for improved security and simplicity.

1. **Environment Variable Security**
   - All sensitive configuration is now stored in environment variables
   - OAuth tokens and user data are stored in memory only (cleared on restart)
   - No persistent database files are created or maintained
   - Sensitive data is automatically detected and handled appropriately

2. **Memory-based Storage**
   - Tokens are stored in memory during application runtime
   - User cache and application data are maintained in memory
   - All data is cleared when the application restarts
   - No file-based storage of sensitive information

3. **Production Environment Security**
   - Use system environment variables for all sensitive configuration
   - Consider using external secret management services for production deployments
   - Environment variables are the primary configuration method
   - No database files to secure or backup



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
ENCRYPTION_KEY=your_32_character_encryption_key
WRIKE_CLIENT_ID=your_wrike_client_id
WRIKE_CLIENT_SECRET=your_wrike_client_secret
WRIKE_REDIRECT_URI=http://localhost:3000/auth/callback

# オプション：トークンの事前設定（既存のトークンがある場合）
# WRIKE_ACCESS_TOKEN=your_access_token
# WRIKE_REFRESH_TOKEN=your_refresh_token
# WRIKE_HOST=your_host.wrike.com
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

### データ保存とセキュリティ

このアプリケーションは、セキュリティの向上と簡素化のため、SQLiteデータベースから環境変数とインメモリストレージへと更新されました。

1. **環境変数セキュリティ**
   - すべての機密設定は環境変数に保存されます
   - OAuthトークンとユーザーデータはメモリ内のみに保存（再起動時にクリア）
   - 永続的なデータベースファイルは作成・維持されません
   - 機密データは自動的に検出され、適切に処理されます

2. **メモリベースのストレージ**
   - トークンはアプリケーション実行中にメモリ内に保存されます
   - ユーザーキャッシュとアプリケーションデータはメモリ内に維持されます
   - すべてのデータはアプリケーション再起動時にクリアされます
   - 機密情報のファイルベース保存は行われません

3. **本番環境のセキュリティ**
   - すべての機密設定にはシステム環境変数を使用してください
   - 本番デプロイメントでは外部シークレット管理サービスの使用を検討してください
   - 環境変数が主要な設定方法です
   - セキュリティ保護やバックアップが必要なデータベースファイルはありません



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
