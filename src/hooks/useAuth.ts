import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { reconfigureApiClient } from '@/api/client';

export function useAuth() {
  const store = useAuthStore();
  const { loadFromStorage } = store;

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (store.isAuthenticated) {
      reconfigureApiClient();
    }
  }, [store.isAuthenticated, store.serverUrl]);

  return store;
}
