import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';

interface GlassHeaderProps {
  title: string;
  onBack?: () => void;
  rightActions?: {
    icon: string;
    onPress: () => void;
  }[];
}

export function GlassHeader({ title, onBack, rightActions }: GlassHeaderProps) {
  const theme = useTheme();

  if (Platform.OS === 'ios') {
    return (
      <View
        style={[
          styles.iosHeader,
          { borderBottomColor: theme.colors.outlineVariant },
        ]}
      >
        <Appbar.Header
          style={[styles.appbar, { backgroundColor: 'transparent' }]}
          statusBarHeight={0}
        >
          {onBack && <Appbar.BackAction onPress={onBack} />}
          <Appbar.Content title={title} />
          {rightActions?.map((action, index) => (
            <Appbar.Action
              key={index}
              icon={action.icon}
              onPress={action.onPress}
            />
          ))}
        </Appbar.Header>
      </View>
    );
  }

  return (
    <Appbar.Header>
      {onBack && <Appbar.BackAction onPress={onBack} />}
      <Appbar.Content title={title} />
      {rightActions?.map((action, index) => (
        <Appbar.Action
          key={index}
          icon={action.icon}
          onPress={action.onPress}
        />
      ))}
    </Appbar.Header>
  );
}

const styles = StyleSheet.create({
  iosHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  appbar: {
    elevation: 0,
  },
});
