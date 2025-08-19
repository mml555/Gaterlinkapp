import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse } from '../types';

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

class ApiService {
  private baseURL: string = '';
  private authToken: string | null = null;
  private readonly TOKEN_KEY = '@gaterlink_auth_token';

  constructor() {
    this.loadToken();
  }

  /**
   * Configure the API service
   */
  configure(baseURL: string): void {
    this.baseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  }

  /**
   * Set authentication token
   */
  async setAuthToken(token: string | null): Promise<void> {
    this.authToken = token;
    if (token) {
      await AsyncStorage.setItem(this.TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(this.TOKEN_KEY);
    }
  }

  /**
   * Load stored authentication token
   */
  private async loadToken(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem(this.TOKEN_KEY);
      this.authToken = token;
    } catch (error) {
      console.error('Failed to load auth token:', error);
    }
  }

  /**
   * Make an API request
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const { method = 'GET', headers = {}, body, timeout = 30000 } = config;

    // Build headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add auth token if available
    if (this.authToken) {
      requestHeaders['Authorization'] = `Bearer ${this.authToken}`;
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      const data = await response.json();

      // Handle non-2xx responses
      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `Request failed with status ${response.status}`,
        };
      }

      // Success response
      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Handle network errors
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout',
        };
      }

      return {
        success: false,
        error: error.message || 'Network request failed',
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, headers });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, headers });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body, headers });
  }

  /**
   * Upload file
   */
  async uploadFile<T>(
    endpoint: string,
    file: {
      uri: string;
      type: string;
      name: string;
    },
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    
    // Add file
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);

    // Add additional data
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: this.authToken ? `Bearer ${this.authToken}` : '',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'File upload failed',
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'File upload failed',
      };
    }
  }

  /**
   * Check if API is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health');
      return response.success;
    } catch {
      return false;
    }
  }
}

export default new ApiService();