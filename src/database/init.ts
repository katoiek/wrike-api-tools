<<<<<<< HEAD
/**
 * 廃止されたSQLiteデータベース初期化ファイル
 * このファイルは環境変数ベースのシステムに移行により廃止されました。
 *
 * 新しいシステムについては以下を参照してください：
 * - 設定管理: src/services/env-settings.ts
 * - トークン管理: src/services/memory-token-storage.ts
 * - キャッシュ管理: src/services/memory-cache.ts
=======
/**
 * Database initialization module
 *
 * Note: This module has been migrated from SQLite to environment variables.
 * The functions below are maintained for backward compatibility but do not
 * perform any database operations.
 */

/**
 * Initialize the database with required tables
 *
 * Note: This function is now a no-op as the application has been migrated
 * to use environment variables instead of SQLite database.
>>>>>>> develop
 */

// 後方互換性のため、エラーを投げる関数を残しています
export async function initializeDatabase(): Promise<void> {
<<<<<<< HEAD
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
=======
  // Database initialization is no longer required
  // The application now uses environment variables and in-memory storage
  console.log('Database initialization skipped - using environment variables');
}

/**
 * Get a single row from the database
 * @deprecated This function is deprecated. Use environment variable based storage instead.
 * @param sql SQL query
 * @param params Query parameters
 * @returns The result object or null
 */
export async function dbGet<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  console.warn('dbGet is deprecated. Use environment variable based storage instead.');
  return null;
}

/**
 * Get multiple rows from the database
 * @deprecated This function is deprecated. Use environment variable based storage instead.
 * @param sql SQL query
 * @param params Query parameters
 * @returns Array of result objects
 */
export async function dbAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  console.warn('dbAll is deprecated. Use environment variable based storage instead.');
  return [];
}

/**
 * Execute SQL
 * @deprecated This function is deprecated. Use environment variable based storage instead.
 * @param sql SQL query
 * @param params Query parameters
 * @returns The result
 */
export async function dbRun(sql: string, params: any[] = []): Promise<any> {
  console.warn('dbRun is deprecated. Use environment variable based storage instead.');
  return { changes: 0, lastID: null };
}

/**
 * Close the database connection
 * @deprecated This function is deprecated. Database connections are no longer used.
 */
export async function closeDatabase(): Promise<void> {
  console.warn('closeDatabase is deprecated. Database connections are no longer used.');
>>>>>>> develop
}
