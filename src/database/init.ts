import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Database path from environment variables
const dbPath = process.env.DB_PATH || './data/wrike-integration.db';

// Ensure the data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db: Database | null = null;

/**
 * Initialize the database with required tables
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Open database connection
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Create settings table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        encrypted INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create tokens table for storing OAuth tokens
    await db.exec(`
      CREATE TABLE IF NOT EXISTS tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        host TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_cache table for storing user information
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_cache (
        id TEXT PRIMARY KEY,
        first_name TEXT,
        last_name TEXT,
        email TEXT,
        role TEXT,
        data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Get a single row from the database
 * @param sql SQL query
 * @param params Query parameters
 * @returns The result object or null
 */
export async function dbGet<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return await db.get(sql, ...params) || null;
}

/**
 * Get multiple rows from the database
 * @param sql SQL query
 * @param params Query parameters
 * @returns Array of result objects
 */
export async function dbAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return await db.all(sql, ...params);
}

/**
 * Execute SQL
 * @param sql SQL query
 * @param params Query parameters
 * @returns The result
 */
export async function dbRun(sql: string, params: any[] = []): Promise<any> {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return await db.run(sql, ...params);
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}
