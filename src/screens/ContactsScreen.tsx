import React, { useCallback } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Divider, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ContactSearch } from '@/components/contacts/ContactSearch';
import { ContactItem } from '@/components/contacts/ContactItem';
import { EmptyState } from '@/components/common/EmptyState';
import { AdaptiveBackground } from '@/components/platform/AdaptiveBackground';
import { useContacts } from '@/hooks/useContacts';
import { useCreateOneToOneConversation } from '@/hooks/useConversations';
import type { ChatStackParamList } from '@/types/navigation';
import type { AutocompleteResult } from '@/types/api';
import { spacing } from '@/theme/spacing';

type NavigationProp = NativeStackNavigationProp<ChatStackParamList>;

export function ContactsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { searchQuery, setSearchQuery, contacts, isLoading, isSearching } =
    useContacts();
  const createConversation = useCreateOneToOneConversation();

  const handleContactPress = useCallback(
    async (contact: AutocompleteResult) => {
      try {
        const conversation = await createConversation.mutateAsync(contact.id);
        // Navigate to the Chats tab and then to the ChatWindow
        const parent = navigation.getParent();
        parent?.navigate('ChatsTab');
        // Small delay to ensure tab navigation completes
        setTimeout(() => {
          navigation.navigate('ChatWindow', {
            token: conversation.token,
            displayName: conversation.displayName,
          });
        }, 100);
      } catch {
        // Handle error - conversation might already exist
      }
    },
    [createConversation, navigation],
  );

  return (
    <AdaptiveBackground>
      <ContactSearch query={searchQuery} onChangeQuery={setSearchQuery} />

      {isLoading || isSearching ? (
        <ActivityIndicator style={styles.loading} />
      ) : searchQuery.length < 2 ? (
        <EmptyState
          icon="account-search"
          title="Search for users"
          description="Type at least 2 characters to search"
        />
      ) : contacts.length === 0 ? (
        <EmptyState
          icon="account-off"
          title="No users found"
          description="Try a different search term"
        />
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ContactItem
              contact={item}
              onPress={() => handleContactPress(item)}
            />
          )}
          ItemSeparatorComponent={() => <Divider style={styles.divider} />}
        />
      )}
    </AdaptiveBackground>
  );
}

const styles = StyleSheet.create({
  loading: {
    marginTop: spacing.xl,
  },
  divider: {
    marginLeft: 76,
  },
});
