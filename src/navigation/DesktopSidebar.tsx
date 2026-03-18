import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { DesktopChatSplitView } from '@/screens/DesktopChatSplitView';
import { ContactsScreen } from '@/screens/ContactsScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import type { MainTabParamList } from '@/types/navigation';

const Drawer = createDrawerNavigator<MainTabParamList>();

export function DesktopSidebar() {
  const theme = useTheme();

  return (
    <Drawer.Navigator
      screenOptions={{
        drawerType: 'permanent',
        drawerStyle: {
          width: 240,
          backgroundColor: theme.colors.surface,
          borderRightColor: theme.colors.outlineVariant,
          borderRightWidth: 1,
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.onSurfaceVariant,
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
        headerLeft: () => null,
      }}
    >
      <Drawer.Screen
        name="ChatsTab"
        component={DesktopChatSplitView}
        options={{
          title: 'Chats',
          headerShown: false,
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chat" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="ContactsTab"
        component={ContactsScreen}
        options={{
          title: 'Contacts',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="contacts" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}
