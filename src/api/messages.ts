import { getApiClient } from './client';
import type { Message } from '@/types/api';
import { API_PATHS, MESSAGES, POLLING } from '@/config/constants';

interface GetMessagesParams {
  lookIntoFuture?: 0 | 1;
  limit?: number;
  lastKnownMessageId?: number;
  timeout?: number;
  setReadMarker?: 0 | 1;
}

export interface MessagesResponse {
  messages: Message[];
  lastCommonRead: number | null;
}

export async function getMessages(
  token: string,
  params: GetMessagesParams = {},
): Promise<Message[]> {
  const response = await getApiClient().get<Message[]>(
    `${API_PATHS.CHAT}/${token}`,
    {
      params: {
        lookIntoFuture: params.lookIntoFuture ?? 0,
        limit: params.limit ?? MESSAGES.PAGE_SIZE,
        lastKnownMessageId: params.lastKnownMessageId,
        timeout: params.timeout,
        setReadMarker: params.setReadMarker ?? 1,
      },
    },
  );
  return response.data;
}

export async function getMessagesWithReadStatus(
  token: string,
  params: GetMessagesParams = {},
): Promise<MessagesResponse> {
  const response = await getApiClient().get<Message[]>(
    `${API_PATHS.CHAT}/${token}`,
    {
      params: {
        lookIntoFuture: params.lookIntoFuture ?? 0,
        limit: params.limit ?? MESSAGES.PAGE_SIZE,
        lastKnownMessageId: params.lastKnownMessageId,
        timeout: params.timeout,
        setReadMarker: params.setReadMarker ?? 1,
      },
    },
  );
  const lastCommonRead = response.headers?.['x-chat-last-common-read'];
  return {
    messages: response.data,
    lastCommonRead: lastCommonRead ? parseInt(lastCommonRead, 10) : null,
  };
}

export async function sendMessage(
  token: string,
  message: string,
  replyTo?: number,
): Promise<Message> {
  const referenceId = generateReferenceId();
  const response = await getApiClient().post<Message>(
    `${API_PATHS.CHAT}/${token}`,
    {
      message,
      replyTo: replyTo ?? 0,
      referenceId,
    },
  );
  return response.data;
}

export async function pollNewMessages(
  token: string,
  lastKnownMessageId: number,
  signal?: AbortSignal,
): Promise<MessagesResponse> {
  const response = await getApiClient().get<Message[]>(
    `${API_PATHS.CHAT}/${token}`,
    {
      params: {
        lookIntoFuture: 1,
        lastKnownMessageId,
        timeout: POLLING.LONG_POLL_TIMEOUT_S,
        setReadMarker: 0,
      },
      timeout: (POLLING.LONG_POLL_TIMEOUT_S + 5) * 1000,
      signal,
    },
  );
  const lastCommonRead = response.headers?.['x-chat-last-common-read'];
  return {
    messages: response.data,
    lastCommonRead: lastCommonRead ? parseInt(lastCommonRead, 10) : null,
  };
}

export async function markAsRead(
  token: string,
  lastReadMessage?: number,
): Promise<void> {
  await getApiClient().post(`${API_PATHS.CHAT}/${token}/read`, {
    lastReadMessage,
  });
}

export async function deleteMessage(
  token: string,
  messageId: number,
): Promise<Message> {
  const response = await getApiClient().delete<Message>(
    `${API_PATHS.CHAT}/${token}/${messageId}`,
  );
  return response.data;
}

export async function editMessage(
  token: string,
  messageId: number,
  message: string,
): Promise<Message> {
  const response = await getApiClient().put<Message>(
    `${API_PATHS.CHAT}/${token}/${messageId}`,
    { message },
  );
  return response.data;
}

function generateReferenceId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
