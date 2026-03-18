import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';

interface AdaptiveBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function AdaptiveBackground({
  children,
  style,
}: AdaptiveBackgroundProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
