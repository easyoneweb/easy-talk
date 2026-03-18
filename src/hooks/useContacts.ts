import { useState, useDeferredValue } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchUsers } from '@/api/contacts';
import type { AutocompleteResult } from '@/types/api';

export function useContacts() {
  const [searchQuery, setSearchQuery] = useState('');
  const deferredQuery = useDeferredValue(searchQuery);

  const query = useQuery<AutocompleteResult[]>({
    queryKey: ['contacts', deferredQuery],
    queryFn: () => searchUsers(deferredQuery),
    enabled: deferredQuery.length >= 2,
  });

  return {
    searchQuery,
    setSearchQuery,
    contacts: query.data ?? [],
    isLoading: query.isLoading,
    isSearching: searchQuery !== deferredQuery,
  };
}
