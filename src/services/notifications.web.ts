import { getApiClient } from '@/api/client';
import { API_PATHS } from '@/config/constants';

export async function requestPermissions(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export async function registerForPushNotifications(): Promise<string | null> {
  // Web/Electron does not use Expo push tokens
  return null;
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

type NotificationCallback = (notification: {
  title: string;
  body: string;
}) => void;

interface EventSubscription {
  remove: () => void;
}

export function addNotificationReceivedListener(
  _callback: NotificationCallback,
): EventSubscription {
  // Web notifications are handled by the browser/Electron natively
  return { remove: () => {} };
}

export function addNotificationResponseListener(
  _callback: NotificationCallback,
): EventSubscription {
  return { remove: () => {} };
}

export function showNotification(title: string, body: string): void {
  if (window.electronAPI) {
    window.electronAPI.notifications.show(title, body);
    return;
  }
  if (
    typeof Notification !== 'undefined' &&
    Notification.permission === 'granted'
  ) {
    new Notification(title, { body });
  }
}

async function hashString(input: string): Promise<string> {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}
