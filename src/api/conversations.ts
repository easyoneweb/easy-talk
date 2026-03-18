import { getApiClient } from './client';
import type { Conversation } from '@/types/api';
import { API_PATHS } from '@/config/constants';

export async function getConversations(): Promise<Conversation[]> {
  const response = await getApiClient().get<Conversation[]>(
    API_PATHS.CONVERSATIONS,
  );
  return response.data;
}

export async function getConversation(token: string): Promise<Conversation> {
  const response = await getApiClient().get<Conversation>(
    `${API_PATHS.CONVERSATIONS}/${token}`,
  );
  return response.data;
}

export async function createOneToOneConversation(
  userId: string,
): Promise<Conversation> {
  const response = await getApiClient().post<Conversation>(
    API_PATHS.CONVERSATIONS,
    {
      roomType: 1,
      invite: userId,
    },
  );
  return response.data;
}

export async function createGroupConversation(
  name: string,
  invites: string[],
): Promise<Conversation> {
  const response = await getApiClient().post<Conversation>(
    API_PATHS.CONVERSATIONS,
    {
      roomType: 2,
      roomName: name,
      invite: invites[0],
    },
  );
  return response.data;
}

export async function deleteConversation(token: string): Promise<void> {
  await getApiClient().delete(`${API_PATHS.CONVERSATIONS}/${token}`);
}

export async function setFavorite(token: string): Promise<void> {
  await getApiClient().post(`${API_PATHS.CONVERSATIONS}/${token}/favorite`);
}

export async function removeFavorite(token: string): Promise<void> {
  await getApiClient().delete(`${API_PATHS.CONVERSATIONS}/${token}/favorite`);
}

export async function joinConversation(token: string): Promise<void> {
  await getApiClient().post(
    `${API_PATHS.CONVERSATIONS}/${token}/participants/active`,
  );
}

export async function leaveConversation(token: string): Promise<void> {
  await getApiClient().delete(
    `${API_PATHS.CONVERSATIONS}/${token}/participants/active`,
  );
}
