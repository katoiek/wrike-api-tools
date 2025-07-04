/**
 * インメモリキャッシュサービス
 * ユーザー情報やその他の一時的なデータをメモリに保存
 */

// キャッシュアイテムのインターフェース
interface CacheItem<T> {
  value: T;
  expiresAt: Date;
  createdAt: Date;
}

// ユーザー情報のインターフェース
export interface CachedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  data: any;
}

// キャッシュクラス
class MemoryCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5分のデフォルトTTL

  /**
   * キャッシュに値を設定
   * @param key キー
   * @param value 値
   * @param ttlMs TTL（ミリ秒）
   */
  set<T>(key: string, value: T, ttlMs?: number): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (ttlMs || this.defaultTTL));

    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: now
    });
  }

  /**
   * キャッシュから値を取得
   * @param key キー
   * @returns 値（期限切れまたは存在しない場合はnull）
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    const now = new Date();
    if (now > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * キャッシュから値を削除
   * @param key キー
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * キャッシュの存在確認
   * @param key キー
   * @returns 存在するかどうか
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    const now = new Date();
    if (now > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 期限切れのキャッシュを削除
   */
  cleanupExpired(): void {
    const now = new Date();
    const expiredKeys: string[] = [];

    this.cache.forEach((item, key) => {
      if (now > item.expiresAt) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired cache items`);
    }
  }

  /**
   * キャッシュを全削除
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * キャッシュの状態を取得
   * @returns キャッシュ状態
   */
  getStatus(): {
    itemCount: number;
    keys: string[];
    memoryUsage: number;
  } {
    this.cleanupExpired();

    return {
      itemCount: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * メモリ使用量の推定
   * @returns 推定メモリ使用量（バイト）
   */
  private getMemoryUsage(): number {
    let size = 0;

    this.cache.forEach((item, key) => {
      size += key.length * 2; // 文字列のバイト数（概算）
      size += JSON.stringify(item.value).length * 2; // 値のバイト数（概算）
      size += 64; // オブジェクトのオーバーヘッド
    });

    return size;
  }
}

// ユーザー専用のキャッシュヘルパー
class UserCache {
  private cache: MemoryCache;
  private userTTL = 10 * 60 * 1000; // 10分のTTL

  constructor(cache: MemoryCache) {
    this.cache = cache;
  }

  /**
   * ユーザー情報をキャッシュに保存
   * @param user ユーザー情報
   */
  setUser(user: CachedUser): void {
    this.cache.set(`user:${user.id}`, user, this.userTTL);
  }

  /**
   * ユーザー情報をキャッシュから取得
   * @param userId ユーザーID
   * @returns ユーザー情報
   */
  getUser(userId: string): CachedUser | null {
    return this.cache.get(`user:${userId}`);
  }

  /**
   * ユーザー情報をキャッシュから削除
   * @param userId ユーザーID
   */
  deleteUser(userId: string): void {
    this.cache.delete(`user:${userId}`);
  }

  /**
   * 全てのユーザー情報を取得
   * @returns 全てのユーザー情報
   */
  getAllUsers(): CachedUser[] {
    const users: CachedUser[] = [];
    const status = this.cache.getStatus();

    status.keys.forEach(key => {
      if (key.startsWith('user:')) {
        const user = this.cache.get<CachedUser>(key);
        if (user) {
          users.push(user);
        }
      }
    });

    return users;
  }

  /**
   * ユーザーキャッシュを全削除
   */
  clearUsers(): void {
    const status = this.cache.getStatus();
    status.keys.forEach(key => {
      if (key.startsWith('user:')) {
        this.cache.delete(key);
      }
    });
  }
}

// シングルトンインスタンス
export const memoryCache = new MemoryCache();
export const userCache = new UserCache(memoryCache);

// 定期的な期限切れキャッシュのクリーンアップ
setInterval(() => {
  memoryCache.cleanupExpired();
}, 60000); // 1分ごと

// 便利な関数をエクスポート
export const setCache = <T>(key: string, value: T, ttlMs?: number) => memoryCache.set(key, value, ttlMs);
export const getCache = <T>(key: string) => memoryCache.get<T>(key);
export const deleteCache = (key: string) => memoryCache.delete(key);
export const hasCache = (key: string) => memoryCache.has(key);
export const clearCache = () => memoryCache.clear();
export const getCacheStatus = () => memoryCache.getStatus();

// ユーザー関連の関数
export const setUser = (user: CachedUser) => userCache.setUser(user);
export const getUser = (userId: string) => userCache.getUser(userId);
export const deleteUser = (userId: string) => userCache.deleteUser(userId);
export const getAllUsers = () => userCache.getAllUsers();
export const clearUsers = () => userCache.clearUsers();
