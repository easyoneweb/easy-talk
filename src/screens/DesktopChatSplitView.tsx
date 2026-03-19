import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Searchbar, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ConversationList } from '@/components/conversations/ConversationList';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { useConversations } from '@/hooks/useConversations';
import {
  useMessages,
  useSendMessage,
  useMarkAsRead,
} from '@/hooks/useMessages';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { useLongPolling } from '@/hooks/useLongPolling';
import {
  joinConversation,
  leaveConversation,
  getConversation,
} from '@/api/conversations';
import { useAuthStore } from '@/stores/authStore';
import type { Conversation, Message } from '@/types/api';
import { ConversationType } from '@/types/api';
import { spacing } from '@/theme/spacing';

export function DesktopChatSplitView() {
  const theme = useTheme();
  const userId = useAuthStore((s) => s.userId);

  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [selectedDisplayName, setSelectedDisplayName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: conversations, isLoading, refetch } = useConversations();

  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter((c) =>
      c.displayName.toLowerCase().includes(query),
    );
  }, [conversations, searchQuery]);

  const handleConversationPress = (conversation: Conversation) => {
    setSelectedToken(conversation.token);
    setSelectedDisplayName(conversation.displayName);
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.sidebar,
          {
            backgroundColor: theme.colors.surface,
            borderRightColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <View style={styles.sidebarHeader}>
          <Text variant="titleLarge" style={styles.sidebarTitle}>
            Chats
          </Text>
        </View>
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchbar}
            mode="bar"
          />
        </View>
        <ConversationList
          conversations={filteredConversations}
          onConversationPress={handleConversationPress}
          refreshing={isLoading}
          onRefresh={() => refetch()}
        />
      </View>

      <View style={[styles.main, { backgroundColor: theme.colors.background }]}>
        {selectedToken ? (
          <ChatPanel
            token={selectedToken}
            displayName={selectedDisplayName}
            userId={userId ?? ''}
          />
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="chat-outline"
              size={64}
              color={theme.colors.outlineVariant}
            />
            <Text
              variant="bodyLarge"
              style={{
                color: theme.colors.onSurfaceVariant,
                marginTop: spacing.md,
              }}
            >
              Select a conversation to start chatting
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

interface ChatPanelProps {
  token: string;
  displayName: string;
  userId: string;
}

function ChatPanel({ token, displayName, userId }: ChatPanelProps) {
  const theme = useTheme();
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [conversationType, setConversationType] = useState<ConversationType>(
    ConversationType.ONE_TO_ONE,
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    lastCommonRead,
    updateLastCommonRead,
  } = useMessages(token);
  const sendMessage = useSendMessage(token);
  const markAsRead = useMarkAsRead(token);
  const mediaUpload = useMediaUpload(token);

  const allMessages = useMemo(() => data?.pages.flat() ?? [], [data]);
  const lastKnownMessageId =
    allMessages.length > 0
      ? Math.max(...allMessages.map((m) => m.id))
      : undefined;

  useLongPolling(token, lastKnownMessageId, updateLastCommonRead);

  useEffect(() => {
    joinConversation(token).catch(() => {});
    getConversation(token)
      .then((conv) => setConversationType(conv.type))
      .catch(() => {});

    return () => {
      leaveConversation(token).catch(() => {});
    };
  }, [token]);

  useEffect(() => {
    if (lastKnownMessageId) {
      markAsRead.mutate(lastKnownMessageId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastKnownMessageId]);

  const handleSend = useCallback(
    async (message: string, replyTo?: number) => {
      if (mediaUpload.pendingMedia) {
        const success = await mediaUpload.sendMedia();
        if (success && message) {
          sendMessage.mutate({ message, replyTo });
        }
      } else if (message) {
        sendMessage.mutate({ message, replyTo });
      }
    },
    [sendMessage, mediaUpload],
  );

  const handleMessageLongPress = useCallback((message: Message) => {
    if (message.isReplyable) {
      setReplyingTo(message);
    }
  }, []);

  return (
    <View style={styles.chatPanel}>
      <View
        style={[
          styles.chatHeader,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <Text variant="titleMedium">{displayName}</Text>
      </View>
      <MessageList
        messages={allMessages}
        currentUserId={userId}
        conversationType={conversationType}
        onLoadMore={() => fetchNextPage()}
        hasMoreMessages={!!hasNextPage}
        isLoadingMore={isFetchingNextPage}
        onMessageLongPress={handleMessageLongPress}
        lastCommonRead={lastCommonRead}
      />
      <MessageInput
        onSend={handleSend}
        onPickMedia={mediaUpload.pickFromGallery}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        disabled={sendMessage.isPending || mediaUpload.isUploading}
        pendingMedia={mediaUpload.pendingMedia}
        onCancelMedia={mediaUpload.cancelMedia}
        uploadProgress={mediaUpload.uploadProgress}
        uploadError={mediaUpload.error}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 340,
    borderRightWidth: 1,
  },
  sidebarHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  sidebarTitle: {
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchbar: {
    elevation: 0,
  },
  main: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatPanel: {
    flex: 1,
  },
  chatHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
});
