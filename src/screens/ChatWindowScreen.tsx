import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  View,
  Keyboard,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import {
  useMessages,
  useSendMessage,
  useMarkAsRead,
} from '@/hooks/useMessages';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { addGifKeyboardListener } from '@/services/gifKeyboard';
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
  const rawTabBarHeight = useBottomTabBarHeight();
  // Fallback to standard tab bar height if hook returns 0
  const tabBarHeight = rawTabBarHeight > 0 ? rawTabBarHeight : 70;

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [conversationType, setConversationType] = useState<ConversationType>(
    ConversationType.ONE_TO_ONE,
  );
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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
  const isUploadingRef = useRef(mediaUpload.isUploading);
  isUploadingRef.current = mediaUpload.isUploading;

  useEffect(() => {
    const unsub = addGifKeyboardListener(
      () => {
        if (!isUploadingRef.current) {
          mediaUpload.startGifLoading();
        }
      },
      (media) => {
        if (!isUploadingRef.current) {
          mediaUpload.setGifMedia(media);
        }
      },
    );
    return unsub;
    // mediaUpload.startGifLoading and setGifMedia are stable (useCallback with no deps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allMessages = useMemo(() => data?.pages.flat() ?? [], [data]);

  const lastKnownMessageId =
    allMessages.length > 0
      ? Math.max(...allMessages.map((m) => m.id))
      : undefined;

  useLongPolling(token, lastKnownMessageId, updateLastCommonRead);

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
    async (message: string, replyTo?: number) => {
      if (mediaUpload.pendingMedia) {
        const success = await mediaUpload.sendMedia();
        // Send text as a separate message if non-empty (Nextcloud file shares
        // create their own system message; captions aren't supported)
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

  // On iOS, the message input floats above the tab bar (both absolutely positioned)
  // The message list gets extra bottom padding to avoid content being hidden behind them
  // When keyboard is open, input moves up above keyboard instead of tab bar
  const inputHeight = 68; // glass pill height including padding
  const iosInputBottom =
    keyboardHeight > 0 ? keyboardHeight : tabBarHeight + 16;
  const bottomInset =
    Platform.OS === 'ios'
      ? keyboardHeight > 0
        ? inputHeight + 16
        : tabBarHeight + inputHeight + 16
      : 0;

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
        lastCommonRead={lastCommonRead}
        contentPaddingBottom={bottomInset}
      />
      {Platform.OS === 'ios' ? (
        <View style={[styles.iosInputOverlay, { bottom: iosInputBottom }]}>
          <MessageInput
            onSend={handleSend}
            onPickMedia={mediaUpload.pickFromGallery}
            onPickCamera={mediaUpload.pickFromCamera}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            disabled={sendMessage.isPending || mediaUpload.isUploading}
            pendingMedia={mediaUpload.pendingMedia}
            onCancelMedia={mediaUpload.cancelMedia}
            uploadProgress={mediaUpload.uploadProgress}
            uploadError={mediaUpload.error}
            isGifLoading={mediaUpload.isGifLoading}
          />
        </View>
      ) : (
        <View
          style={{
            paddingBottom: Math.max(keyboardHeight - tabBarHeight + 24, 0),
          }}
        >
          <MessageInput
            onSend={handleSend}
            onPickMedia={mediaUpload.pickFromGallery}
            onPickCamera={mediaUpload.pickFromCamera}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            disabled={sendMessage.isPending || mediaUpload.isUploading}
            pendingMedia={mediaUpload.pendingMedia}
            onCancelMedia={mediaUpload.cancelMedia}
            uploadProgress={mediaUpload.uploadProgress}
            uploadError={mediaUpload.error}
            isGifLoading={mediaUpload.isGifLoading}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iosInputOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
