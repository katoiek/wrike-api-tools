import fs from 'fs';
import path from 'path';

// トークン保存用のディレクトリとファイルパス
const TOKEN_DIR = path.join(process.cwd(), '.tokens');
const TOKEN_FILE = path.join(TOKEN_DIR, 'wrike-token.json');

// トークン情報の型定義
export interface TokenInfo {
  access_token: string;
  refresh_token: string;
  expires_at: number; // トークンの有効期限（UNIXタイムスタンプ）
  token_type: string;
  scope?: string;
}

/**
 * トークンを保存する
 * @param tokenInfo トークン情報
 */
export function saveToken(tokenInfo: TokenInfo): void {
  try {
    // トークンディレクトリが存在しない場合は作成
    if (!fs.existsSync(TOKEN_DIR)) {
      fs.mkdirSync(TOKEN_DIR, { recursive: true });
    }

    // トークン情報をJSONとして保存
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenInfo, null, 2));
    console.log('Token saved successfully');
  } catch (error) {
    console.error('Error saving token:', error);
  }
}

/**
 * 保存されたトークンを読み込む
 * @returns トークン情報、存在しない場合はnull
 */
export function loadToken(): TokenInfo | null {
  try {
    // トークンファイルが存在しない場合はnullを返す
    if (!fs.existsSync(TOKEN_FILE)) {
      return null;
    }

    // トークン情報を読み込む
    const tokenData = fs.readFileSync(TOKEN_FILE, 'utf8');
    const tokenInfo: TokenInfo = JSON.parse(tokenData);

    return tokenInfo;
  } catch (error) {
    console.error('Error loading token:', error);
    return null;
  }
}

/**
 * トークンが有効かどうかを確認する
 * @param tokenInfo トークン情報
 * @returns 有効な場合はtrue、無効な場合はfalse
 */
export function isTokenValid(tokenInfo: TokenInfo | null): boolean {
  if (!tokenInfo || !tokenInfo.expires_at) {
    return false;
  }

  // 現在時刻とトークンの有効期限を比較
  // 5分の余裕を持たせる（300000ミリ秒 = 5分）
  const now = Date.now();
  return tokenInfo.expires_at > now + 300000;
}

/**
 * トークンを削除する
 */
export function deleteToken(): void {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      fs.unlinkSync(TOKEN_FILE);
      console.log('Token deleted successfully');
    }
  } catch (error) {
    console.error('Error deleting token:', error);
  }
}
