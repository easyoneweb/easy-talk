import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import { initiateLoginFlow, pollForCredentials } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { reconfigureApiClient } from '@/api/client';
import { POLLING } from '@/config/constants';
import { spacing } from '@/theme/spacing';

export function LoginScreen() {
  const theme = useTheme();
  const setCredentials = useAuthStore((s) => s.setCredentials);

  const [serverUrl, setServerUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef(false);

  const validateUrl = (url: string): string | null => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return 'URL must use HTTPS or HTTP';
      }
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  };

  const normalizeUrl = (url: string): string => {
    let normalized = url.trim();
    if (
      !normalized.startsWith('http://') &&
      !normalized.startsWith('https://')
    ) {
      normalized = `https://${normalized}`;
    }
    return normalized.replace(/\/+$/, '');
  };

  const handleConnect = useCallback(async () => {
    const normalized = normalizeUrl(serverUrl);
    const validationError = validateUrl(normalized);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setIsConnecting(true);
    abortRef.current = false;

    try {
      const loginFlow = await initiateLoginFlow(normalized);
      await WebBrowser.openBrowserAsync(loginFlow.login);

      const startTime = Date.now();
      while (
        !abortRef.current &&
        Date.now() - startTime < POLLING.LOGIN_TIMEOUT_MS
      ) {
        try {
          const credentials = await pollForCredentials(
            loginFlow.poll.endpoint,
            loginFlow.poll.token,
          );

          await setCredentials(
            credentials.server,
            credentials.loginName,
            credentials.appPassword,
          );
          reconfigureApiClient();
          return;
        } catch {
          await new Promise((resolve) =>
            setTimeout(resolve, POLLING.LOGIN_INTERVAL_MS),
          );
        }
      }

      if (!abortRef.current) {
        setError('Login timed out. Please try again.');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? `Connection failed: ${err.message}`
          : 'Connection failed. Please check the server URL.',
      );
    } finally {
      setIsConnecting(false);
    }
  }, [serverUrl, setCredentials]);

  const handleCancel = useCallback(() => {
    abortRef.current = true;
    setIsConnecting(false);
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text variant="headlineLarge" style={styles.title}>
            Easy Talk
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Connect to your Nextcloud Talk server
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Server URL"
            value={serverUrl}
            onChangeText={(text) => {
              setServerUrl(text);
              setError('');
            }}
            placeholder="https://cloud.example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            disabled={isConnecting}
            mode="outlined"
            left={<TextInput.Icon icon="server" />}
          />
          {error ? (
            <HelperText type="error" visible>
              {error}
            </HelperText>
          ) : null}

          {isConnecting ? (
            <View style={styles.connecting}>
              <ActivityIndicator size="small" />
              <Text
                variant="bodyMedium"
                style={[
                  styles.connectingText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Waiting for authorization...
              </Text>
              <Button mode="text" onPress={handleCancel}>
                Cancel
              </Button>
            </View>
          ) : (
            <Button
              mode="contained"
              onPress={handleConnect}
              style={styles.button}
              disabled={!serverUrl.trim()}
            >
              Connect
            </Button>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
  },
  button: {
    marginTop: spacing.sm,
  },
  connecting: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  connectingText: {
    marginTop: spacing.sm,
  },
});
