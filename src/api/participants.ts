import { getApiClient } from './client';
import type { Participant } from '@/types/api';
import { API_PATHS } from '@/config/constants';

export async function getParticipants(token: string): Promise<Participant[]> {
  const response = await getApiClient().get<Participant[]>(
    `${API_PATHS.PARTICIPANTS}/${token}/participants`,
  );
  return response.data;
}

export async function addParticipant(
  token: string,
  userId: string,
): Promise<void> {
  await getApiClient().post(`${API_PATHS.PARTICIPANTS}/${token}/participants`, {
    newParticipant: userId,
    source: 'users',
  });
}

export async function removeParticipant(
  token: string,
  attendeeId: number,
): Promise<void> {
  await getApiClient().delete(`${API_PATHS.PARTICIPANTS}/${token}/attendees`, {
    data: { attendeeId },
  });
}
