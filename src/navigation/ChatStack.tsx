import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';
import { ChatsScreen } from '@/screens/ChatsScreen';
import { ChatWindowScreen } from '@/screens/ChatWindowScreen';
import type { ChatStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<ChatStackParamList>();

const isIOS = Platform.OS === 'ios';

export function ChatStack() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...(isIOS
          ? {
              headerTransparent: true,
              headerBlurEffect: 'regular',
              headerShadowVisible: false,
            }
          : {
              headerStyle: { backgroundColor: theme.colors.surface },
              headerShadowVisible: false,
            }),
        headerTintColor: theme.colors.onSurface,
      }}
    >
      <Stack.Screen
        name="ChatsList"
        component={ChatsScreen}
        options={{ title: 'Chats' }}
      />
      <Stack.Screen
        name="ChatWindow"
        component={ChatWindowScreen}
        options={({ route }) => ({
          title: route.params.displayName,
          ...(isIOS && {
            headerTransparent: false,
            headerBlurEffect: undefined,
            headerStyle: { backgroundColor: theme.colors.background },
          }),
        })}
      />
    </Stack.Navigator>
  );
}
