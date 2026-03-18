const PREFIX = 'easytalk_secure_';

export async function save(key: string, value: string): Promise<void> {
  if (window.electronAPI) {
    await window.electronAPI.secureStore.save(key, value);
    return;
  }
  localStorage.setItem(PREFIX + key, value);
}

export async function get(key: string): Promise<string | null> {
  if (window.electronAPI) {
    return window.electronAPI.secureStore.get(key);
  }
  return localStorage.getItem(PREFIX + key);
}

export async function remove(key: string): Promise<void> {
  if (window.electronAPI) {
    await window.electronAPI.secureStore.remove(key);
    return;
  }
  localStorage.removeItem(PREFIX + key);
}
