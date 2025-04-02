import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

dotenv.config();

// Get encryption key from environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_encryption_key_change_this_now';

/**
 * Encrypt a string value
 * @param value The string to encrypt
 * @returns The encrypted string
 */
export function encrypt(value: string): string {
  return CryptoJS.AES.encrypt(value, ENCRYPTION_KEY).toString();
}

/**
 * Decrypt an encrypted string
 * @param encryptedValue The encrypted string
 * @returns The decrypted string
 */
export function decrypt(encryptedValue: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedValue, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Check if a string is encrypted
 * @param value The string to check
 * @returns True if the string appears to be encrypted
 */
export function isEncrypted(value: string): boolean {
  try {
    // Try to decrypt the value
    const decrypted = decrypt(value);
    // If it decrypts without error and is not empty, it was likely encrypted
    return decrypted.length > 0;
  } catch (error) {
    // If decryption fails, it's not encrypted
    return false;
  }
}
