import { useRef } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getMessagesWithReadStatus,
  sendMessage,
  markAsRead,
  type MessagesResponse,
} from '@/api/messages';
import { MESSAGES } from '@/config/constants';

export function useMessages(token: string) {
  const lastCommonReadRef = useRef<number | null>(null);

  const query = useInfiniteQuery<MessagesResponse>({
    queryKey: ['messages', token],
    queryFn: async ({ pageParam }) => {
      const result = await getMessagesWithReadStatus(token, {
        lookIntoFuture: 0,
        limit: MESSAGES.PAGE_SIZE,
        lastKnownMessageId: pageParam as number | undefined,
      });
      if (result.lastCommonRead !== null) {
        lastCommonReadRef.current = Math.max(
          lastCommonReadRef.current ?? 0,
          result.lastCommonRead,
        );
      }
      return result;
    },
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.messages.length < MESSAGES.PAGE_SIZE) return undefined;
      const minId = Math.min(...lastPage.messages.map((m) => m.id));
      return minId;
    },
  });

  return {
    data: query.data
      ? {
          ...query.data,
          pages: query.data.pages.map((p) => p.messages),
        }
      : undefined,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    lastCommonRead: lastCommonReadRef.current,
    updateLastCommonRead: (id: number) => {
      lastCommonReadRef.current = Math.max(lastCommonReadRef.current ?? 0, id);
    },
  };
}

export function useSendMessage(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ message, replyTo }: { message: string; replyTo?: number }) =>
      sendMessage(token, message, replyTo),
    onSuccess: (newMessage) => {
      queryClient.setQueryData<{
        pages: MessagesResponse[];
        pageParams: unknown[];
      }>(['messages', token], (old) => {
        if (!old) return old;
        const firstPage = old.pages[0];
        if (!firstPage) return old;
        // Avoid duplicates if long polling already delivered this message
        if (firstPage.messages.some((m) => m.id === newMessage.id)) return old;
        return {
          ...old,
          pages: [
            { ...firstPage, messages: [newMessage, ...firstPage.messages] },
            ...old.pages.slice(1),
          ],
        };
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkAsRead(token: string) {
  return useMutation({
    mutationFn: (lastReadMessage?: number) =>
      markAsRead(token, lastReadMessage),
  });
}
