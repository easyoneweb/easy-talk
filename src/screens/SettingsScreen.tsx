import React from 'react';
import { Platform, StyleSheet, ScrollView, View } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import {
  List,
  Switch,
  Divider,
  Button,
  Text,
  useTheme,
} from 'react-native-paper';
import { Avatar } from '@/components/common/Avatar';
import { AdaptiveBackground } from '@/components/platform/AdaptiveBackground';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { spacing } from '@/theme/spacing';

export function SettingsScreen() {
  const theme = useTheme();
  const headerHeight = useHeaderHeight();
  const { serverUrl, userId, clearCredentials } = useAuthStore();
  const {
    themePreference,
    setThemePreference,
    notificationsEnabled,
    setNotificationsEnabled,
  } = useSettingsStore();

  const themeLabel =
    themePreference === 'system'
      ? 'System'
      : themePreference === 'light'
        ? 'Light'
        : 'Dark';

  const cycleTheme = () => {
    const next =
      themePreference === 'system'
        ? 'light'
        : themePreference === 'light'
          ? 'dark'
          : 'system';
    setThemePreference(next);
  };

  return (
    <AdaptiveBackground
      style={Platform.OS === 'ios' ? { paddingTop: headerHeight } : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <List.Section>
          <List.Subheader>Account</List.Subheader>
          <View style={styles.accountRow}>
            <Avatar userId={userId} displayName={userId} size={64} />
            <View style={styles.accountInfo}>
              <Text variant="titleMedium">{userId}</Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
                numberOfLines={1}
              >
                {serverUrl}
              </Text>
            </View>
          </View>
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Appearance</List.Subheader>
          <List.Item
            title="Theme"
            description={themeLabel}
            left={(props) => <List.Icon {...props} icon="palette" />}
            onPress={cycleTheme}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Notifications</List.Subheader>
          <List.Item
            title="Push notifications"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            )}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>About</List.Subheader>
          <List.Item
            title="Version"
            description="1.0.0"
            left={(props) => <List.Icon {...props} icon="information" />}
          />
        </List.Section>

        <View style={styles.logoutContainer}>
          <Button
            mode="outlined"
            onPress={clearCredentials}
            icon="logout"
            textColor={theme.colors.error}
            style={[styles.logoutButton, { borderColor: theme.colors.error }]}
          >
            Log out
          </Button>
        </View>
      </ScrollView>
    </AdaptiveBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  accountInfo: {
    flex: 1,
  },
  logoutContainer: {
    padding: spacing.xl,
  },
  logoutButton: {
    borderWidth: 1,
  },
});
