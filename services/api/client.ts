// API Client with Mock/Real API switching

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, buildUrl } from './config';
import { mockApiHandler } from './mock/mockHandlers';
import { mockDelay } from './mock/mockHelpers';
import { ApiError, ApiResponse, HttpMethod, RequestConfig } from './types';

class ApiClient {
  private authToken: string | null = null;

  // Initialize client and load saved token
  async initialize(): Promise<void> {
    try {
      this.authToken = await AsyncStorage.getItem('@wami_token');
    } catch (error) {
      console.error('Error loading auth token:', error);
    }
  }

  // Set authentication token
  setAuthToken(token: string | null): void {
    this.authToken = token;
    if (token) {
      AsyncStorage.setItem('@wami_token', token);
    } else {
      AsyncStorage.removeItem('@wami_token');
    }
  }

  // Get authentication token
  getAuthToken(): string | null {
    return this.authToken;
  }

  // Main request method
  async request<T = any>(
    method: HttpMethod,
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      // Use mock API if enabled
      if (API_CONFIG.USE_MOCK) {
        return await this.mockRequest<T>(method, endpoint, config);
      }

      // Real API request
      return await this.realRequest<T>(method, endpoint, config);
    } catch (error: any) {
      console.error('API Request Error:', error);
      throw this.transformError(error);
    }
  }

  // Mock API request handler
  private async mockRequest<T>(
    method: HttpMethod,
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    // Simulate network delay
    await mockDelay();

    // Call mock handler
    const response = await mockApiHandler<T>(method, endpoint, {
      body: config?.body,
      params: config?.params,
      headers: this.buildHeaders(config?.headers),
    });

    return response;
  }

  // Real API request handler
  private async realRequest<T>(
    method: HttpMethod,
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const url = buildUrl(endpoint);
    const headers = this.buildHeaders(config?.headers);

    const fetchConfig: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(config?.timeout ?? API_CONFIG.TIMEOUT_MS),
    };

    // Add body for POST, PUT, PATCH
    if (config?.body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      fetchConfig.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, fetchConfig);

    if (!response.ok) {
      throw await this.handleHttpError(response);
    }

    const data = await response.json();
    
    // Transform to ApiResponse format
    return {
      success: true,
      data: data.data ?? data,
      message: data.message,
    };
  }

  // Build request headers
  private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  // Handle HTTP errors
  private async handleHttpError(response: Response): Promise<ApiError> {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    return {
      code: errorData.code || `HTTP_${response.status}`,
      message: errorData.message || 'An error occurred',
      statusCode: response.status,
      details: errorData.details,
    };
  }

  // Transform errors to ApiError format
  private transformError(error: any): ApiError {
    if (error.code && error.message) {
      return error;
    }

    return {
      code: 'NETWORK_ERROR',
      message: error.message || 'Network request failed',
      details: error,
    };
  }

  // Convenience methods
  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, config);
  }

  async post<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, { ...config, body });
  }

  async put<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, { ...config, body });
  }

  async patch<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, { ...config, body });
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, config);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Initialize on import
apiClient.initialize();
