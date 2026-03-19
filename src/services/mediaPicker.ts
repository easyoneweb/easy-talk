import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Platform } from 'react-native';
import type { MediaFile } from '@/api/fileSharing';

function extractFileName(uri: string): string {
  const parts = uri.split('/');
  return parts[parts.length - 1] ?? 'file';
}

function normalizeImageMimeType(mimeType: string | undefined): string {
  if (!mimeType) return 'image/jpeg';
  // HEIC/HEIF are not widely supported by Nextcloud for previews — treat as JPEG
  // (expo-image-picker with quality < 1 already re-encodes to JPEG on iOS)
  if (mimeType === 'image/heic' || mimeType === 'image/heif') {
    return 'image/jpeg';
  }
  return mimeType;
}

function normalizeFileName(
  fileName: string | undefined,
  uri: string,
  mimeType: string,
): string {
  const name = fileName ?? extractFileName(uri);
  // If the file was re-encoded to JPEG but still has .heic extension, fix it
  if (
    mimeType === 'image/jpeg' &&
    (name.toLowerCase().endsWith('.heic') ||
      name.toLowerCase().endsWith('.heif'))
  ) {
    return name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg');
  }
  return name;
}

function toMediaFile(asset: ImagePicker.ImagePickerAsset): MediaFile {
  const isVideo = asset.type === 'video';
  const mimeType = isVideo
    ? (asset.mimeType ?? 'video/mp4')
    : normalizeImageMimeType(asset.mimeType);
  const fileName = normalizeFileName(
    asset.fileName ?? undefined,
    asset.uri,
    mimeType,
  );

  return {
    uri: asset.uri,
    mimeType,
    fileName,
    fileSize: asset.fileSize,
  };
}

async function requestMediaLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Easy Talk needs access to your photo library to send images and videos. Please enable it in Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
    return false;
  }
  return true;
}

async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Easy Talk needs camera access to take photos and videos. Please enable it in Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
    return false;
  }
  return true;
}

// On iOS, quality < 1 forces re-encoding to JPEG (avoids HEIC compatibility issues)
const imagePickerOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images', 'videos'],
  quality: Platform.OS === 'ios' ? 0.9 : 0.8,
  allowsMultipleSelection: false,
};

export async function pickFromGallery(): Promise<MediaFile | null> {
  const granted = await requestMediaLibraryPermission();
  if (!granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync(imagePickerOptions);

  if (result.canceled || result.assets.length === 0) return null;
  return toMediaFile(result.assets[0]);
}

export async function pickFromCamera(): Promise<MediaFile | null> {
  const granted = await requestCameraPermission();
  if (!granted) return null;

  const result = await ImagePicker.launchCameraAsync(imagePickerOptions);

  if (result.canceled || result.assets.length === 0) return null;
  return toMediaFile(result.assets[0]);
}
