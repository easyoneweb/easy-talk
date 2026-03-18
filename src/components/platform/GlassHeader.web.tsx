import React from 'react';
import { Appbar } from 'react-native-paper';

interface GlassHeaderProps {
  title: string;
  onBack?: () => void;
  rightActions?: {
    icon: string;
    onPress: () => void;
  }[];
}

export function GlassHeader({ title, onBack, rightActions }: GlassHeaderProps) {
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
