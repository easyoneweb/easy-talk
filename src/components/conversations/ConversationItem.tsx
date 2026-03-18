import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import type { Conversation } from '@/types/api';
import { ConversationType } from '@/types/api';
import { spacing } from '@/theme/spacing';

interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
}

export function ConversationItem({
  conversation,
  onPress,
}: ConversationItemProps) {
  const theme = useTheme();

  const lastMessageText = getLastMessagePreview(conversation);
  const timeText = formatTimestamp(conversation.lastActivity);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && {
          backgroundColor: theme.colors.surfaceVariant,
        },
      ]}
      android_ripple={{ color: theme.colors.surfaceVariant }}
    >
      <View style={styles.avatarContainer}>
        <Avatar
          userId={
            conversation.type === ConversationType.ONE_TO_ONE
              ? conversation.name
              : undefined
          }
          displayName={conversation.displayName}
          conversationType={conversation.type}
          token={conversation.token}
          size={52}
        />
        {conversation.unreadMessages > 0 && (
          <Badge count={conversation.unreadMessages} />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text
            variant="titleMedium"
            numberOfLines={1}
            style={[
              styles.name,
              conversation.unreadMessages > 0 && styles.unreadName,
            ]}
          >
            {conversation.isFavorite ? '★ ' : ''}
            {conversation.displayName}
          </Text>
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {timeText}
          </Text>
        </View>
        <Text
          variant="bodyMedium"
          numberOfLines={1}
          style={[
            styles.preview,
            { color: theme.colors.onSurfaceVariant },
            conversation.unreadMessages > 0 && {
              color: theme.colors.onSurface,
            },
          ]}
        >
          {lastMessageText}
        </Text>
      </View>
    </Pressable>
  );
}

function getLastMessagePreview(conversation: Conversation): string {
  const msg = conversation.lastMessage;
  if (!msg) return '';
  if (msg.systemMessage) return formatSystemMessage(msg.systemMessage);
  const sender =
    msg.actorDisplayName && msg.actorId !== conversation.name
      ? `${msg.actorDisplayName}: `
      : '';
  return `${sender}${msg.message}`;
}

function formatSystemMessage(systemMessage: string): string {
  const messages: Record<string, string> = {
    user_added: 'User was added',
    user_removed: 'User was removed',
    call_started: 'Call started',
    call_ended: 'Call ended',
    conversation_created: 'Conversation created',
  };
  return messages[systemMessage] ?? systemMessage.replace(/_/g, ' ');
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;

  const isThisYear = date.getFullYear() === now.getFullYear();
  if (isThisYear) {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
  });
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    flex: 1,
    marginRight: spacing.sm,
  },
  unreadName: {
    fontWeight: '700',
  },
  preview: {
    marginTop: 2,
  },
});
