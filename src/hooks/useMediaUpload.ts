import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { uploadAndShareFile, type MediaFile } from '@/api/fileSharing';
import { pickFromGallery, pickFromCamera } from '@/services/mediaPicker';

export function useMediaUpload(conversationToken: string) {
  const queryClient = useQueryClient();
  const [pendingMedia, setPendingMedia] = useState<MediaFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGifLoading, setIsGifLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref tracks the latest pendingMedia so sendMedia always reads current value
  const pendingMediaRef = useRef(pendingMedia);
  pendingMediaRef.current = pendingMedia;

  const conversationTokenRef = useRef(conversationToken);
  conversationTokenRef.current = conversationToken;

  const handlePickFromGallery = useCallback(async () => {
    try {
      const media = await pickFromGallery();
      if (media) {
        setPendingMedia(media);
        setError(null);
      }
    } catch {
      setError('Failed to pick media');
    }
  }, []);

  const handlePickFromCamera = useCallback(async () => {
    try {
      const media = await pickFromCamera();
      if (media) {
        setPendingMedia(media);
        setError(null);
      }
    } catch {
      setError('Failed to capture media');
    }
  }, []);

  const cancelMedia = useCallback(() => {
    setPendingMedia(null);
    setUploadProgress(null);
    setIsGifLoading(false);
    setError(null);
  }, []);

  const startGifLoading = useCallback(() => {
    setIsGifLoading(true);
    setError(null);
  }, []);

  const setGifMedia = useCallback((media: MediaFile) => {
    setIsGifLoading(false);
    setPendingMedia(media);
    setError(null);
  }, []);

  // Stable callback — reads pendingMedia and conversationToken from refs
  // so it never goes stale regardless of render timing
  const sendMedia = useCallback(async (): Promise<boolean> => {
    const media = pendingMediaRef.current;
    if (!media) return false;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      await uploadAndShareFile(
        media,
        conversationTokenRef.current,
        (progress) => setUploadProgress(progress),
      );

      setPendingMedia(null);
      setUploadProgress(null);

      // Don't invalidate messages — long polling will deliver the new file
      // message naturally. Invalidating here causes a refetch that can race
      // with long polling and overwrite the cache, leading to UI hangs.
      queryClient.invalidateQueries({ queryKey: ['conversations'] });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Upload failed: ${message}`);
      setUploadProgress(null);
      return false;
    } finally {
      setIsUploading(false);
    }
  }, [queryClient]);

  return {
    pendingMedia,
    uploadProgress,
    isUploading,
    isGifLoading,
    error,
    pickFromGallery: handlePickFromGallery,
    pickFromCamera: handlePickFromCamera,
    cancelMedia,
    startGifLoading,
    setGifMedia,
    sendMedia,
  };
}
