import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { MessageBubble } from './MessageBubble';
import type { Message } from '@/types/api';
import { ConversationType } from '@/types/api';
import { spacing } from '@/theme/spacing';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  conversationType: ConversationType;
  onLoadMore: () => void;
  hasMoreMessages: boolean;
  isLoadingMore: boolean;
  onMessageLongPress?: (message: Message) => void;
  lastCommonRead?: number | null;
}

export function MessageList({
  messages,
  currentUserId,
  conversationType,
  onLoadMore,
  hasMoreMessages,
  isLoadingMore,
  onMessageLongPress,
  lastCommonRead,
}: MessageListProps) {
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const isGroupChat =
    conversationType === ConversationType.GROUP ||
    conversationType === ConversationType.PUBLIC;

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = event.nativeEvent.contentOffset.y;
      setShowScrollButton(offset > 300);
    },
    [],
  );

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const messagesWithDates = useMemo(() => {
    const result: (
      | { type: 'message'; data: Message }
      | { type: 'date'; date: string }
    )[] = [];
    let lastDate = '';

    // Messages are in reverse order (newest first) due to inverted list
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const date = new Date(msg.timestamp * 1000).toLocaleDateString();

      if (date !== lastDate) {
        result.push({ type: 'date', date });
        lastDate = date;
      }
      result.push({ type: 'message', data: msg });
    }

    return result.reverse();
  }, [messages]);

  const renderItem = useCallback(
    ({ item }: { item: (typeof messagesWithDates)[0] }) => {
      if (item.type === 'date') {
        return (
          <View style={styles.dateHeader}>
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {formatDateHeader(item.date)}
            </Text>
          </View>
        );
      }

      const message = item.data;
      const isOwn = message.actorId === currentUserId;

      return (
        <MessageBubble
          message={message}
          isOwn={isOwn}
          showSender={isGroupChat}
          lastCommonRead={lastCommonRead}
          onLongPress={() => onMessageLongPress?.(message)}
        />
      );
    },
    [currentUserId, isGroupChat, theme, onMessageLongPress, lastCommonRead],
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messagesWithDates}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item.type === 'date' ? `date-${item.date}` : `msg-${item.data.id}`
        }
        inverted
        onEndReached={hasMoreMessages ? onLoadMore : undefined}
        onEndReachedThreshold={0.5}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        contentContainerStyle={styles.content}
      />

      {showScrollButton && (
        <IconButton
          icon="chevron-down"
          mode="contained"
          onPress={scrollToBottom}
          style={[
            styles.scrollButton,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
          iconColor={theme.colors.onPrimaryContainer}
          size={20}
        />
      )}
    </View>
  );
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: spacing.sm,
  },
  dateHeader: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  scrollButton: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
  },
});
