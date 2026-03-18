import { getApiClient } from './client';
import type { AutocompleteResult } from '@/types/api';
import { API_PATHS } from '@/config/constants';

export async function searchUsers(
  query: string,
): Promise<AutocompleteResult[]> {
  const response = await getApiClient().get<AutocompleteResult[]>(
    API_PATHS.AUTOCOMPLETE,
    {
      params: {
        search: query,
        itemType: 'call',
        itemId: 'new',
        'shareTypes[]': 0,
      },
    },
  );
  return response.data;
}
