import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LongPollingManager } from '@/services/longPolling';
import type { Message } from '@/types/api';

export function useLongPolling(token: string, lastKnownMessageId?: number) {
  const queryClient = useQueryClient();
  const managerRef = useRef<LongPollingManager | null>(null);

  useEffect(() => {
    if (!lastKnownMessageId) return;

    const manager = new LongPollingManager(
      token,
      lastKnownMessageId,
      (newMessages: Message[]) => {
        queryClient.setQueryData<{
          pages: Message[][];
          pageParams: unknown[];
        }>(['messages', token], (old) => {
          if (!old) return old;
          const firstPage = old.pages[0] ?? [];
          const existingIds = new Set(firstPage.map((m) => m.id));
          const uniqueNewMessages = newMessages.filter(
            (m) => !existingIds.has(m.id),
          );
          if (uniqueNewMessages.length === 0) return old;
          return {
            ...old,
            pages: [
              [...uniqueNewMessages, ...firstPage],
              ...old.pages.slice(1),
            ],
          };
        });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      },
    );

    managerRef.current = manager;
    manager.start();

    return () => {
      manager.stop();
      managerRef.current = null;
    };
  }, [token, lastKnownMessageId, queryClient]);

  return managerRef;
}
