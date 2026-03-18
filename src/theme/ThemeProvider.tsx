import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme, Platform } from 'react-native';
import {
  MD3DarkTheme,
  MD3LightTheme,
  PaperProvider,
  type MD3Theme,
} from 'react-native-paper';
import { useMaterial3Theme } from '@pchmn/expo-material3-theme';
import { FALLBACK_COLORS, FALLBACK_COLORS_DARK } from './colors';

type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  theme: MD3Theme;
  isDark: boolean;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: MD3LightTheme,
  isDark: false,
  themePreference: 'system',
  setThemePreference: () => {},
});

export function useAppTheme() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: React.ReactNode;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
}

export function ThemeProvider({
  children,
  themePreference,
  setThemePreference,
}: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const { theme: materialTheme } = useMaterial3Theme({
    fallbackSourceColor: FALLBACK_COLORS.primary,
  });

  const isDark = useMemo(() => {
    if (themePreference === 'system') return systemScheme === 'dark';
    return themePreference === 'dark';
  }, [themePreference, systemScheme]);

  const theme = useMemo(() => {
    const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;

    if (Platform.OS === 'android' && materialTheme) {
      const dynamicColors = isDark ? materialTheme.dark : materialTheme.light;
      return {
        ...baseTheme,
        colors: {
          ...baseTheme.colors,
          ...dynamicColors,
        },
      };
    }

    const fallback = isDark ? FALLBACK_COLORS_DARK : FALLBACK_COLORS;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        ...fallback,
      },
    };
  }, [isDark, materialTheme]);

  const value = useMemo(
    () => ({ theme, isDark, themePreference, setThemePreference }),
    [theme, isDark, themePreference, setThemePreference],
  );

  return (
    <ThemeContext.Provider value={value}>
      <PaperProvider theme={theme}>{children}</PaperProvider>
    </ThemeContext.Provider>
  );
}
