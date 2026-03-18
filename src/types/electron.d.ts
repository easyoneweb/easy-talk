interface ElectronAPI {
  secureStore: {
    save(key: string, value: string): Promise<void>;
    get(key: string): Promise<string | null>;
    remove(key: string): Promise<void>;
  };
  notifications: {
    show(title: string, body: string): Promise<void>;
  };
  platform: {
    isElectron: boolean;
  };
}

interface Window {
  electronAPI?: ElectronAPI;
}
