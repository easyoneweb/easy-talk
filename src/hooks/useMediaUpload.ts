import { useState, useCallback } from 'react';
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

  const sendMedia = useCallback(async (): Promise<boolean> => {
    if (!pendingMedia) return false;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      await uploadAndShareFile(pendingMedia, conversationToken, (progress) =>
        setUploadProgress(progress),
      );

      setPendingMedia(null);
      setUploadProgress(null);

      // Invalidate queries so the new file message appears
      queryClient.invalidateQueries({
        queryKey: ['messages', conversationToken],
      });
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
  }, [pendingMedia, conversationToken, queryClient]);

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
