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

### Database Security

This application uses SQLite database to store authentication tokens, user information, and application settings. Please note the following important security considerations:

1. **Sensitive Information Warning**
   - The database file (`data/wrike-integration.db`) contains sensitive information including OAuth tokens and encrypted settings.
   - This file is excluded from Git via `.gitignore` and should NEVER be committed to the repository.
   - Always verify that database files are not included in your commits before pushing changes.

2. **Backup Strategy**
   - Since database files are not tracked by Git, implement a separate backup strategy for production environments.
   - Consider regular scheduled backups of the `data` directory.
   - Store backups securely with appropriate encryption if they contain production data.

3. **Production Environment Security**
   - In production environments, set appropriate file permissions on the `data` directory:
     ```bash
     chmod 700 data
     chmod 600 data/*.db
     ```
   - Consider using environment variables for all sensitive configuration instead of storing in the database.
   - For high-security deployments, consider using a more robust database system with proper access controls.

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

### データベースセキュリティ

このアプリケーションはSQLiteデータベースを使用して認証トークン、ユーザー情報、およびアプリケーション設定を保存しています。以下の重要なセキュリティ上の考慮事項に注意してください：

1. **機密情報に関する警告**
   - データベースファイル（`data/wrike-integration.db`）にはOAuthトークンや暗号化された設定など、機密情報が含まれています。
   - このファイルは`.gitignore`によってGitから除外されており、リポジトリにコミットしてはいけません。
   - 変更をプッシュする前に、データベースファイルがコミットに含まれていないことを常に確認してください。

2. **バックアップ戦略**
   - データベースファイルはGitで追跡されないため、本番環境では別途バックアップ戦略を実装してください。
   - `data`ディレクトリの定期的なスケジュールバックアップを検討してください。
   - 本番データを含むバックアップは、適切な暗号化を施して安全に保管してください。

3. **本番環境のセキュリティ**
   - 本番環境では、`data`ディレクトリに適切なファイルパーミッションを設定してください：
     ```bash
     chmod 700 data
     chmod 600 data/*.db
     ```
   - データベースに保存する代わりに、すべての機密設定に環境変数を使用することを検討してください。
   - 高セキュリティが求められる環境では、適切なアクセス制御を備えたより堅牢なデータベースシステムの使用を検討してください。

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
