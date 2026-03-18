import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { getMessages, sendMessage, markAsRead } from '@/api/messages';
import type { Message } from '@/types/api';
import { MESSAGES } from '@/config/constants';

export function useMessages(token: string) {
  return useInfiniteQuery<Message[]>({
    queryKey: ['messages', token],
    queryFn: ({ pageParam }) =>
      getMessages(token, {
        lookIntoFuture: 0,
        limit: MESSAGES.PAGE_SIZE,
        lastKnownMessageId: pageParam as number | undefined,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < MESSAGES.PAGE_SIZE) return undefined;
      const minId = Math.min(...lastPage.map((m) => m.id));
      return minId;
    },
    select: (data) => ({
      ...data,
      pages: data.pages,
    }),
  });
}

export function useSendMessage(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ message, replyTo }: { message: string; replyTo?: number }) =>
      sendMessage(token, message, replyTo),
    onSuccess: (newMessage) => {
      queryClient.setQueryData<{
        pages: Message[][];
        pageParams: unknown[];
      }>(['messages', token], (old) => {
        if (!old) return old;
        const firstPage = old.pages[0] ?? [];
        return {
          ...old,
          pages: [[newMessage, ...firstPage], ...old.pages.slice(1)],
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
