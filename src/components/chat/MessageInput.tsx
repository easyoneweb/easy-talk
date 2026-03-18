import React, { useState } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { IconButton, TextInput, Text, useTheme } from 'react-native-paper';
import type { Message } from '@/types/api';
import { spacing } from '@/theme/spacing';
import { MESSAGES } from '@/config/constants';

interface MessageInputProps {
  onSend: (message: string, replyTo?: number) => void;
  replyingTo: Message | null;
  onCancelReply: () => void;
  disabled?: boolean;
}

export function MessageInput({
  onSend,
  replyingTo,
  onCancelReply,
  disabled,
}: MessageInputProps) {
  const theme = useTheme();
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed, replyingTo?.id);
    setText('');
    onCancelReply();
  };

  return (
    <View
      style={[
        styles.container,
        { borderTopColor: theme.colors.outlineVariant },
      ]}
    >
      {replyingTo && (
        <View
          style={[
            styles.replyBar,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderLeftColor: theme.colors.primary,
            },
          ]}
        >
          <View style={styles.replyContent}>
            <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
              {replyingTo.actorDisplayName}
            </Text>
            <Text
              variant="bodySmall"
              numberOfLines={1}
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {replyingTo.message}
            </Text>
          </View>
          <IconButton icon="close" size={16} onPress={onCancelReply} />
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          multiline
          numberOfLines={MESSAGES.MAX_INPUT_LINES}
          style={styles.input}
          mode={Platform.OS === 'android' ? 'outlined' : 'flat'}
          dense
          disabled={disabled}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <IconButton
          icon="send"
          mode="contained"
          onPress={handleSend}
          disabled={!text.trim() || disabled}
          iconColor={theme.colors.onPrimary}
          containerColor={theme.colors.primary}
          size={20}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    marginHorizontal: spacing.sm,
    marginTop: spacing.xs,
    paddingLeft: spacing.sm,
    borderRadius: 4,
  },
  replyContent: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    maxHeight: 120,
  },
});
