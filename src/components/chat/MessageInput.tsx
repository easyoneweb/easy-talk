import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  TextInput as RNTextInput,
  ActionSheetIOS,
} from 'react-native';
import { Image } from 'expo-image';
import { IconButton, ProgressBar, Text, useTheme } from 'react-native-paper';
import { useAppTheme } from '@/theme/ThemeProvider';
import type { Message } from '@/types/api';
import type { MediaFile } from '@/api/fileSharing';
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
  onPickMedia: () => void;
  onPickCamera?: () => void;
  replyingTo: Message | null;
  onCancelReply: () => void;
  disabled?: boolean;
  pendingMedia: MediaFile | null;
  onCancelMedia: () => void;
  uploadProgress: number | null;
  uploadError: string | null;
}

export function MessageInput({
  onSend,
  onPickMedia,
  onPickCamera,
  replyingTo,
  onCancelReply,
  disabled,
  pendingMedia,
  onCancelMedia,
  uploadProgress,
  uploadError,
}: MessageInputProps) {
  const theme = useTheme();
  const { isDark } = useAppTheme();
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && !pendingMedia) return;
    onSend(trimmed, replyingTo?.id);
    setText('');
    onCancelReply();
  };

  const handleAttachPress = () => {
    if (Platform.OS === 'ios' && onPickCamera) {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Photo Library', 'Camera'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) onPickMedia();
          else if (buttonIndex === 2) onPickCamera();
        },
      );
    } else if (Platform.OS === 'android' && onPickCamera) {
      // On Android, use a simple two-tap: first tap opens gallery,
      // long-press could open camera (but for simplicity, we show gallery
      // and add camera as a separate icon if needed).
      // For now, directly open gallery. Camera available via dedicated button.
      onPickMedia();
    } else {
      onPickMedia();
    }
  };

  const canSend = (text.trim().length > 0 || !!pendingMedia) && !disabled;

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

  const mediaPreview = pendingMedia ? (
    <View
      style={[
        styles.mediaPreview,
        {
          backgroundColor:
            Platform.OS === 'ios'
              ? 'rgba(118, 118, 128, 0.12)'
              : theme.colors.surfaceVariant,
        },
      ]}
    >
      <View style={styles.mediaThumbnailContainer}>
        <Image
          source={{ uri: pendingMedia.uri }}
          style={styles.mediaThumbnail}
          contentFit="cover"
        />
        {uploadProgress !== null && (
          <View style={styles.progressOverlay}>
            <ProgressBar
              progress={uploadProgress}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
          </View>
        )}
      </View>
      <Text
        variant="bodySmall"
        numberOfLines={1}
        style={[styles.mediaFileName, { color: theme.colors.onSurfaceVariant }]}
      >
        {pendingMedia.fileName}
      </Text>
      <IconButton
        icon="close"
        size={16}
        onPress={onCancelMedia}
        disabled={uploadProgress !== null}
      />
    </View>
  ) : null;

  const errorBar = uploadError ? (
    <View style={styles.errorBar}>
      <Text
        variant="labelSmall"
        style={{ color: theme.colors.error }}
        numberOfLines={1}
      >
        {uploadError}
      </Text>
    </View>
  ) : null;

  // iOS: native TextInput with iMessage-style rounded field + glass/blur background
  if (Platform.OS === 'ios') {
    const iosInputContent = (
      <>
        {replyBar}
        {mediaPreview}
        {errorBar}
        <View style={styles.inputRow}>
          <IconButton
            icon="plus"
            size={22}
            onPress={handleAttachPress}
            disabled={disabled || uploadProgress !== null}
            style={styles.attachButton}
          />
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
          {onPickCamera && !pendingMedia && (
            <IconButton
              icon="camera"
              size={20}
              onPress={onPickCamera}
              disabled={disabled || uploadProgress !== null}
              style={styles.cameraButton}
            />
          )}
          <IconButton
            icon="arrow-up-circle"
            mode="contained"
            onPress={handleSend}
            disabled={!canSend}
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

  // Android / Web / Desktop: Material Design input
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
      {mediaPreview}
      {errorBar}
      <View style={styles.inputRow}>
        <IconButton
          icon="paperclip"
          size={22}
          onPress={handleAttachPress}
          disabled={disabled || uploadProgress !== null}
          style={styles.attachButton}
        />
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
            numberOfLines={Platform.OS === 'web' ? 1 : MESSAGES.MAX_INPUT_LINES}
            style={[styles.androidInput, { color: theme.colors.onSurface }]}
            editable={!disabled}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            textAlignVertical="center"
          />
        </View>
        {onPickCamera && !pendingMedia && (
          <IconButton
            icon="camera"
            size={20}
            onPress={onPickCamera}
            disabled={disabled || uploadProgress !== null}
          />
        )}
        <IconButton
          icon="send"
          mode="contained"
          onPress={handleSend}
          disabled={!canSend}
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
  attachButton: {
    margin: 0,
    marginRight: 2,
  },
  cameraButton: {
    margin: 0,
    marginLeft: 2,
  },
  mediaPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: 8,
    paddingLeft: spacing.xs,
    paddingVertical: spacing.xs,
  },
  mediaThumbnailContainer: {
    width: 48,
    height: 48,
    borderRadius: 6,
    overflow: 'hidden',
  },
  mediaThumbnail: {
    width: 48,
    height: 48,
  },
  progressOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  progressBar: {
    height: 4,
    borderRadius: 0,
  },
  mediaFileName: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  errorBar: {
    marginHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
});
