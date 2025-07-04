/**
 * 廃止されたSQLiteデータベース初期化ファイル
 * このファイルは環境変数ベースのシステムに移行により廃止されました。
 *
 * 新しいシステムについては以下を参照してください：
 * - 設定管理: src/services/env-settings.ts
 * - トークン管理: src/services/memory-token-storage.ts
 * - キャッシュ管理: src/services/memory-cache.ts
 */

// 後方互換性のため、エラーを投げる関数を残しています
export async function initializeDatabase(): Promise<void> {
  console.warn('initializeDatabase is deprecated. SQLite has been replaced with environment variables.');
  // throw new Error('initializeDatabase is deprecated. Please use environment variables instead.');
}

export async function dbGet<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  throw new Error('dbGet is deprecated. Please use environment variables or memory cache instead.');
}

export async function dbAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  throw new Error('dbAll is deprecated. Please use environment variables or memory cache instead.');
}

export async function dbRun(sql: string, params: any[] = []): Promise<any> {
  throw new Error('dbRun is deprecated. Please use environment variables or memory cache instead.');
}

export async function closeDatabase(): Promise<void> {
  console.warn('closeDatabase is deprecated. No database connection to close.');
}
