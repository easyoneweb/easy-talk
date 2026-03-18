import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  ChatsTab: NavigatorScreenParams<ChatStackParamList> | undefined;
  ContactsTab: undefined;
  SettingsTab: undefined;
};

export type ChatStackParamList = {
  ChatsList: undefined;
  ChatWindow: {
    token: string;
    displayName: string;
  };
};
