import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Divider } from 'react-native-paper';
import { ConversationItem } from './ConversationItem';
import { EmptyState } from '@/components/common/EmptyState';
import type { Conversation } from '@/types/api';

interface ConversationListProps {
  conversations: Conversation[];
  onConversationPress: (conversation: Conversation) => void;
  refreshing: boolean;
  onRefresh: () => void;
}

export function ConversationList({
  conversations,
  onConversationPress,
  refreshing,
  onRefresh,
}: ConversationListProps) {
  if (conversations.length === 0 && !refreshing) {
    return (
      <EmptyState
        icon="chat-outline"
        title="No conversations yet"
        description="Start a new conversation from the Contacts tab"
      />
    );
  }

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.token}
      renderItem={({ item }) => (
        <ConversationItem
          conversation={item}
          onPress={() => onConversationPress(item)}
        />
      )}
      ItemSeparatorComponent={() => <Divider style={styles.divider} />}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={
        conversations.length === 0 ? styles.empty : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    marginLeft: 80,
  },
  empty: {
    flex: 1,
  },
});
