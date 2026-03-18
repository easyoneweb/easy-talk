import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { Searchbar, FAB } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ConversationList } from '@/components/conversations/ConversationList';
import { AdaptiveBackground } from '@/components/platform/AdaptiveBackground';
import { useConversations } from '@/hooks/useConversations';
import type { ChatStackParamList } from '@/types/navigation';
import type { Conversation } from '@/types/api';
import { spacing } from '@/theme/spacing';

type NavigationProp = NativeStackNavigationProp<ChatStackParamList>;

export function ChatsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { data: conversations, isLoading, refetch } = useConversations();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter((c) =>
      c.displayName.toLowerCase().includes(query),
    );
  }, [conversations, searchQuery]);

  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate('ChatWindow', {
      token: conversation.token,
      displayName: conversation.displayName,
    });
  };

  return (
    <AdaptiveBackground>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search conversations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchbar}
          mode={Platform.OS === 'android' ? 'bar' : 'view'}
        />
      </View>

      <ConversationList
        conversations={filteredConversations}
        onConversationPress={handleConversationPress}
        refreshing={isLoading}
        onRefresh={() => refetch()}
      />

      {Platform.OS === 'android' && (
        <FAB
          icon="plus"
          onPress={() => {
            // Navigate to contacts to start new conversation
            const parent = navigation.getParent();
            parent?.navigate('ContactsTab');
          }}
          style={styles.fab}
        />
      )}
    </AdaptiveBackground>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchbar: {
    elevation: 0,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
  },
});
