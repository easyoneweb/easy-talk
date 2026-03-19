import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Text as RNText,
  Dimensions,
  Platform,
} from 'react-native';
import { VideoPlayerModal } from '@/components/chat/VideoPlayerModal';
import { Image } from 'expo-image';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { Message, MessageParameter } from '@/types/api';
import { MessageType } from '@/types/api';
import { useAuthStore } from '@/stores/authStore';
import { spacing, borderRadius } from '@/theme/spacing';

const MEDIA_MAX_WIDTH =
  Platform.OS === 'web' ? 300 : Dimensions.get('window').width * 0.65;
const MEDIA_MAX_HEIGHT = 300;

const IMAGE_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/svg+xml',
];
const VIDEO_MIMETYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/3gpp',
];

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showSender: boolean;
  lastCommonRead?: number | null;
  onLongPress?: () => void;
}

function getFileParams(
  message: Message,
): { key: string; param: MessageParameter }[] {
  if (!message.messageParameters) return [];
  return Object.entries(message.messageParameters)
    .filter(([, param]) => param.type === 'file')
    .map(([key, param]) => ({ key, param }));
}

function isImageMimetype(mimetype: string): boolean {
  return IMAGE_MIMETYPES.includes(mimetype);
}

function isVideoMimetype(mimetype: string): boolean {
  return VIDEO_MIMETYPES.includes(mimetype);
}

function getFilePreviewUrl(
  serverUrl: string,
  fileId: string,
  width = 400,
  height = 400,
): string {
  return `${serverUrl}/index.php/core/preview?fileId=${fileId}&x=${width}&y=${height}&a=1&forceIcon=0&mimeFallback=0`;
}

function getFileDownloadUrl(
  serverUrl: string,
  userId: string,
  param: MessageParameter,
): string {
  // Use WebDAV path for raw file download
  const filePath = param.path as string | undefined;
  if (filePath) {
    const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    return `${serverUrl}/remote.php/dav/files/${userId}${encodeURI(normalizedPath)}`;
  }
  return `${serverUrl}/remote.php/dav/files/${userId}/${encodeURIComponent(param.name)}`;
}

function MediaAttachment({
  param,
  serverUrl,
  userId,
  credentials,
}: {
  param: MessageParameter;
  serverUrl: string;
  userId: string;
  credentials: string;
}) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);

  const mimetype = (param.mimetype as string) ?? '';
  const fileId = String(param.id);
  const fileName = param.name ?? 'file';

  const authHeaders = { Authorization: `Basic ${credentials}` };

  const handleLoadEnd = useCallback(() => setLoading(false), []);
  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  if (isImageMimetype(mimetype)) {
    // For GIFs, download the raw file via WebDAV so expo-image can animate it.
    // The Nextcloud preview API always returns a static thumbnail.
    const isGif = mimetype === 'image/gif';
    const imageUrl = isGif
      ? getFileDownloadUrl(serverUrl, userId, param)
      : getFilePreviewUrl(serverUrl, fileId);

    if (error) {
      return (
        <View style={styles.mediaFallback}>
          <MaterialCommunityIcons
            name="image-broken-variant"
            size={32}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {fileName}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.mediaContainer}>
        {loading && (
          <View style={styles.mediaLoader}>
            <ActivityIndicator size="small" />
          </View>
        )}
        <Image
          source={{ uri: imageUrl, headers: authHeaders }}
          style={styles.mediaImage}
          contentFit="contain"
          autoplay={true}
          onLoad={handleLoadEnd}
          onError={handleError}
        />
      </View>
    );
  }

  if (isVideoMimetype(mimetype)) {
    const previewUrl = getFilePreviewUrl(serverUrl, fileId);
    const downloadUrl = getFileDownloadUrl(serverUrl, userId, param);

    return (
      <>
        <Pressable
          style={styles.mediaContainer}
          onPress={() => setVideoModalVisible(true)}
        >
          {loading && (
            <View style={styles.mediaLoader}>
              <ActivityIndicator size="small" />
            </View>
          )}
          <Image
            source={{ uri: previewUrl, headers: authHeaders }}
            style={styles.mediaImage}
            contentFit="cover"
            onLoad={handleLoadEnd}
            onError={handleError}
          />
          <View style={styles.playOverlay}>
            <MaterialCommunityIcons
              name="play-circle"
              size={48}
              color="rgba(255,255,255,0.9)"
            />
          </View>
        </Pressable>
        <VideoPlayerModal
          visible={videoModalVisible}
          onClose={() => setVideoModalVisible(false)}
          videoUrl={downloadUrl}
          authHeaders={authHeaders}
          fileName={fileName}
        />
      </>
    );
  }

  // Non-media file: show as download-like attachment
  return (
    <View style={styles.fileAttachment}>
      <MaterialCommunityIcons
        name="file-outline"
        size={24}
        color={theme.colors.primary}
      />
      <Text
        variant="bodySmall"
        numberOfLines={2}
        style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}
      >
        {fileName}
      </Text>
    </View>
  );
}

export function MessageBubble({
  message,
  isOwn,
  showSender,
  lastCommonRead,
  onLongPress,
}: MessageBubbleProps) {
  const theme = useTheme();
  const { serverUrl, userId, appPassword } = useAuthStore();

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

  const fileParams = getFileParams(message);
  const hasFiles = fileParams.length > 0;
  const messageText = parseMessageText(message);
  // If message is only a file placeholder like "{file}", don't show text
  const isFileOnlyMessage =
    hasFiles && /^\s*\{[a-zA-Z0-9]+\}\s*$/.test(message.message.trim());
  const credentials = btoa(`${userId}:${appPassword}`);

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
          hasFiles && styles.bubbleWithMedia,
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

        {hasFiles &&
          fileParams.map(({ key, param }) => (
            <MediaAttachment
              key={key}
              param={param}
              serverUrl={serverUrl}
              userId={userId}
              credentials={credentials}
            />
          ))}

        {!isFileOnlyMessage && (
          <RNText style={[styles.messageText, { color: textColor }]}>
            {messageText}
          </RNText>
        )}

        <View style={styles.timeRow}>
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
          {isOwn && (
            <MaterialCommunityIcons
              name={
                lastCommonRead != null && message.id <= lastCommonRead
                  ? 'check-all'
                  : 'check'
              }
              size={14}
              color={
                lastCommonRead != null && message.id <= lastCommonRead
                  ? theme.colors.primary
                  : theme.colors.onPrimaryContainer
              }
              style={styles.checkIcon}
            />
          )}
        </View>
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
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
    gap: 3,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    // Explicit system font ensures emoji fallback works on iOS when custom
    // icon fonts (MaterialCommunityIcons) are registered via the podspec.
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  time: {},
  checkIcon: {
    opacity: 0.7,
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
  bubbleWithMedia: {
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
  },
  mediaContainer: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    maxWidth: MEDIA_MAX_WIDTH,
    maxHeight: MEDIA_MAX_HEIGHT,
    marginBottom: spacing.xs,
  },
  mediaImage: {
    width: MEDIA_MAX_WIDTH,
    height: MEDIA_MAX_HEIGHT * 0.75,
    borderRadius: borderRadius.md,
  },
  mediaLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  mediaFallback: {
    width: MEDIA_MAX_WIDTH,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(128,128,128,0.1)',
    marginBottom: spacing.xs,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
});
