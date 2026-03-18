import * as Notifications from 'expo-notifications';

import { getApiClient } from '@/api/client';
import { API_PATHS } from '@/config/constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function registerForPushNotifications(): Promise<string | null> {
  const granted = await requestPermissions();
  if (!granted) return null;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data;
}

export async function registerWithServer(
  pushToken: string,
  publicKey: string,
): Promise<void> {
  const pushTokenHash = await hashString(pushToken);

  await getApiClient().post(API_PATHS.PUSH_NOTIFICATIONS, {
    pushTokenHash,
    devicePublicKey: publicKey,
    proxyServer: 'https://push-notifications.nextcloud.com',
  });
}

export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

async function hashString(input: string): Promise<string> {
  // Simple hash for push token - in production, use crypto.subtle or expo-crypto
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}
