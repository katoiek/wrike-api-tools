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
 */
export async function initializeDatabase(): Promise<void> {
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
}
