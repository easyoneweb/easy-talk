import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

const isElectron =
  isWeb &&
  typeof window !== 'undefined' &&
  !!(window as { electronAPI?: unknown }).electronAPI;

const isMobile = !isWeb;

export function usePlatform() {
  return { isWeb, isElectron, isDesktop: isWeb, isMobile } as const;
}

export { isWeb, isElectron, isMobile };
