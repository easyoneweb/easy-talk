import React, { useState } from 'react';
import { StyleSheet, View, Image, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useAuthStore } from '@/stores/authStore';
import { API_PATHS } from '@/config/constants';
import { ConversationType } from '@/types/api';

interface AvatarProps {
  userId?: string;
  displayName: string;
  conversationType?: ConversationType;
  size?: number;
  token?: string;
}

export function Avatar({
  userId,
  displayName,
  conversationType,
  size = 48,
  token,
}: AvatarProps) {
  const theme = useTheme();
  const { serverUrl } = useAuthStore();
  const [imageError, setImageError] = useState(false);

  const initials = getInitials(displayName);
  const bgColor = getColorForName(displayName, theme.colors.primary);

  const avatarUrl = getAvatarUrl(serverUrl, userId, conversationType, token);

  if (avatarUrl && !imageError) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
        },
      ]}
    >
      <Text
        style={[styles.initials, { fontSize: size * 0.4, color: '#FFFFFF' }]}
      >
        {initials}
      </Text>
    </View>
  );
}

function getAvatarUrl(
  serverUrl: string,
  userId?: string,
  conversationType?: ConversationType,
  token?: string,
): string | null {
  if (!serverUrl) return null;

  if (
    conversationType === ConversationType.GROUP ||
    conversationType === ConversationType.PUBLIC
  ) {
    if (token) {
      return `${serverUrl}/index.php/avatar/room/${token}/128`;
    }
    return null;
  }

  if (userId) {
    return `${serverUrl}${API_PATHS.AVATAR}/${userId}/128`;
  }
  return null;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (name[0] ?? '?').toUpperCase();
}

function getColorForName(name: string, fallback: string): string {
  const colors = [
    '#E91E63',
    '#9C27B0',
    '#673AB7',
    '#3F51B5',
    '#2196F3',
    '#00BCD4',
    '#009688',
    '#4CAF50',
    '#FF9800',
    '#FF5722',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length] ?? fallback;
}

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '600',
  },
});
