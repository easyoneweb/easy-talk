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
  const lastKnownIdRef = useRef(lastKnownMessageId);
  const onLastCommonReadUpdateRef = useRef(onLastCommonReadUpdate);

  lastKnownIdRef.current = lastKnownMessageId;
  onLastCommonReadUpdateRef.current = onLastCommonReadUpdate;

  // Update existing manager when lastKnownMessageId changes (no teardown)
  useEffect(() => {
    if (lastKnownMessageId && managerRef.current) {
      managerRef.current.updateLastKnownMessageId(lastKnownMessageId);
    }
  }, [lastKnownMessageId]);

  // Create/destroy manager only when token changes or on mount/unmount.
  // hasId handles the initial undefined→defined transition when messages first load.
  const hasId = !!lastKnownMessageId;
  useEffect(() => {
    if (!hasId) return;

    const manager = new LongPollingManager(
      token,
      lastKnownIdRef.current!,
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
          onLastCommonReadUpdateRef.current?.(lastCommonRead);
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
  }, [token, hasId, queryClient]);

  return managerRef;
}
