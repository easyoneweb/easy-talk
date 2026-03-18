import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from 'react-native-paper';
import { ChatStack } from './ChatStack';
import { ContactsScreen } from '@/screens/ContactsScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { useAppTheme } from '@/theme/ThemeProvider';
import type { MainTabParamList } from '@/types/navigation';

let LiquidGlassView: React.ComponentType<any> | null = null;
let isLiquidGlassSupported = false;
let BlurView: React.ComponentType<any> | null = null;

if (Platform.OS === 'ios') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const liquidGlass = require('@callstack/liquid-glass');
    LiquidGlassView = liquidGlass.LiquidGlassView;
    isLiquidGlassSupported = liquidGlass.isLiquidGlassSupported ?? false;
  } catch {
    // Liquid Glass not available
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const blur = require('@react-native-community/blur');
    BlurView = blur.BlurView;
  } catch {
    // Blur not available
  }
}

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabBarBackground() {
  const { isDark } = useAppTheme();

  if (isLiquidGlassSupported && LiquidGlassView) {
    return <LiquidGlassView style={StyleSheet.absoluteFill} />;
  }

  if (BlurView) {
    return (
      <View style={StyleSheet.absoluteFill}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType={isDark ? 'chromeMaterialDark' : 'chromeMaterialLight'}
          blurAmount={30}
          reducedTransparencyFallbackColor={isDark ? '#1c1c1e' : '#f2f2f7'}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.tabBarSeparator,
            {
              borderTopColor: isDark
                ? 'rgba(255,255,255,0.15)'
                : 'rgba(0,0,0,0.1)',
            },
          ]}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: isDark
            ? 'rgba(28, 28, 30, 0.94)'
            : 'rgba(249, 249, 249, 0.94)',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
        },
      ]}
    />
  );
}

const isIOS = Platform.OS === 'ios';

export function MainTabs() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: isIOS
          ? '#8E8E93'
          : theme.colors.onSurfaceVariant,
        tabBarStyle: isIOS
          ? {
              position: 'absolute',
              borderTopWidth: 0,
              backgroundColor: 'transparent',
              elevation: 0,
              marginHorizontal: 60,
              marginBottom: 16,
              borderRadius: 28,
              overflow: 'hidden' as const,
              height: 56,
            }
          : {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.outlineVariant,
            },
        ...(isIOS && { tabBarBackground: () => <TabBarBackground /> }),
        ...(isIOS
          ? {
              headerTransparent: true,
              headerBlurEffect: 'systemChromeMaterial',
              headerShadowVisible: false,
            }
          : {
              headerStyle: { backgroundColor: theme.colors.surface },
              headerShadowVisible: false,
            }),
        headerTintColor: theme.colors.onSurface,
      }}
    >
      <Tab.Screen
        name="ChatsTab"
        component={ChatStack}
        options={{
          title: 'Chats',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chat" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ContactsTab"
        component={ContactsScreen}
        options={{
          title: 'Contacts',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-multiple"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarSeparator: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
