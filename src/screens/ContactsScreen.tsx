import React, { useCallback } from 'react';
import { FlatList, Platform, StyleSheet } from 'react-native';
import { Divider, ActivityIndicator } from 'react-native-paper';
import { useHeaderHeight } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ContactSearch } from '@/components/contacts/ContactSearch';
import { ContactItem } from '@/components/contacts/ContactItem';
import { EmptyState } from '@/components/common/EmptyState';
import { AdaptiveBackground } from '@/components/platform/AdaptiveBackground';
import { useContacts } from '@/hooks/useContacts';
import { useCreateOneToOneConversation } from '@/hooks/useConversations';
import type { MainTabParamList } from '@/types/navigation';
import type { AutocompleteResult } from '@/types/api';
import { spacing } from '@/theme/spacing';

type NavigationProp = BottomTabNavigationProp<MainTabParamList, 'ContactsTab'>;

export function ContactsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const headerHeight = useHeaderHeight();
  const { searchQuery, setSearchQuery, contacts, isLoading, isSearching } =
    useContacts();
  const createConversation = useCreateOneToOneConversation();

  const handleContactPress = useCallback(
    async (contact: AutocompleteResult) => {
      try {
        const conversation = await createConversation.mutateAsync(contact.id);
        navigation.navigate('ChatsTab', {
          screen: 'ChatWindow',
          params: {
            token: conversation.token,
            displayName: conversation.displayName,
          },
        });
      } catch {
        // Handle error - conversation might already exist
      }
    },
    [createConversation, navigation],
  );

  return (
    <AdaptiveBackground
      style={Platform.OS === 'ios' ? { paddingTop: headerHeight } : undefined}
    >
      <ContactSearch query={searchQuery} onChangeQuery={setSearchQuery} />

      {isLoading || isSearching ? (
        <ActivityIndicator style={styles.loading} />
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
