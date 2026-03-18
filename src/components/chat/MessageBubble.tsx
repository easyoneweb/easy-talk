import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { Message } from '@/types/api';
import { MessageType } from '@/types/api';
import { spacing, borderRadius } from '@/theme/spacing';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showSender: boolean;
  onLongPress?: () => void;
}

export function MessageBubble({
  message,
  isOwn,
  showSender,
  onLongPress,
}: MessageBubbleProps) {
  const theme = useTheme();

  if (message.messageType === MessageType.SYSTEM || message.systemMessage) {
    return (
      <View style={styles.systemContainer}>
        <Text
          variant="labelSmall"
          style={[styles.systemText, { color: theme.colors.onSurfaceVariant }]}
        >
          {parseMessageText(message)}
        </Text>
      </View>
    );
  }

  const bubbleColor = isOwn
    ? theme.colors.primaryContainer
    : theme.colors.surfaceVariant;
  const textColor = isOwn
    ? theme.colors.onPrimaryContainer
    : theme.colors.onSurfaceVariant;

  return (
    <View
      style={[styles.wrapper, isOwn ? styles.wrapperOwn : styles.wrapperOther]}
    >
      <Pressable
        onLongPress={onLongPress}
        style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
          { backgroundColor: bubbleColor },
        ]}
      >
        {showSender && !isOwn && (
          <Text
            variant="labelMedium"
            style={[styles.sender, { color: theme.colors.primary }]}
          >
            {message.actorDisplayName}
          </Text>
        )}

        {message.replyTo && (
          <View
            style={[
              styles.replyPreview,
              { borderLeftColor: theme.colors.primary },
            ]}
          >
            <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
              {message.replyTo.actorDisplayName}
            </Text>
            <Text
              variant="bodySmall"
              numberOfLines={1}
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {message.replyTo.message}
            </Text>
          </View>
        )}

        <Text variant="bodyMedium" style={{ color: textColor }}>
          {parseMessageText(message)}
        </Text>

        <Text
          variant="labelSmall"
          style={[
            styles.time,
            {
              color: isOwn
                ? theme.colors.onPrimaryContainer
                : theme.colors.onSurfaceVariant,
              opacity: 0.7,
            },
          ]}
        >
          {formatMessageTime(message.timestamp)}
        </Text>
      </Pressable>
    </View>
  );
}

function parseMessageText(message: Message): string {
  let text = message.message;
  if (message.messageParameters) {
    for (const [key, param] of Object.entries(message.messageParameters)) {
      text = text.replace(`{${key}}`, param.name ?? String(param.id));
    }
  }
  return text;
}

function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs / 2,
    maxWidth: '100%',
  },
  wrapperOwn: {
    alignItems: 'flex-end',
  },
  wrapperOther: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  bubbleOwn: {
    borderBottomRightRadius: borderRadius.sm / 2,
  },
  bubbleOther: {
    borderBottomLeftRadius: borderRadius.sm / 2,
  },
  sender: {
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  replyPreview: {
    borderLeftWidth: 2,
    paddingLeft: spacing.sm,
    marginBottom: spacing.xs,
    paddingVertical: spacing.xs / 2,
  },
  time: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  systemContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  systemText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
