import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';
import { ChatsScreen } from '@/screens/ChatsScreen';
import { ChatWindowScreen } from '@/screens/ChatWindowScreen';
import type { ChatStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<ChatStackParamList>();

export function ChatStack() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
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
        })}
      />
    </Stack.Navigator>
  );
}
