import React, { useEffect, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { ThemeProvider, useAppTheme } from '@/theme/ThemeProvider';
import { RootNavigator } from '@/navigation/RootNavigator';
import { useSettingsStore } from '@/stores/settingsStore';
import { loadWebIcons } from '@/utils/loadWebIcons';

loadWebIcons();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000,
    },
  },
});

function AppContent() {
  const { themePreference, setThemePreference, loadSettings } =
    useSettingsStore();

  const [fontsLoaded] = useFonts({
    MaterialCommunityIcons: require('react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf'),
  });

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider
      themePreference={themePreference}
      setThemePreference={setThemePreference}
    >
      <ThemedNavigation />
    </ThemeProvider>
  );
}

function ThemedNavigation() {
  const { theme, isDark } = useAppTheme();

  const navigationTheme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.onSurface,
        border: theme.colors.outlineVariant,
        primary: theme.colors.primary,
        notification: theme.colors.error,
      },
    }),
    [isDark, theme],
  );

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootNavigator />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
