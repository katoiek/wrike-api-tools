import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { dbGet, dbRun } from '../database/init';
import dotenv from 'dotenv';

dotenv.config();

// Token interface
interface Token {
  id: number;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  host: string;
  created_at: string;
  updated_at: string;
}

// OAuth token response
interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  host: string;
}

// Wrike API response interface
interface WrikeApiResponse<T> {
  kind: string;
  data: T[];
  nextPageToken?: string;
}

/**
 * Wrike API client
 */
export class WrikeApiClient {
  private axiosInstance: AxiosInstance | null = null;
  private token: Token | null = null;
  private baseUrl: string = '';

  /**
   * Initialize the Wrike API client
   */
  async initialize(): Promise<boolean> {
    try {
      // Get token from database
      const token = await dbGet<Token>('SELECT * FROM tokens ORDER BY created_at DESC LIMIT 1');

      if (!token) {
        console.log('No token found in database');
        return false;
      }

      this.token = token;
      this.baseUrl = `https://${token.host}/api/v4`;

      // Check if token is expired
      const expiresAt = new Date(token.expires_at);
      if (expiresAt <= new Date()) {
        // Token is expired, try to refresh
        const refreshed = await this.refreshToken();
        if (!refreshed) {
          return false;
        }
      }

      // Create axios instance with token
      this.axiosInstance = axios.create({
        baseURL: this.baseUrl,
        headers: {
          'Authorization': `Bearer ${this.token.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      return true;
    } catch (error) {
      console.error('Error initializing Wrike API client:', error);
      return false;
    }
  }

  /**
   * Get the authorization URL for OAuth
   * @returns The authorization URL
   */
  async getAuthorizationUrl(): Promise<string> {
    const clientId = process.env.WRIKE_CLIENT_ID;
    const redirectUri = process.env.WRIKE_REDIRECT_URI;

    if (!clientId) {
      throw new Error('WRIKE_CLIENT_ID is not set in .env file');
    }

    if (!redirectUri) {
      throw new Error('WRIKE_REDIRECT_URI is not set in .env file');
    }

    return `https://login.wrike.com/oauth2/authorize/v4?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}`;
  }

  /**
   * Exchange authorization code for access token
   * @param code The authorization code
   * @returns True if successful
   */
  async exchangeCodeForToken(code: string): Promise<boolean> {
    try {
      const clientId = process.env.WRIKE_CLIENT_ID;
      const clientSecret = process.env.WRIKE_CLIENT_SECRET;
      const redirectUri = process.env.WRIKE_REDIRECT_URI;

      if (!clientId || !clientSecret || !redirectUri) {
        throw new Error('Missing Wrike API credentials in .env file');
      }

      const response = await axios.post<TokenResponse>(
        'https://login.wrike.com/oauth2/token',
        null,
        {
          params: {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri
          }
        }
      );

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + response.data.expires_in);

      // Save token to database
      await dbRun(
        'INSERT INTO tokens (access_token, refresh_token, expires_at, host) VALUES (?, ?, ?, ?)',
        [
          response.data.access_token,
          response.data.refresh_token,
          expiresAt.toISOString(),
          response.data.host
        ]
      );

      // Update client
      this.token = {
        id: 0, // Will be set by the database
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_at: expiresAt.toISOString(),
        host: response.data.host,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      this.baseUrl = `https://${response.data.host}/api/v4`;

      // Create axios instance with token
      this.axiosInstance = axios.create({
        baseURL: this.baseUrl,
        headers: {
          'Authorization': `Bearer ${this.token.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      return true;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      return false;
    }
  }

  /**
   * Refresh the access token
   * @returns True if successful
   */
  private async refreshToken(): Promise<boolean> {
    try {
      if (!this.token) {
        return false;
      }

      const clientId = process.env.WRIKE_CLIENT_ID;
      const clientSecret = process.env.WRIKE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Missing Wrike API credentials in .env file');
      }

      const response = await axios.post<TokenResponse>(
        'https://login.wrike.com/oauth2/token',
        null,
        {
          params: {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'refresh_token',
            refresh_token: this.token.refresh_token
          }
        }
      );

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + response.data.expires_in);

      // Save token to database
      await dbRun(
        'INSERT INTO tokens (access_token, refresh_token, expires_at, host) VALUES (?, ?, ?, ?)',
        [
          response.data.access_token,
          response.data.refresh_token,
          expiresAt.toISOString(),
          response.data.host
        ]
      );

      // Update client
      this.token = {
        id: 0, // Will be set by the database
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_at: expiresAt.toISOString(),
        host: response.data.host,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Update axios instance
      if (this.axiosInstance) {
        this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.token.access_token}`;
      } else {
        this.axiosInstance = axios.create({
          baseURL: this.baseUrl,
          headers: {
            'Authorization': `Bearer ${this.token.access_token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  /**
   * Make a request to the Wrike API
   * @param config The axios request config
   * @returns The response data
   */
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    if (!this.axiosInstance) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Wrike API client not initialized');
      }
    }

    try {
      console.log(`Making API request to: ${config.url}`);
      const response = await this.axiosInstance!.request<T>(config);
      console.log(`API response status: ${response.status}`);
      return response.data;
    } catch (error: any) {
      console.error('API request error:', error.message);
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
      }

      if (error.response && error.response.status === 401) {
        // Token might be expired, try to refresh
        console.log('Token expired, attempting to refresh...');
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry request with new token
          console.log('Token refreshed, retrying request...');
          const response = await this.axiosInstance!.request<T>(config);
          return response.data;
        }
      }

      throw error;
    }
  }

  /**
   * Get current user information
   * @returns The user information
   */
  async getCurrentUser() {
    return this.request<WrikeApiResponse<any>>({
      method: 'GET',
      url: '/contacts',
      params: {
        me: true
      }
    });
  }

  /**
   * Get all contacts (users)
   * @returns List of contacts
   */
  async getContacts(params: any = {}) {
    // コンタクトAPIではパラメータをそのまま使用
    console.log('Requesting contacts with params:', params);
    const response = await this.request<WrikeApiResponse<any>>({
      method: 'GET',
      url: '/contacts',
      params: params
    });
    console.log('Contacts response data length:', response.data.length);

    return response;
  }

  /**
   * Get spaces
   * @param params Query parameters
   * @returns List of spaces
   */
  async getSpaces(params: any = {}) {
    // スペースAPIではパラメータを使用しない
    console.log('Requesting spaces with params:', params);
    const response = await this.request<WrikeApiResponse<any>>({
      method: 'GET',
      url: '/spaces',
      params: params
    });
    console.log('Spaces response:', JSON.stringify(response, null, 2));

    return response;
  }

  /**
   * Get all root folders (including spaces with permalinks)
   * @param params Query parameters
   * @returns List of root folders
   */
  async getRootFolders(params: any = {}) {
    // descendants=false を設定して、ルートフォルダのみを取得
    const requestParams = {
      descendants: false,
      ...params
    };

    console.log('Requesting root folders with params:', requestParams);
    const response = await this.request<WrikeApiResponse<any>>({
      method: 'GET',
      url: '/folders',
      params: requestParams
    });
    console.log('Root folders response data length:', response.data.length);

    return response;
  }

  /**
   * Get folders
   * @param params Query parameters
   * @returns List of folders
   */
  async getFolders(params: any = {}) {
    // フォルダAPIではパラメータをそのまま使用
    console.log('Requesting folders with params:', params);
    const response = await this.request<WrikeApiResponse<any>>({
      method: 'GET',
      url: '/folders',
      params: params
    });
    console.log('Folders response:', JSON.stringify(response, null, 2));

    return response;
  }

  /**
   * Get folders in a space
   * @param spaceId The space ID
   * @param params Query parameters
   * @returns List of folders
   */
  async getFoldersInSpace(spaceId: string, params: any = {}) {
    // パラメータをそのまま使用
    console.log('Requesting folders in space with params:', params);
    const response = await this.request<WrikeApiResponse<any>>({
      method: 'GET',
      url: `/spaces/${spaceId}/folders`,
      params: params
    });
    console.log('Folders in space response data length:', response.data.length);

    return response;
  }

  /**
   * Get tasks
   * @param params Query parameters
   * @returns List of tasks
   */
  async getTasks(params: any = {}) {
    // タスクAPIではpageSizeパラメータが使用可能
    const requestParams = {
      pageSize: params.pageSize || 100, // デフォルトは100、明示的に指定された場合はその値を使用
      ...params
    };

    // pageSize以外のパラメータが重複しないように削除
    if (params.pageSize) {
      delete requestParams.pageSize;
      requestParams.pageSize = params.pageSize;
    }

    console.log('Requesting tasks with params:', requestParams);
    const response = await this.request<WrikeApiResponse<any>>({
      method: 'GET',
      url: '/tasks',
      params: requestParams
    });
    console.log('Tasks response data length:', response.data.length);

    return response;
  }

  /**
   * Get tasks in a folder
   * @param folderId The folder ID
   * @param params Query parameters
   * @returns List of tasks
   */
  async getTasksInFolder(folderId: string, params: any = {}) {
    // タスクAPIではpageSizeパラメータが使用可能
    const requestParams = {
      pageSize: params.pageSize || 100, // デフォルトは100、明示的に指定された場合はその値を使用
      ...params
    };

    // pageSize以外のパラメータが重複しないように削除
    if (params.pageSize) {
      delete requestParams.pageSize;
      requestParams.pageSize = params.pageSize;
    }

    console.log('Requesting tasks in folder with params:', requestParams);
    const response = await this.request<WrikeApiResponse<any>>({
      method: 'GET',
      url: `/folders/${folderId}/tasks`,
      params: requestParams
    });
    console.log('Tasks in folder response data length:', response.data.length);

    return response;
  }

  /**
   * Create a task in a folder
   * @param folderId The folder ID
   * @param data Task data
   * @returns The created task
   */
  async createTask(folderId: string, data: any) {
    return this.request<WrikeApiResponse<any>>({
      method: 'POST',
      url: `/folders/${folderId}/tasks`,
      data
    });
  }

  /**
   * Create a user invitation
   * @param data Invitation data
   * @returns The created invitation
   */
  async createInvitation(data: any) {
    return this.request<WrikeApiResponse<any>>({
      method: 'POST',
      url: '/invitations',
      data
    });
  }

  /**
   * Create multiple user invitations
   * @param invitations Array of invitation data
   * @returns Array of results
   */
  async createBulkInvitations(invitations: any[]) {
    // Process invitations in batches
    const results = [];
    for (const invitation of invitations) {
      try {
        const result = await this.createInvitation(invitation);
        results.push({ success: true, data: result, email: invitation.email });
      } catch (error) {
        results.push({ success: false, error, email: invitation.email });
      }
    }
    return results;
  }
}

// Create and export a singleton instance
export const wrikeApi = new WrikeApiClient();
