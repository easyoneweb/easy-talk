import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemePreference = 'system' | 'light' | 'dark';

interface SettingsState {
  themePreference: ThemePreference;
  notificationsEnabled: boolean;
  setThemePreference: (pref: ThemePreference) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  themePreference: 'system',
  notificationsEnabled: true,

  setThemePreference: (themePreference) => {
    set({ themePreference });
    AsyncStorage.setItem('theme_preference', themePreference);
  },

  setNotificationsEnabled: (notificationsEnabled) => {
    set({ notificationsEnabled });
    AsyncStorage.setItem('notifications_enabled', String(notificationsEnabled));
  },

  loadSettings: async () => {
    try {
      const [theme, notifications] = await Promise.all([
        AsyncStorage.getItem('theme_preference'),
        AsyncStorage.getItem('notifications_enabled'),
      ]);

      set({
        themePreference: (theme as ThemePreference) ?? 'system',
        notificationsEnabled: notifications !== 'false',
      });
    } catch {
      // Use defaults
    }
  },
}));
