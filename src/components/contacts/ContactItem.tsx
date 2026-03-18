import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Avatar } from '@/components/common/Avatar';
import type { AutocompleteResult } from '@/types/api';
import { spacing } from '@/theme/spacing';

interface ContactItemProps {
  contact: AutocompleteResult;
  onPress: () => void;
}

export function ContactItem({ contact, onPress }: ContactItemProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && { backgroundColor: theme.colors.surfaceVariant },
      ]}
      android_ripple={{ color: theme.colors.surfaceVariant }}
    >
      <Avatar userId={contact.id} displayName={contact.label} size={44} />
      <View style={styles.content}>
        <Text variant="titleMedium" numberOfLines={1}>
          {contact.label}
        </Text>
        {contact.subline ? (
          <Text
            variant="bodySmall"
            numberOfLines={1}
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {contact.subline}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.md,
  },
  content: {
    flex: 1,
  },
});
