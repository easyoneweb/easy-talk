import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  TextInput as RNTextInput,
} from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { useAppTheme } from '@/theme/ThemeProvider';
import type { Message } from '@/types/api';
import { spacing } from '@/theme/spacing';
import { MESSAGES } from '@/config/constants';

let LiquidGlassView: React.ComponentType<any> | null = null;
let isLiquidGlassSupported = false;
let BlurView: React.ComponentType<any> | null = null;

if (Platform.OS === 'ios') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const liquidGlass = require('@callstack/liquid-glass');
    LiquidGlassView = liquidGlass.LiquidGlassView;
    isLiquidGlassSupported = liquidGlass.isLiquidGlassSupported ?? false;
  } catch {
    // Liquid Glass not available
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const blur = require('@react-native-community/blur');
    BlurView = blur.BlurView;
  } catch {
    // Blur not available
  }
}

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
  const { isDark } = useAppTheme();
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed, replyingTo?.id);
    setText('');
    onCancelReply();
  };

  const replyBar = replyingTo ? (
    <View
      style={[
        styles.replyBar,
        {
          backgroundColor:
            Platform.OS === 'ios'
              ? 'rgba(118, 118, 128, 0.12)'
              : theme.colors.surfaceVariant,
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
  ) : null;

  // iOS: native TextInput with iMessage-style rounded field + glass/blur background
  if (Platform.OS === 'ios') {
    const iosInputContent = (
      <>
        {replyBar}
        <View style={styles.inputRow}>
          <View style={styles.iosInputWrapper}>
            <RNTextInput
              value={text}
              onChangeText={setText}
              placeholder="Type a message..."
              placeholderTextColor={isDark ? '#636366' : '#8E8E93'}
              multiline
              numberOfLines={MESSAGES.MAX_INPUT_LINES}
              style={[
                styles.iosInput,
                { color: isDark ? '#FFFFFF' : '#000000' },
              ]}
              editable={!disabled}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
          </View>
          <IconButton
            icon="arrow-up-circle"
            mode="contained"
            onPress={handleSend}
            disabled={!text.trim() || disabled}
            iconColor="#FFFFFF"
            containerColor={theme.colors.primary}
            size={22}
            style={styles.iosSendButton}
          />
        </View>
      </>
    );

    // Wrap in LiquidGlassView for glass pill background (like tab bar)
    if (isLiquidGlassSupported && LiquidGlassView) {
      return (
        <View style={styles.iosContainer}>
          <LiquidGlassView style={styles.iosGlassPill}>
            {iosInputContent}
          </LiquidGlassView>
        </View>
      );
    }

    // BlurView fallback
    if (BlurView) {
      return (
        <View style={styles.iosContainer}>
          <View style={styles.iosGlassPill}>
            <BlurView
              style={StyleSheet.absoluteFill}
              blurType={isDark ? 'chromeMaterialDark' : 'chromeMaterialLight'}
              blurAmount={30}
              reducedTransparencyFallbackColor={isDark ? '#1c1c1e' : '#f9f9f9'}
            />
            {iosInputContent}
          </View>
        </View>
      );
    }

    // Opaque fallback
    return (
      <View style={styles.iosContainer}>
        <View
          style={[
            styles.iosGlassPill,
            {
              backgroundColor: isDark
                ? 'rgba(28, 28, 30, 0.9)'
                : 'rgba(249, 249, 249, 0.9)',
            },
          ]}
        >
          {iosInputContent}
        </View>
      </View>
    );
  }

  // Android: Material Design input with native TextInput for proper centering
  return (
    <View
      style={[
        styles.androidContainer,
        {
          borderTopColor: theme.colors.outlineVariant,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      {replyBar}
      <View style={styles.inputRow}>
        <View
          style={[
            styles.androidInputWrapper,
            {
              borderColor: theme.colors.outline,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <RNTextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
            multiline
            numberOfLines={MESSAGES.MAX_INPUT_LINES}
            style={[styles.androidInput, { color: theme.colors.onSurface }]}
            editable={!disabled}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            textAlignVertical="center"
          />
        </View>
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
  iosContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  iosGlassPill: {
    borderRadius: 28,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  iosInputWrapper: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 0,
    minHeight: 36,
    justifyContent: 'center',
  },
  iosInput: {
    fontSize: 16,
    lineHeight: 20,
    maxHeight: 120,
    padding: 0,
  },
  iosSendButton: {
    margin: 0,
    marginLeft: 4,
  },
  androidContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    marginHorizontal: spacing.sm,
    marginBottom: spacing.xs,
    paddingLeft: spacing.sm,
    borderRadius: 4,
  },
  replyContent: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: Platform.OS === 'ios' ? 'flex-end' : 'center',
  },
  androidInputWrapper: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  androidInput: {
    fontSize: 16,
    lineHeight: 20,
    maxHeight: 120,
    padding: 0,
    textAlignVertical: 'center',
  },
});
