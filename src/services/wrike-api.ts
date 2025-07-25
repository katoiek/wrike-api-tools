import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  getCurrentToken,
  saveToken,
  updateToken,
  isTokenValid,
  type Token as MemoryToken,
  type TokenResponse
} from './memory-token-storage';
import { getEnvSetting } from './env-settings';
import dotenv from 'dotenv';

dotenv.config();

// Token interface（後方互換性のため）
interface Token {
  id?: number;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  host: string;
  created_at: string;
  updated_at: string;
}

// OAuth token response は memory-token-storage から import

// Wrike API response interface
export interface WrikeApiResponse<T> {
  kind: string;
  data: T[];
  nextPageToken?: string;
}

/**
 * Wrike API client
 */
export class WrikeApiClient {
  private axiosInstance: AxiosInstance | null = null;
  private token: MemoryToken | null = null;
  private baseUrl: string = '';

  /**
   * Initialize the Wrike API client
   */
  async initialize(): Promise<boolean> {
    try {
      // Get token from memory storage
      const token = getCurrentToken();

      if (!token) {
        console.log('No token found in memory storage');
        return false;
      }

      this.token = token;
      this.baseUrl = `https://${token.host}/api/v4`;

      // Check if token is expired
      if (!isTokenValid(token)) {
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
          'Authorization': `Bearer ${this.token.accessToken}`,
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

    // Use specified scopes for Wrike API access
    const scopes = [
      'Default',
      'wsReadOnly',
      'wsReadWrite',
      'amReadOnlyUser',
      'amReadWriteUser',
      'amReadOnlyGroup',
      'amReadWriteGroup',
      'amReadOnlyWorkflow',
      'amReadWriteWorkflow',
      'dataExportFull',
      'amReadOnlyAuditLog',
      'amReadOnlyAccessRole',
      'amReadOnlyWorkSchedule',
      'amReadWriteWorkSchedule',
      'amReadOnlyInvitation',
      'amReadWriteInvitation'
    ];

    return `https://login.wrike.com/oauth2/authorize/v4?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scopes.join(','))}`;
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

      // Save token to memory storage
      saveToken(response.data, response.data.host);

      // Update client
      this.token = getCurrentToken();
      this.baseUrl = `https://${response.data.host}/api/v4`;

      // Create axios instance with token
      this.axiosInstance = axios.create({
        baseURL: this.baseUrl,
        headers: {
          'Authorization': `Bearer ${this.token?.accessToken}`,
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
            refresh_token: this.token.refreshToken
          }
        }
      );

      // Update token in memory storage
      updateToken(response.data, response.data.host);

      // Update client
      this.token = getCurrentToken();

      // Update axios instance
      if (this.axiosInstance) {
        this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.token?.accessToken}`;
      } else {
        this.axiosInstance = axios.create({
          baseURL: this.baseUrl,
          headers: {
            'Authorization': `Bearer ${this.token?.accessToken}`,
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
   * Get a specific contact (user) by ID
   * @param contactId The contact ID
   * @returns The contact information
   */
  async getContact(contactId: string) {
    console.log(`Requesting contact with ID: ${contactId}`);
    const response = await this.request<WrikeApiResponse<any>>({
      method: 'GET',
      url: `/contacts/${contactId}`
    });
    console.log(`Contact response for ID ${contactId}:`, response);
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

  /**
   * Get user groups
   * @param params Query parameters
   * @returns List of user groups
   */
  async getUserGroups(params: any = {}) {
    console.log('Requesting user groups with params:', params);
    try {
      // Prepare parameters to get all groups
      const requestParams = { ...params };

      // Get all user groups in a single request
      console.log('Fetching all groups in a single request');
      const response = await this.request<WrikeApiResponse<any>>({
        method: 'GET',
        url: '/groups',
        params: requestParams
      });
      console.log('User groups response data length:', response.data.length);

      // Debug: Log the structure of the first group
      if (response.data.length > 0) {
        console.log('Sample group structure:', JSON.stringify(response.data[0], null, 2));
      }

      // Create a map of all groups for easy lookup
      const groupsMap = new Map();
      response.data.forEach(group => {
        groupsMap.set(group.id, group);
      });

      // Filter top-level groups (those with empty parentIds)
      const topLevelGroups = response.data.filter(group => !group.parentIds || group.parentIds.length === 0);
      console.log(`Found ${topLevelGroups.length} top-level groups`);

      // Build a hierarchical structure
      const buildHierarchy = (groups: any[]) => {
        return groups.map((group: any) => {
          // Create a new object with the group properties
          const hierarchicalGroup: any = { ...group };

          // Initialize empty arrays for members and childGroups
          hierarchicalGroup.members = [];
          hierarchicalGroup.childGroups = [];

          // Add member count based on memberIds
          if (hierarchicalGroup.memberIds) {
            hierarchicalGroup.memberCount = hierarchicalGroup.memberIds.length;

            // Add member IDs as simple objects for display
            hierarchicalGroup.members = hierarchicalGroup.memberIds.map((id: string) => ({ id }));
          }

          // Add child groups based on childIds
          if (hierarchicalGroup.childIds && hierarchicalGroup.childIds.length > 0) {
            hierarchicalGroup.childGroupCount = hierarchicalGroup.childIds.length;

            // Find child groups from the map and add them to the childGroups array
            hierarchicalGroup.childGroups = hierarchicalGroup.childIds
              .map((id: string) => groupsMap.get(id))
              .filter(Boolean)  // Filter out undefined values
              .map((childGroup: any) => {
                // Create a simplified version of the child group
                return {
                  id: childGroup.id,
                  title: childGroup.title || childGroup.name,
                  memberCount: childGroup.memberIds ? childGroup.memberIds.length : 0,
                  childGroupCount: childGroup.childIds ? childGroup.childIds.length : 0
                };
              });
          }

          return hierarchicalGroup;
        });
      };

      // Replace the response data with the hierarchical structure
      response.data = buildHierarchy(topLevelGroups);

      return response;
    } catch (error: any) {
      // Log the error with more details
      console.error('API request error:', error.message);
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
      }
      // Re-throw the error to be handled by the caller
      throw error;
    }
  }

  /**
   * Get group details (members and child groups)
   * This method is deprecated and should not be used directly.
   * Use the API route /api/groups/:id/details instead.
   * @param groupId The group ID
   * @returns Group details with members and child groups
   */
  async getGroupDetails(groupId: string) {
    console.log(`WARNING: getGroupDetails method is deprecated. Use API route /api/groups/:id/details instead.`);
    console.log(`Requesting details for group ${groupId}`);

    try {
      // Get all groups and find the specific one
      console.log(`Fetching all groups to find group with ID: ${groupId}`);
      const allGroupsResponse = await this.request<WrikeApiResponse<any>>({
        method: 'GET',
        url: '/groups',
        params: {}
      });

      if (!allGroupsResponse.data || allGroupsResponse.data.length === 0) {
        console.error('No groups found in response');
        throw new Error('No groups found');
      }

      // Find the specific group by ID
      const group = allGroupsResponse.data.find((g: any) => g.id === groupId);

      if (!group) {
        console.error(`Group ${groupId} not found in response`);
        throw new Error(`Group ${groupId} not found`);
      }
      console.log(`Group ${groupId} details:`, JSON.stringify(group, null, 2));

      // Prepare result object
      const result = {
        members: [],
        childGroups: []
      };

      // Add member IDs as simple objects
      if (group.memberIds && group.memberIds.length > 0) {
        console.log(`Group ${groupId} has ${group.memberIds.length} members`);
        result.members = group.memberIds.map((id: string) => ({ id }));
      }

      // For child groups, we can use the already fetched groups
      if (group.childIds && group.childIds.length > 0) {
        console.log(`Group ${groupId} has ${group.childIds.length} child groups`);

        // Create a map of all groups for easy lookup
        const groupsMap = new Map();
        allGroupsResponse.data.forEach((g: any) => {
          groupsMap.set(g.id, g);
        });

        // Find child groups from the map
        const childGroups = group.childIds
          .map((id: string) => groupsMap.get(id))
          .filter(Boolean); // Filter out undefined values

        console.log(`Successfully found ${childGroups.length} child groups`);

        // Get child groups from the map
        result.childGroups = childGroups.map((childGroup: any) => {
          // Create a simplified version of the child group
          return {
            id: childGroup.id,
            title: childGroup.title || childGroup.name,
            memberIds: childGroup.memberIds || [],
            memberCount: childGroup.memberIds ? childGroup.memberIds.length : 0,
            childIds: childGroup.childIds || [],
            childGroupCount: childGroup.childIds ? childGroup.childIds.length : 0
          };
        });
      }

      return result;
    } catch (error: any) {
      console.error(`Error getting details for group ${groupId}:`, error);
      console.error('Error details:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data || {}));
      }

      // Return empty results instead of throwing to avoid breaking the UI
      return {
        members: [],
        childGroups: [],
        error: error.message
      };
    }
  }

  /**
   * Get folder blueprints
   * @param params Query parameters
   * @returns List of folder blueprints
   */
  async getFolderBlueprints(params: any = {}) {
    console.log('Requesting folder blueprints with params:', params);
    try {
      const response = await this.request<WrikeApiResponse<any>>({
        method: 'GET',
        url: '/folder_blueprints',
        params: params
      });
      console.log('Folder blueprints response data length:', response.data.length);
      return response;
    } catch (error: any) {
      console.error('Error getting folder blueprints:', error);
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
      }
      throw error;
    }
  }

  /**
   * Get custom fields
   * @param params Query parameters
   * @returns List of custom fields
   */
  async getCustomFields(params: any = {}) {
    console.log('Requesting custom fields with params:', params);
    try {
      const response = await this.request<WrikeApiResponse<any>>({
        method: 'GET',
        url: '/customfields',
        params: params
      });
      console.log('Custom fields response data length:', response.data.length);
      return response;
    } catch (error: any) {
      console.error('Error getting custom fields:', error);
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
      }
      throw error;
    }
  }

  /**
   * Get folder blueprints for a specific space
   * @param spaceId The space ID
   * @param params Query parameters
   * @returns List of folder blueprints in the space
   */
  async getFolderBlueprintsInSpace(spaceId: string, params: any = {}) {
    console.log(`Requesting folder blueprints in space ${spaceId} with params:`, params);
    try {
      const response = await this.request<WrikeApiResponse<any>>({
        method: 'GET',
        url: `/spaces/${spaceId}/folder_blueprints`,
        params: params
      });
      console.log('Folder blueprints in space response data length:', response.data.length);
      return response;
    } catch (error: any) {
      console.error(`Error getting folder blueprints in space ${spaceId}:`, error);
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
      }
      throw error;
    }
  }

  /**
   * Launch a folder blueprint asynchronously
   * @param blueprintId The folder blueprint ID
   * @param data Launch parameters
   * @returns Async job information
   */
  async launchFolderBlueprintAsync(blueprintId: string, data: any = {}) {
    console.log(`Launching folder blueprint ${blueprintId} with data:`, data);
    try {
      const response = await this.request<WrikeApiResponse<any>>({
        method: 'POST',
        url: `/folder_blueprints/${blueprintId}/launch_async`,
        data: data
      });
      console.log('Launch folder blueprint response:', response);
      return response;
    } catch (error: any) {
      console.error(`Error launching folder blueprint ${blueprintId}:`, error);
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
      }
      throw error;
    }
  }

  /**
   * Get task blueprints
   * @param params Query parameters
   * @returns List of task blueprints
   */
  async getTaskBlueprints(params: any = {}) {
    console.log('Requesting task blueprints with params:', params);
    try {
      const response = await this.request<WrikeApiResponse<any>>({
        method: 'GET',
        url: '/task_blueprints',
        params: params
      });
      console.log('Task blueprints response data length:', response.data.length);
      return response;
    } catch (error: any) {
      console.error('Error getting task blueprints:', error);
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
      }
      throw error;
    }
  }

  /**
   * Get task blueprints for a specific space
   * @param spaceId The space ID
   * @param params Query parameters
   * @returns List of task blueprints in the space
   */
  async getTaskBlueprintsInSpace(spaceId: string, params: any = {}) {
    console.log(`Requesting task blueprints in space ${spaceId} with params:`, params);
    try {
      const response = await this.request<WrikeApiResponse<any>>({
        method: 'GET',
        url: `/spaces/${spaceId}/task_blueprints`,
        params: params
      });
      console.log('Task blueprints in space response data length:', response.data.length);
      return response;
    } catch (error: any) {
      console.error(`Error getting task blueprints in space ${spaceId}:`, error);
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
      }
      throw error;
    }
  }

  /**
   * Launch a task blueprint asynchronously
   * @param blueprintId The task blueprint ID
   * @param data Launch parameters
   * @returns Async job information
   */
  async launchTaskBlueprintAsync(blueprintId: string, data: any = {}) {
    console.log(`Launching task blueprint ${blueprintId} with data:`, data);
    try {
      const response = await this.request<WrikeApiResponse<any>>({
        method: 'POST',
        url: `/task_blueprints/${blueprintId}/launch_async`,
        data: data
      });
      console.log('Launch task blueprint response:', response);
      return response;
    } catch (error: any) {
      console.error(`Error launching task blueprint ${blueprintId}:`, error);
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
      }
      throw error;
    }
  }
}

// Create and export a singleton instance
export const wrikeApi = new WrikeApiClient();
