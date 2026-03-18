import { create } from 'zustand';
import * as secureStorage from '@/services/secureStorage';
import { STORAGE_KEYS } from '@/config/constants';

interface AuthState {
  serverUrl: string;
  userId: string;
  appPassword: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  setCredentials: (
    serverUrl: string,
    userId: string,
    appPassword: string,
  ) => Promise<void>;
  clearCredentials: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  serverUrl: '',
  userId: '',
  appPassword: '',
  isAuthenticated: false,
  isLoading: true,

  setCredentials: async (serverUrl, userId, appPassword) => {
    await Promise.all([
      secureStorage.save(STORAGE_KEYS.SERVER_URL, serverUrl),
      secureStorage.save(STORAGE_KEYS.USER_ID, userId),
      secureStorage.save(STORAGE_KEYS.APP_PASSWORD, appPassword),
    ]);
    set({
      serverUrl,
      userId,
      appPassword,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  clearCredentials: async () => {
    await Promise.all([
      secureStorage.remove(STORAGE_KEYS.SERVER_URL),
      secureStorage.remove(STORAGE_KEYS.USER_ID),
      secureStorage.remove(STORAGE_KEYS.APP_PASSWORD),
    ]);
    set({
      serverUrl: '',
      userId: '',
      appPassword: '',
      isAuthenticated: false,
      isLoading: false,
    });
  },

  loadFromStorage: async () => {
    try {
      const [serverUrl, userId, appPassword] = await Promise.all([
        secureStorage.get(STORAGE_KEYS.SERVER_URL),
        secureStorage.get(STORAGE_KEYS.USER_ID),
        secureStorage.get(STORAGE_KEYS.APP_PASSWORD),
      ]);

      if (serverUrl && userId && appPassword) {
        set({
          serverUrl,
          userId,
          appPassword,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
