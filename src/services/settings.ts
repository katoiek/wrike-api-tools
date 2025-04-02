import { dbGet, dbAll, dbRun } from '../database/init';
import { encrypt, decrypt } from '../utils/encryption';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Interface for a setting record
 */
export interface Setting {
  id: number;
  key: string;
  value: string;
  encrypted: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get a setting by key
 * @param key The setting key
 * @returns The setting value (decrypted if necessary)
 */
export async function getSetting(key: string): Promise<string | null> {
  try {
    // First check environment variables
    const envValue = process.env[key];
    if (envValue) {
      return envValue;
    }

    // Then check database
    const setting = await dbGet<Setting>('SELECT * FROM settings WHERE key = ?', [key]);

    if (!setting) {
      return null;
    }

    return setting.encrypted ? decrypt(setting.value) : setting.value;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return null;
  }
}

/**
 * Set a setting value
 * @param key The setting key
 * @param value The setting value
 * @param shouldEncrypt Whether to encrypt the value
 * @returns True if successful
 */
export async function setSetting(key: string, value: string, shouldEncrypt = false): Promise<boolean> {
  try {
    // Automatically encrypt sensitive information
    if (!shouldEncrypt) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('password') ||
        lowerKey.includes('key')
      ) {
        shouldEncrypt = true;
      }
    }

    const storedValue = shouldEncrypt ? encrypt(value) : value;

    // Check if setting already exists
    const existing = await dbGet<{id: number}>('SELECT id FROM settings WHERE key = ?', [key]);

    if (existing) {
      // Update existing setting
      await dbRun(
        'UPDATE settings SET value = ?, encrypted = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
        [storedValue, shouldEncrypt ? 1 : 0, key]
      );
    } else {
      // Insert new setting
      await dbRun(
        'INSERT INTO settings (key, value, encrypted) VALUES (?, ?, ?)',
        [key, storedValue, shouldEncrypt ? 1 : 0]
      );
    }

    return true;
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    return false;
  }
}

/**
 * Delete a setting
 * @param key The setting key
 * @returns True if successful
 */
export async function deleteSetting(key: string): Promise<boolean> {
  try {
    await dbRun('DELETE FROM settings WHERE key = ?', [key]);
    return true;
  } catch (error) {
    console.error(`Error deleting setting ${key}:`, error);
    return false;
  }
}

/**
 * Get all settings
 * @param includeEncrypted Whether to include and decrypt encrypted settings
 * @returns Array of settings
 */
export async function getAllSettings(includeEncrypted = false): Promise<Record<string, string>> {
  try {
    const settings = await dbAll<Setting>('SELECT * FROM settings');

    const result: Record<string, string> = {};

    // Add settings from database
    for (const setting of settings) {
      if (setting.encrypted) {
        if (includeEncrypted) {
          try {
            result[setting.key] = decrypt(setting.value);
          } catch (error) {
            console.error(`Error decrypting setting ${setting.key}:`, error);
            result[setting.key] = '[暗号化済み]';
          }
        } else {
          result[setting.key] = '[暗号化済み]';
        }
      } else {
        result[setting.key] = setting.value;
      }
    }

    return result;
  } catch (error) {
    console.error('Error getting all settings:', error);
    return {};
  }
}

/**
 * Get all settings with metadata
 * @returns Array of settings with metadata
 */
export async function getAllSettingsWithMetadata(): Promise<Setting[]> {
  try {
    return await dbAll<Setting>('SELECT * FROM settings ORDER BY key');
  } catch (error) {
    console.error('Error getting all settings with metadata:', error);
    return [];
  }
}

/**
 * Initialize default settings if they don't exist
 */
export async function initializeDefaultSettings(): Promise<void> {
  const defaultSettings = [
    { key: 'WRIKE_REDIRECT_URI', value: 'http://localhost:3000/auth/callback', encrypt: false },
  ];

  for (const setting of defaultSettings) {
    const existing = await getSetting(setting.key);
    if (existing === null) {
      await setSetting(setting.key, setting.value, setting.encrypt);
    }
  }
}
