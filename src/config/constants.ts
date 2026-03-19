export const API_PATHS = {
  LOGIN_FLOW_V2: '/index.php/login/v2',
  CONVERSATIONS: '/ocs/v2.php/apps/spreed/api/v4/room',
  CHAT: '/ocs/v2.php/apps/spreed/api/v1/chat',
  PARTICIPANTS: '/ocs/v2.php/apps/spreed/api/v4/room',
  AUTOCOMPLETE: '/ocs/v2.php/core/autocomplete/get',
  AVATAR: '/index.php/avatar',
  CAPABILITIES: '/ocs/v2.php/cloud/capabilities',
  PUSH_NOTIFICATIONS: '/ocs/v2.php/apps/notifications/api/v2/push',
  WEBDAV_FILES: '/remote.php/dav/files',
  FILE_SHARING: '/ocs/v2.php/apps/files_sharing/api/v1/shares',
} as const;

export const POLLING = {
  LOGIN_INTERVAL_MS: 2000,
  LOGIN_TIMEOUT_MS: 300000, // 5 minutes
  LONG_POLL_TIMEOUT_S: 30,
  CONVERSATION_REFETCH_MS: 30000,
  RECONNECT_DELAY_MS: 5000,
  CONTACT_SEARCH_DEBOUNCE_MS: 300,
} as const;

export const MESSAGES = {
  PAGE_SIZE: 50,
  MAX_INPUT_LINES: 4,
} as const;

export const STORAGE_KEYS = {
  SERVER_URL: 'server_url',
  USER_ID: 'user_id',
  APP_PASSWORD: 'app_password',
  THEME_PREFERENCE: 'theme_preference',
} as const;
