import {
  getEnvSetting,
  setEnvSetting,
  getAllEnvSettings,
  getAllEnvSettingsWithMetadata,
  validateRequiredEnvSettings,
  type EnvSetting
} from './env-settings';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Interface for a setting record (環境変数ベース用に更新)
 */
export interface Setting {
  key: string;
  value: string;
  encrypted: boolean;
  source: 'env' | 'default';
}

// 後方互換性のためのエイリアス
export type { EnvSetting };

/**
 * Get a setting by key
 * @param key The setting key
 * @returns The setting value
 */
export async function getSetting(key: string): Promise<string | null> {
  try {
    return getEnvSetting(key);
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
    setEnvSetting(key, value, shouldEncrypt);
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
    // 環境変数の削除（注意: プロセス内のみ）
    delete process.env[key];
    console.warn(`Setting ${key} deleted from current process. This does not affect system environment variables.`);
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
    return getAllEnvSettings(includeEncrypted);
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
    const envSettings = getAllEnvSettingsWithMetadata();
    // EnvSettingをSettingに変換
    return envSettings.map(setting => ({
      key: setting.key,
      value: setting.value,
      encrypted: setting.encrypted,
      source: setting.source
    }));
  } catch (error) {
    console.error('Error getting all settings with metadata:', error);
    return [];
  }
}

/**
 * Initialize default settings if they don't exist
 */
export async function initializeDefaultSettings(): Promise<void> {
  // 環境変数が設定されているかチェック
  const validation = validateRequiredEnvSettings();

  if (!validation.valid) {
    console.warn('Missing required environment variables:', validation.missing);
    console.warn('Please set these environment variables in your .env file or system environment');
  }

  // デフォルト設定は env-settings.ts で処理されるため、ここでは検証のみ
  console.log('Environment settings validation completed');
}
