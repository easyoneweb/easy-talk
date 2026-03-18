import * as SecureStore from 'expo-secure-store';

export async function save(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function get(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function remove(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}
