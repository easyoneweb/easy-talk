import { Platform } from 'react-native';
import { getApiClient } from './client';
import { useAuthStore } from '@/stores/authStore';
import { API_PATHS } from '@/config/constants';

export interface MediaFile {
  uri: string;
  mimeType: string;
  fileName: string;
  fileSize?: number;
}

async function ensureTalkDirectory(): Promise<void> {
  const { userId } = useAuthStore.getState();
  const client = getApiClient();
  try {
    await client.request({
      method: 'MKCOL',
      url: `${API_PATHS.WEBDAV_FILES}/${userId}/Talk`,
    });
  } catch (error: unknown) {
    // 405 = directory already exists, which is fine
    const status = (error as { response?: { status?: number } })?.response
      ?.status;
    if (status !== 405) {
      throw error;
    }
  }
}

function buildWebDAVUrl(userId: string, filePath: string): string {
  const { serverUrl } = useAuthStore.getState();
  return `${serverUrl}${API_PATHS.WEBDAV_FILES}/${userId}${filePath}`;
}

function getAuthHeader(): string {
  const { userId, appPassword } = useAuthStore.getState();
  return `Basic ${btoa(`${userId}:${appPassword}`)}`;
}

/**
 * Upload a file to WebDAV using XMLHttpRequest.
 * On React Native (iOS/Android), axios cannot reliably send Blob/binary PUT bodies.
 * XHR with a file URI object ({uri, type, name}) is the standard RN approach.
 */
function uploadWithXHR(
  url: string,
  fileUri: string,
  mimeType: string,
  onProgress?: (progress: number) => void,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Content-Type', mimeType);
    xhr.setRequestHeader('Authorization', getAuthHeader());
    xhr.setRequestHeader('OCS-APIRequest', 'true');

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(event.loaded / event.total);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.status);
      } else {
        reject(
          new Error(
            `WebDAV upload failed with status ${xhr.status}: ${xhr.responseText}`,
          ),
        );
      }
    };

    xhr.onerror = () => {
      reject(new Error('WebDAV upload network error'));
    };

    if (Platform.OS === 'web') {
      // On web/Electron, fetch the blob and send it
      fetch(fileUri)
        .then((r) => r.blob())
        .then((blob) => xhr.send(blob))
        .catch(reject);
    } else {
      // On React Native (iOS/Android), send the file URI directly
      // RN's XHR implementation handles file:// URIs natively
      xhr.send({
        uri: fileUri,
        type: mimeType,
        name: 'upload',
      } as unknown as Blob);
    }
  });
}

export async function uploadFileToWebDAV(
  fileName: string,
  fileUri: string,
  mimeType: string,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const { userId } = useAuthStore.getState();
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const safeName = `${timestamp}_${fileName}`;
  const filePath = `/Talk/${safeName}`;
  const url = buildWebDAVUrl(userId, filePath);

  try {
    await uploadWithXHR(url, fileUri, mimeType, onProgress);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    // 409 = directory doesn't exist
    if (message.includes('409')) {
      await ensureTalkDirectory();
      await uploadWithXHR(url, fileUri, mimeType, onProgress);
    } else {
      throw error;
    }
  }

  return filePath;
}

export async function shareFileToRoom(
  filePath: string,
  conversationToken: string,
): Promise<void> {
  const client = getApiClient();
  await client.post(API_PATHS.FILE_SHARING, {
    shareType: 10,
    shareWith: conversationToken,
    path: filePath,
  });
}

export async function uploadAndShareFile(
  file: MediaFile,
  conversationToken: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  const filePath = await uploadFileToWebDAV(
    file.fileName,
    file.uri,
    file.mimeType,
    onProgress,
  );

  await shareFileToRoom(filePath, conversationToken);
}
