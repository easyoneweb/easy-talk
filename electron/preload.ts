import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  secureStore: {
    save: (key: string, value: string): Promise<void> =>
      ipcRenderer.invoke('secure-store:save', key, value),
    get: (key: string): Promise<string | null> =>
      ipcRenderer.invoke('secure-store:get', key),
    remove: (key: string): Promise<void> =>
      ipcRenderer.invoke('secure-store:remove', key),
  },
  notifications: {
    show: (title: string, body: string): Promise<void> =>
      ipcRenderer.invoke('notification:show', title, body),
  },
  platform: {
    isElectron: true,
  },
});
