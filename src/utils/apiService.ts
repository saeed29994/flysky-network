// 📁 src/utils/apiService.ts

import { API_CONFIG, buildApiUrl } from '../config/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retryAttempts?: number;
}

class ApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = API_CONFIG.TIMEOUT,
      retryAttempts = API_CONFIG.RETRY.MAX_ATTEMPTS,
    } = options;

    const url = buildApiUrl(endpoint);
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(timeout),
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return { success: true, data };
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === retryAttempts) {
          break;
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => 
          setTimeout(resolve, API_CONFIG.RETRY.DELAY * attempt)
        );
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Request failed',
    };
  }

  async sendNotification(payload: {
    title: string;
    body: string;
    tokens: string[];
  }): Promise<ApiResponse> {
    return this.makeRequest('/sendNotification', {
      method: 'POST',
      body: payload,
    });
  }

  async getNotifications(): Promise<ApiResponse> {
    return this.makeRequest('/notifications', {
      method: 'GET',
    });
  }

  async getUsers(): Promise<ApiResponse> {
    return this.makeRequest('/users', {
      method: 'GET',
    });
  }
}

export const apiService = new ApiService(); 