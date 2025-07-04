import dotenv from 'dotenv';
import { encrypt, decrypt } from '../utils/encryption';

dotenv.config();

/**
 * 環境変数ベースの設定管理サービス
 * データの永続化は行わず、環境変数を中心とした設定管理
 */

// 設定のインターフェース
export interface EnvSetting {
  key: string;
  value: string;
  encrypted: boolean;
  source: 'env' | 'default';
}

// デフォルト設定
const DEFAULT_SETTINGS: Record<string, string> = {
  'WRIKE_REDIRECT_URI': 'http://localhost:3000/auth/callback',
  'PORT': '3000',
  'NODE_ENV': 'development'
};

// 暗号化が必要な設定のキーワード
const ENCRYPTION_KEYWORDS = ['token', 'secret', 'password', 'key', 'client_secret'];

/**
 * 設定値の取得
 * @param key 設定キー
 * @param defaultValue デフォルト値
 * @returns 設定値
 */
export function getEnvSetting(key: string, defaultValue?: string): string | null {
  try {
    // 環境変数から取得
    const envValue = process.env[key];
    if (envValue) {
      return envValue;
    }

    // デフォルト設定から取得
    const defaultVal = DEFAULT_SETTINGS[key] || defaultValue;
    return defaultVal || null;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultValue || null;
  }
}

/**
 * 設定値の設定（環境変数への設定）
 * @param key 設定キー
 * @param value 設定値
 * @param shouldEncrypt 暗号化するか
 */
export function setEnvSetting(key: string, value: string, shouldEncrypt?: boolean): void {
  try {
    // 自動暗号化の判定
    if (shouldEncrypt === undefined) {
      const lowerKey = key.toLowerCase();
      shouldEncrypt = ENCRYPTION_KEYWORDS.some(keyword => lowerKey.includes(keyword));
    }

    // 暗号化する場合は警告を出す（環境変数は通常平文で保存）
    if (shouldEncrypt) {
      console.warn(`Warning: Setting ${key} contains sensitive data. Consider using encrypted environment variables or external secret management.`);
    }

    // 環境変数に設定
    process.env[key] = value;
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
  }
}

/**
 * 複数の設定値の取得
 * @param keys 設定キーの配列
 * @returns 設定値のオブジェクト
 */
export function getMultipleEnvSettings(keys: string[]): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  keys.forEach(key => {
    result[key] = getEnvSetting(key);
  });
  return result;
}

/**
 * 全ての設定値の取得（環境変数 + デフォルト設定）
 * @param includeSensitive 機密情報を含めるか
 * @returns 設定値のオブジェクト
 */
export function getAllEnvSettings(includeSensitive = false): Record<string, string> {
  const result: Record<string, string> = {};

  // デフォルト設定を追加
  Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
    result[key] = getEnvSetting(key) || value;
  });

  // 環境変数から関連する設定を追加
  Object.entries(process.env).forEach(([key, value]) => {
    if (value && (key.startsWith('WRIKE_') || key.startsWith('APP_'))) {
      const lowerKey = key.toLowerCase();
      const isSensitive = ENCRYPTION_KEYWORDS.some(keyword => lowerKey.includes(keyword));

      if (isSensitive && !includeSensitive) {
        result[key] = '[機密情報]';
      } else {
        result[key] = value!; // valueは上でチェック済み
      }
    }
  });

  return result;
}

/**
 * 設定値の詳細情報付きで取得
 * @returns 設定値の詳細情報
 */
export function getAllEnvSettingsWithMetadata(): EnvSetting[] {
  const settings: EnvSetting[] = [];

  // デフォルト設定
  Object.entries(DEFAULT_SETTINGS).forEach(([key, defaultValue]) => {
    const envValue = process.env[key];
    const value = envValue || defaultValue;
    const lowerKey = key.toLowerCase();
    const encrypted = ENCRYPTION_KEYWORDS.some(keyword => lowerKey.includes(keyword));

    settings.push({
      key,
      value: encrypted ? '[機密情報]' : value,
      encrypted,
      source: envValue ? 'env' : 'default'
    });
  });

  // 環境変数から追加の設定
  Object.entries(process.env).forEach(([key, value]) => {
    if (value && (key.startsWith('WRIKE_') || key.startsWith('APP_')) && !DEFAULT_SETTINGS[key]) {
      const lowerKey = key.toLowerCase();
      const encrypted = ENCRYPTION_KEYWORDS.some(keyword => lowerKey.includes(keyword));

      settings.push({
        key,
        value: encrypted ? '[機密情報]' : value!,
        encrypted,
        source: 'env'
      });
    }
  });

  return settings.sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * 必要な環境変数の検証
 * @returns 検証結果
 */
export function validateRequiredEnvSettings(): { valid: boolean; missing: string[] } {
  const required = ['WRIKE_CLIENT_ID', 'WRIKE_CLIENT_SECRET', 'SESSION_SECRET', 'ENCRYPTION_KEY'];
  const missing: string[] = [];

  required.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  return {
    valid: missing.length === 0,
    missing
  };
}
