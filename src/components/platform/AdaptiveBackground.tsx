import React from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
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
        {
          backgroundColor:
            Platform.OS === 'ios'
              ? theme.colors.background
              : theme.colors.surface,
        },
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
