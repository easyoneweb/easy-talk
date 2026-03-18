import { useState, useDeferredValue, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchUsers } from '@/api/contacts';
import type { AutocompleteResult } from '@/types/api';

export function useContacts() {
  const [searchQuery, setSearchQuery] = useState('');
  const deferredQuery = useDeferredValue(searchQuery);

  // Always load the initial contact list (empty query returns known contacts)
  const allContactsQuery = useQuery<AutocompleteResult[]>({
    queryKey: ['contacts', ''],
    queryFn: () => searchUsers(''),
  });

  // Search query for refined results when user types 2+ characters
  const searchContactsQuery = useQuery<AutocompleteResult[]>({
    queryKey: ['contacts', deferredQuery],
    queryFn: () => searchUsers(deferredQuery),
    enabled: deferredQuery.length >= 2,
  });

  const contacts = useMemo(() => {
    if (deferredQuery.length >= 2) {
      return searchContactsQuery.data ?? [];
    }
    const all = allContactsQuery.data ?? [];
    if (!deferredQuery) return all;
    // Client-side filter for 1-character queries
    const q = deferredQuery.toLowerCase();
    return all.filter((c) => c.label.toLowerCase().includes(q));
  }, [deferredQuery, allContactsQuery.data, searchContactsQuery.data]);

  return {
    searchQuery,
    setSearchQuery,
    contacts,
    isLoading: allContactsQuery.isLoading,
    isSearching:
      searchQuery !== deferredQuery ||
      (deferredQuery.length >= 2 && searchContactsQuery.isLoading),
  };
}
