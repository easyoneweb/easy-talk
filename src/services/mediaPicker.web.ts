import type { MediaFile } from '@/api/fileSharing';

export async function pickFromGallery(): Promise<MediaFile | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.style.display = 'none';

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      document.body.removeChild(input);

      if (!file) {
        resolve(null);
        return;
      }

      const uri = URL.createObjectURL(file);
      resolve({
        uri,
        mimeType: file.type || 'application/octet-stream',
        fileName: file.name,
        fileSize: file.size,
      });
    });

    // Handle cancel (user closes file dialog without selecting)
    input.addEventListener('cancel', () => {
      document.body.removeChild(input);
      resolve(null);
    });

    document.body.appendChild(input);
    input.click();
  });
}

export async function pickFromCamera(): Promise<MediaFile | null> {
  // Camera not available on desktop/web
  return null;
}
