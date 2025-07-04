# SQLite から環境変数への移行ガイド

## 概要

このプロジェクトは、SQLiteデータベースから環境変数ベースのシステムに移行しました。

## 主な変更点

### 1. データストレージの変更
- **SQLiteデータベース** → **環境変数 + インメモリストレージ**
- データの永続化は行わず、アプリケーション再起動時にリセット

### 2. 新しいサービス

#### 設定管理
- **ファイル**: `src/services/env-settings.ts`
- **機能**: 環境変数を中心とした設定管理
- **使用方法**: `getEnvSetting()`, `setEnvSetting()`, `getAllEnvSettings()`

#### トークン管理
- **ファイル**: `src/services/memory-token-storage.ts`
- **機能**: OAuthトークンのインメモリ管理
- **使用方法**: `saveToken()`, `getCurrentToken()`, `updateToken()`

#### キャッシュ管理
- **ファイル**: `src/services/memory-cache.ts`
- **機能**: ユーザー情報などの一時キャッシュ
- **使用方法**: `setUser()`, `getUser()`, `setCache()`

## 移行手順

### 1. 環境変数の設定

`.env`ファイルに以下の設定を追加：

```bash
# 必須設定
WRIKE_CLIENT_ID=your_client_id
WRIKE_CLIENT_SECRET=your_client_secret
WRIKE_REDIRECT_URI=http://localhost:3000/auth/callback
SESSION_SECRET=your_session_secret
ENCRYPTION_KEY=your_32_character_encryption_key

# オプション設定（既存のトークンがある場合）
WRIKE_ACCESS_TOKEN=your_access_token
WRIKE_REFRESH_TOKEN=your_refresh_token
WRIKE_HOST=your_host.wrike.com
```

### 2. 既存データの移行

既存のSQLiteデータベースからデータを移行したい場合：

```bash
# 1. データベースの内容を確認
sqlite3 ./data/wrike-integration.db "SELECT * FROM settings;"
sqlite3 ./data/wrike-integration.db "SELECT * FROM tokens;"

# 2. 重要な設定を環境変数に設定
# 例: WRIKE_CLIENT_ID, WRIKE_CLIENT_SECRET など
```

### 3. 依存関係の更新

```bash
# SQLite関連のパッケージを削除
npm uninstall sqlite sqlite3

# 依存関係を再インストール
npm install
```

### 4. 古いファイルの削除（オプション）

```bash
# データベースファイルを削除
rm -f ./data/wrike-integration.db

# データディレクトリを削除（他にファイルがない場合）
rmdir ./data
```

## 使用方法の変更

### 設定の取得・設定

**旧:**
```typescript
import { getSetting, setSetting } from './services/settings';

const value = await getSetting('WRIKE_CLIENT_ID');
await setSetting('WRIKE_CLIENT_ID', 'new_value');
```

**新:**
```typescript
import { getEnvSetting, setEnvSetting } from './services/env-settings';

const value = getEnvSetting('WRIKE_CLIENT_ID');
setEnvSetting('WRIKE_CLIENT_ID', 'new_value');
```

### トークン管理

**旧:**
```typescript
// データベースから取得
const token = await dbGet('SELECT * FROM tokens...');
```

**新:**
```typescript
import { getCurrentToken, saveToken } from './services/memory-token-storage';

const token = getCurrentToken();
saveToken(tokenResponse);
```

## 注意事項

### 1. データの永続化
- アプリケーション再起動時にメモリ内のデータ（トークン、キャッシュ）は失われます
- 重要なデータは環境変数に設定してください

### 2. セキュリティ
- 機密情報は環境変数で管理
- 環境変数ファイル（`.env`）をバージョン管理に含めないでください

### 3. 開発・本番環境
- 開発環境: `.env`ファイルを使用
- 本番環境: システムの環境変数を使用
- コンテナ環境: 環境変数として設定

## トラブルシューティング

### Q: 設定が見つからない
A: 環境変数が正しく設定されているか確認してください

### Q: トークンが失われる
A: アプリケーション再起動後は再認証が必要です

### Q: 古いデータベースエラー
A: `src/database/init.ts`の関数が使用されていないか確認してください

## サポート

質問や問題がある場合は、以下を確認してください：
1. 環境変数が正しく設定されているか
2. 必要な依存関係がインストールされているか
3. アプリケーションが正しくビルドされているか
