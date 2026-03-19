import { NativeModules, NativeEventEmitter } from 'react-native';
import type { MediaFile } from '@/api/fileSharing';

const { GifKeyboard } = NativeModules;
const emitter = GifKeyboard ? new NativeEventEmitter(GifKeyboard) : null;

export function addGifKeyboardListener(
  onLoading: () => void,
  onReady: (media: MediaFile) => void,
): () => void {
  if (!emitter) return () => {};

  const loadingSub = emitter.addListener('onGifLoading', () => {
    onLoading();
  });

  const readySub = emitter.addListener(
    'onGifReceived',
    (event: { uri: string; mime: string }) => {
      const uriParts = event.uri.split('/');
      const rawName = uriParts[uriParts.length - 1] ?? '';
      const mimeType = event.mime ?? 'image/gif';
      const ext = mimeType.split('/')[1] ?? 'gif';
      const fileName =
        rawName.length > 0
          ? rawName.includes('.')
            ? rawName
            : `${rawName}.${ext}`
          : `gif_${Date.now()}.${ext}`;

      onReady({ uri: event.uri, mimeType, fileName });
    },
  );

  return () => {
    loadingSub.remove();
    readySub.remove();
  };
}
