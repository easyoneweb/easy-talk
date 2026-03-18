import React from 'react';
import { Badge as PaperBadge } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';

interface BadgeProps {
  count: number;
  visible?: boolean;
}

export function Badge({ count, visible = true }: BadgeProps) {
  if (!visible || count <= 0) return null;

  return (
    <View style={styles.container}>
      <PaperBadge>{count > 99 ? '99+' : count}</PaperBadge>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
});
