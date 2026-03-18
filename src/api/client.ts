import axios, { type AxiosInstance } from 'axios';
import { useAuthStore } from '@/stores/authStore';

let apiClient: AxiosInstance | null = null;

export function getApiClient(): AxiosInstance {
  if (!apiClient) {
    apiClient = createApiClient();
  }
  return apiClient;
}

export function reconfigureApiClient(): void {
  apiClient = createApiClient();
}

function createApiClient(): AxiosInstance {
  const { serverUrl, userId, appPassword } = useAuthStore.getState();

  const client = axios.create({
    baseURL: serverUrl,
    timeout: 60000,
  });

  client.interceptors.request.use((config) => {
    config.headers['OCS-APIRequest'] = 'true';
    config.headers['Accept'] = 'application/json';

    if (userId && appPassword) {
      const credentials = btoa(`${userId}:${appPassword}`);
      config.headers['Authorization'] = `Basic ${credentials}`;
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => {
      if (response.data?.ocs?.data !== undefined) {
        response.data = response.data.ocs.data;
      }
      return response;
    },
    (error) => {
      if (error.response?.status === 401) {
        useAuthStore.getState().clearCredentials();
      }
      return Promise.reject(error);
    },
  );

  return client;
}
