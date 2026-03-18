export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  ChatsTab: undefined;
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
