import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import { Surface } from 'react-native-paper';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GlassCard({ children, style }: GlassCardProps) {
  return (
    <Surface style={[styles.card, style]} elevation={1}>
      {children}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});
