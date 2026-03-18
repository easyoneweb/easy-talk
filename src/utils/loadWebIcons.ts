import { Platform } from 'react-native';

/**
 * Load MaterialCommunityIcons font on web via a <style> tag.
 * On native platforms this is a no-op (fonts are linked natively).
 */
export function loadWebIcons(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  const fontUrl =
    require('react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf') as string;

  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      src: url(${fontUrl}) format('truetype');
      font-family: 'MaterialCommunityIcons';
      font-display: block;
    }
  `;
  document.head.appendChild(style);
}
