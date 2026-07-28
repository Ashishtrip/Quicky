import axios, { AxiosInstance, AxiosError } from 'axios';

declare const console: {
  error(message?: any, ...optionalParams: any[]): void;
};

/**
 * Default API base URL — overridable via config
 * In development, the RN app connects to the local Express server
 */
const DEFAULT_BASE_URL = 'https://quicky-production.up.railway.app';

let _client: AxiosInstance | null = null;
let _authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  _authToken = token;
};

export interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
}

/**
 * Initialise (or reinitialise) the shared Axios client.
 * Call once at app startup from _layout.tsx.
 */
export function initApiClient(config: ApiClientConfig = {}): AxiosInstance {
  _client = axios.create({
    baseURL: config.baseUrl || DEFAULT_BASE_URL,
    timeout: config.timeout || 30_000,
    headers: {
      'Content-Type': 'application/json',
      'Bypass-Tunnel-Reminder': 'true',
    },
  });

  _client.interceptors.request.use((config) => {
    if (_authToken && config.headers) {
      config.headers.Authorization = `Bearer ${_authToken}`;
    }
    return config;
  });

  // Response interceptor — normalise errors
  _client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response) {
        // Skip logging 404s to avoid console noise for expected "not found" cases like missing profiles
        if (error.response.status !== 404) {
          console.error(
            `[API] ${error.config?.method?.toUpperCase()} ${error.config?.url} → ${error.response.status}`,
            error.response.data
          );
        }
      } else if (error.request) {
        console.error('[API] Network error — no response received', error.message);
      }
      return Promise.reject(error);
    }
  );

  return _client;
}

/**
 * Get the shared Axios instance.
 * Auto-initialises with defaults if not yet created.
 */
export function getApiClient(): AxiosInstance {
  if (!_client) {
    return initApiClient();
  }
  return _client;
}
