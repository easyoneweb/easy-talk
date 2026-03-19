import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Modal, View, Pressable, StyleSheet, Platform } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { VideoView, useVideoPlayer } from 'expo-video';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { spacing } from '@/theme/spacing';

interface VideoPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  videoUrl: string;
  authHeaders: Record<string, string>;
  fileName: string;
}

function formatDuration(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function VideoPlayerModal({
  visible,
  onClose,
  videoUrl,
  authHeaders,
  fileName,
}: VideoPlayerModalProps) {
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackWidthRef = useRef(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const player = useVideoPlayer(
    { uri: videoUrl, headers: authHeaders },
    (p) => {
      p.timeUpdateEventInterval = 0.25;
    },
  );

  // Subscribe to player events
  useEffect(() => {
    const playingSub = player.addListener(
      'playingChange',
      ({ isPlaying: playing }) => {
        setIsPlaying(playing);
      },
    );
    const timeSub = player.addListener(
      'timeUpdate',
      ({ currentTime: t, bufferedPosition }) => {
        setCurrentTime(t);
        // bufferedPosition > 0 means we have data, no longer loading initial buffer
        if (bufferedPosition > 0) setIsLoading(false);
      },
    );
    const statusSub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') setIsLoading(false);
      if (status === 'loading') setIsLoading(true);
    });
    const sourceSub = player.addListener('sourceLoad', ({ duration: d }) => {
      setDuration(d);
      setIsLoading(false);
    });
    const endSub = player.addListener('playToEnd', () => {
      setIsPlaying(false);
      setIsControlsVisible(true);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    });

    return () => {
      playingSub.remove();
      timeSub.remove();
      statusSub.remove();
      sourceSub.remove();
      endSub.remove();
    };
  }, [player]);

  const showControls = useCallback(() => {
    setIsControlsVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(
      () => setIsControlsVisible(false),
      3000,
    );
  }, []);

  useEffect(() => {
    if (!visible) {
      player.pause();
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setIsLoading(true);
      setIsControlsVisible(true);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    } else {
      player.play();
      showControls();
    }
  }, [visible, player, showControls]);

  useEffect(() => {
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);

  const togglePlayPause = useCallback(() => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
    showControls();
  }, [player, showControls]);

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    player.muted = newMuted;
    showControls();
  }, [isMuted, player, showControls]);

  const handleVideoPress = useCallback(() => {
    showControls();
  }, [showControls]);

  const fraction = duration > 0 ? currentTime / duration : 0;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Pressable style={styles.videoWrapper} onPress={handleVideoPress}>
          <VideoView
            player={player}
            style={styles.video}
            contentFit="contain"
            nativeControls={false}
          />
          {isLoading && (
            <View style={styles.bufferingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
        </Pressable>

        {/* Close button — always visible */}
        <Pressable style={styles.closeButton} onPress={onClose} hitSlop={12}>
          <View style={styles.closeButtonBg}>
            <MaterialCommunityIcons name="close" size={22} color="#fff" />
          </View>
        </Pressable>

        {/* Controls overlay — auto-hides */}
        {isControlsVisible && (
          <View style={styles.controls}>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatDuration(currentTime)}</Text>
              <Text style={styles.timeText}>{formatDuration(duration)}</Text>
            </View>

            {/* Progress track */}
            <View
              style={styles.trackContainer}
              onLayout={(e) => {
                trackWidthRef.current = e.nativeEvent.layout.width;
              }}
              onStartShouldSetResponder={() => true}
              onResponderGrant={(e) => {
                if (trackWidthRef.current > 0 && duration > 0) {
                  const frac = Math.max(
                    0,
                    Math.min(
                      1,
                      e.nativeEvent.locationX / trackWidthRef.current,
                    ),
                  );
                  player.currentTime = frac * duration;
                  showControls();
                }
              }}
            >
              <View style={styles.track}>
                <View
                  style={[
                    styles.trackFill,
                    { width: `${fraction * 100}%` as unknown as number },
                  ]}
                />
                <View
                  style={[
                    styles.trackThumb,
                    { left: `${fraction * 100}%` as unknown as number },
                  ]}
                />
              </View>
            </View>

            {/* Play/Pause + Mute */}
            <View style={styles.buttonsRow}>
              <Pressable onPress={togglePlayPause} hitSlop={10}>
                <MaterialCommunityIcons
                  name={isPlaying ? 'pause' : 'play'}
                  size={32}
                  color="#fff"
                />
              </Pressable>
              <Text style={styles.fileNameText} numberOfLines={1}>
                {fileName}
              </Text>
              <Pressable onPress={toggleMute} hitSlop={10}>
                <MaterialCommunityIcons
                  name={isMuted ? 'volume-off' : 'volume-high'}
                  size={28}
                  color="#fff"
                />
              </Pressable>
            </View>
          </View>
        )}
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
  video: {
    flex: 1,
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 16,
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
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 36 : spacing.md,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  trackContainer: {
    paddingVertical: 10,
    marginBottom: 4,
  },
  track: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  trackFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  trackThumb: {
    position: 'absolute',
    top: -5,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#fff',
    marginLeft: -6.5,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  fileNameText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
});
