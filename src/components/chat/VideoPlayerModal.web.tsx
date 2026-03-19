import React, { useRef, useEffect, useState } from 'react';
import { Modal, View, Pressable, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { spacing } from '@/theme/spacing';

interface VideoPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  videoUrl: string;
  authHeaders: Record<string, string>;
  fileName: string;
}

export function VideoPlayerModal({
  visible,
  onClose,
  videoUrl,
  authHeaders,
  fileName,
}: VideoPlayerModalProps) {
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Fetch video with auth headers and create a blob URL
  useEffect(() => {
    if (!visible) {
      if (videoElRef.current) {
        videoElRef.current.pause();
        videoElRef.current.currentTime = 0;
      }
      // Revoke previous blob URL to free memory
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      setError(false);
      return;
    }

    let revoked = false;
    let objectUrl: string | null = null;
    setLoading(true);
    setError(false);

    fetch(videoUrl, { headers: authHeaders })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (revoked) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
        setLoading(false);
      })
      .catch(() => {
        if (revoked) return;
        setLoading(false);
        setError(true);
      });

    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [visible, videoUrl, authHeaders]);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.videoWrapper}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
          {error && (
            <View style={styles.loadingOverlay}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={48}
                color="rgba(255,255,255,0.6)"
              />
              <Text style={styles.errorText}>Failed to load video</Text>
            </View>
          )}
          {blobUrl && (
            // @ts-ignore — react-native-web renders View as div; <video> is a valid DOM child
            <video
              ref={videoElRef}
              src={blobUrl}
              controls
              autoPlay
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                background: '#000',
              }}
            />
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.fileNameText} numberOfLines={1}>
            {fileName}
          </Text>
        </View>

        <Pressable style={styles.closeButton} onPress={onClose}>
          <View style={styles.closeButtonBg}>
            <MaterialCommunityIcons name="close" size={22} color="#fff" />
          </View>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoWrapper: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  errorText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: spacing.sm,
  },
  footer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
  },
  fileNameText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  closeButtonBg: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
