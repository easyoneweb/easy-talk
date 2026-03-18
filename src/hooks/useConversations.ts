import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getConversations,
  createOneToOneConversation,
  createGroupConversation,
} from '@/api/conversations';
import { POLLING } from '@/config/constants';
import type { Conversation } from '@/types/api';

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: getConversations,
    refetchInterval: POLLING.CONVERSATION_REFETCH_MS,
    select: (data) =>
      [...data].sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        return b.lastActivity - a.lastActivity;
      }),
  });
}

export function useCreateOneToOneConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => createOneToOneConversation(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useCreateGroupConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, invites }: { name: string; invites: string[] }) =>
      createGroupConversation(name, invites),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
