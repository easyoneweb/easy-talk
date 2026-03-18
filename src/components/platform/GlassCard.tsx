import React from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { Surface } from 'react-native-paper';
import { useAppTheme } from '@/theme/ThemeProvider';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

let LiquidGlassView: React.ComponentType<any> | null = null;
let isLiquidGlassSupported = false;

let BlurView: React.ComponentType<any> | null = null;

if (Platform.OS === 'ios') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const liquidGlass = require('@callstack/liquid-glass');
    LiquidGlassView = liquidGlass.LiquidGlassView;
    isLiquidGlassSupported = liquidGlass.isLiquidGlassSupported ?? false;
  } catch {
    // Liquid Glass not available
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const blur = require('@react-native-community/blur');
    BlurView = blur.BlurView;
  } catch {
    // Blur not available
  }
}

export function GlassCard({ children, style }: GlassCardProps) {
  const { isDark } = useAppTheme();

  if (Platform.OS === 'ios') {
    if (isLiquidGlassSupported && LiquidGlassView) {
      return (
        <LiquidGlassView style={[styles.card, style]}>
          {children}
        </LiquidGlassView>
      );
    }

    if (BlurView) {
      return (
        <View style={[styles.card, style]}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType={isDark ? 'systemThinMaterialDark' : 'systemThinMaterial'}
            blurAmount={20}
            reducedTransparencyFallbackColor={isDark ? '#1c1c1e' : '#f2f2f7'}
          />
          <View style={styles.blurContent} pointerEvents="box-none">
            {children}
          </View>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark
              ? 'rgba(28, 28, 30, 0.8)'
              : 'rgba(242, 242, 247, 0.8)',
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

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
  blurContent: {
    position: 'relative',
  },
});
