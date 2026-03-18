import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import {
  useMessages,
  useSendMessage,
  useMarkAsRead,
} from '@/hooks/useMessages';
import { useLongPolling } from '@/hooks/useLongPolling';
import {
  joinConversation,
  leaveConversation,
  getConversation,
} from '@/api/conversations';
import { useAuthStore } from '@/stores/authStore';
import type { ChatStackParamList } from '@/types/navigation';
import type { Message } from '@/types/api';
import { ConversationType } from '@/types/api';

type Props = NativeStackScreenProps<ChatStackParamList, 'ChatWindow'>;

export function ChatWindowScreen({ route, navigation }: Props) {
  const { token, displayName } = route.params;
  const theme = useTheme();
  const userId = useAuthStore((s) => s.userId);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [conversationType, setConversationType] = useState<ConversationType>(
    ConversationType.ONE_TO_ONE,
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMessages(token);

  const sendMessage = useSendMessage(token);
  const markAsRead = useMarkAsRead(token);

  const allMessages = useMemo(() => data?.pages.flat() ?? [], [data]);

  const lastKnownMessageId =
    allMessages.length > 0
      ? Math.max(...allMessages.map((m) => m.id))
      : undefined;

  useLongPolling(token, lastKnownMessageId);

  useEffect(() => {
    navigation.setOptions({ title: displayName });
  }, [displayName, navigation]);

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
    (message: string, replyTo?: number) => {
      sendMessage.mutate({ message, replyTo });
    },
    [sendMessage],
  );

  const handleMessageLongPress = useCallback((message: Message) => {
    if (message.isReplyable) {
      setReplyingTo(message);
    }
  }, []);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <MessageList
        messages={allMessages}
        currentUserId={userId}
        conversationType={conversationType}
        onLoadMore={() => fetchNextPage()}
        hasMoreMessages={!!hasNextPage}
        isLoadingMore={isFetchingNextPage}
        onMessageLongPress={handleMessageLongPress}
      />
      <MessageInput
        onSend={handleSend}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        disabled={sendMessage.isPending}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
