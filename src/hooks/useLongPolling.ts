import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LongPollingManager } from '@/services/longPolling';
import type { MessagesResponse } from '@/api/messages';
import type { Message } from '@/types/api';

export function useLongPolling(
  token: string,
  lastKnownMessageId?: number,
  onLastCommonReadUpdate?: (id: number) => void,
) {
  const queryClient = useQueryClient();
  const managerRef = useRef<LongPollingManager | null>(null);

  useEffect(() => {
    if (!lastKnownMessageId) return;

    const manager = new LongPollingManager(
      token,
      lastKnownMessageId,
      (newMessages: Message[], lastCommonRead: number | null) => {
        queryClient.setQueryData<{
          pages: MessagesResponse[];
          pageParams: unknown[];
        }>(['messages', token], (old) => {
          if (!old) return old;
          const firstPage = old.pages[0];
          if (!firstPage) return old;
          const existingIds = new Set(firstPage.messages.map((m) => m.id));
          const uniqueNewMessages = newMessages.filter(
            (m) => !existingIds.has(m.id),
          );
          if (uniqueNewMessages.length === 0 && lastCommonRead === null)
            return old;
          return {
            ...old,
            pages: [
              {
                messages:
                  uniqueNewMessages.length > 0
                    ? [...uniqueNewMessages, ...firstPage.messages]
                    : firstPage.messages,
                lastCommonRead: lastCommonRead ?? firstPage.lastCommonRead,
              },
              ...old.pages.slice(1),
            ],
          };
        });
        if (lastCommonRead !== null) {
          onLastCommonReadUpdate?.(lastCommonRead);
        }
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      },
    );

    managerRef.current = manager;
    manager.start();

    return () => {
      manager.stop();
      managerRef.current = null;
    };
  }, [token, lastKnownMessageId, queryClient, onLastCommonReadUpdate]);

  return managerRef;
}
