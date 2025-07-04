import { getEnvSetting } from './env-settings';

/**
 * インメモリトークンストレージ
 * セッション中のみトークンを保持し、アプリケーション再起動時にクリア
 */

// トークンのインターフェース
export interface Token {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  host: string;
  createdAt: Date;
  updatedAt: Date;
}

// トークンの応答インターフェース
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  host: string;
}

// インメモリストレージ
class MemoryTokenStorage {
  private tokens: Map<string, Token> = new Map();
  private currentToken: Token | null = null;

  /**
   * トークンの保存
   * @param tokenData トークンデータ
   * @param host ホスト名
   */
  saveToken(tokenData: TokenResponse, host?: string): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (tokenData.expires_in * 1000));

    const token: Token = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt,
      host: host || tokenData.host,
      createdAt: now,
      updatedAt: now
    };

    // 現在のトークンとして設定
    this.currentToken = token;

    // ホスト別にも保存
    if (token.host) {
      this.tokens.set(token.host, token);
    }

    console.log('Token saved to memory storage');
  }

  /**
   * 現在のトークンの取得
   * @returns 現在のトークン
   */
  getCurrentToken(): Token | null {
    // 環境変数からトークンを取得する場合
    const envAccessToken = getEnvSetting('WRIKE_ACCESS_TOKEN');
    const envRefreshToken = getEnvSetting('WRIKE_REFRESH_TOKEN');
    const envHost = getEnvSetting('WRIKE_HOST');

    if (envAccessToken && envRefreshToken) {
      // 環境変数からトークンを構築
      const now = new Date();
      return {
        accessToken: envAccessToken,
        refreshToken: envRefreshToken,
        expiresAt: new Date(now.getTime() + (3600 * 1000)), // 1時間後
        host: envHost || 'www.wrike.com',
        createdAt: now,
        updatedAt: now
      };
    }

    return this.currentToken;
  }

  /**
   * ホスト別のトークン取得
   * @param host ホスト名
   * @returns トークン
   */
  getTokenByHost(host: string): Token | null {
    return this.tokens.get(host) || null;
  }

  /**
   * トークンの更新
   * @param tokenData 新しいトークンデータ
   * @param host ホスト名
   */
  updateToken(tokenData: TokenResponse, host?: string): void {
    const targetHost = host || tokenData.host;
    const existingToken = this.tokens.get(targetHost);

    if (existingToken) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (tokenData.expires_in * 1000));

      const updatedToken: Token = {
        ...existingToken,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
        updatedAt: now
      };

      this.tokens.set(targetHost, updatedToken);

      // 現在のトークンも更新
      if (this.currentToken?.host === targetHost) {
        this.currentToken = updatedToken;
      }

      console.log(`Token updated for host: ${targetHost}`);
    } else {
      // 新しいトークンとして保存
      this.saveToken(tokenData, targetHost);
    }
  }

  /**
   * トークンの有効性確認
   * @param token トークン
   * @returns 有効かどうか
   */
  isTokenValid(token: Token | null): boolean {
    if (!token) return false;

    const now = new Date();
    const buffer = 5 * 60 * 1000; // 5分のバッファ

    return token.expiresAt.getTime() > (now.getTime() + buffer);
  }

  /**
   * トークンの削除
   * @param host ホスト名（省略時は全削除）
   */
  removeToken(host?: string): void {
    if (host) {
      this.tokens.delete(host);
      if (this.currentToken?.host === host) {
        this.currentToken = null;
      }
    } else {
      this.tokens.clear();
      this.currentToken = null;
    }
  }

  /**
   * 全てのトークンの取得
   * @returns 全てのトークン
   */
  getAllTokens(): Token[] {
    return Array.from(this.tokens.values());
  }

  /**
   * トークンの状態を取得
   * @returns トークン状態
   */
  getTokenStatus(): {
    hasCurrentToken: boolean;
    isCurrentTokenValid: boolean;
    tokenCount: number;
    hosts: string[];
  } {
    const currentToken = this.getCurrentToken();

    return {
      hasCurrentToken: !!currentToken,
      isCurrentTokenValid: this.isTokenValid(currentToken),
      tokenCount: this.tokens.size,
      hosts: Array.from(this.tokens.keys())
    };
  }

  /**
   * ストレージのクリア
   */
  clear(): void {
    this.tokens.clear();
    this.currentToken = null;
    console.log('Token storage cleared');
  }
}

// シングルトンインスタンス
export const tokenStorage = new MemoryTokenStorage();

// 便利な関数をエクスポート
export const saveToken = (tokenData: TokenResponse, host?: string) => tokenStorage.saveToken(tokenData, host);
export const getCurrentToken = () => tokenStorage.getCurrentToken();
export const getTokenByHost = (host: string) => tokenStorage.getTokenByHost(host);
export const updateToken = (tokenData: TokenResponse, host?: string) => tokenStorage.updateToken(tokenData, host);
export const isTokenValid = (token: Token | null) => tokenStorage.isTokenValid(token);
export const removeToken = (host?: string) => tokenStorage.removeToken(host);
export const getAllTokens = () => tokenStorage.getAllTokens();
export const getTokenStatus = () => tokenStorage.getTokenStatus();
export const clearTokenStorage = () => tokenStorage.clear();
