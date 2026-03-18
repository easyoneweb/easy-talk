import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  TextInput as RNTextInput,
} from 'react-native';
import { Searchbar, FAB } from 'react-native-paper';
import { useHeaderHeight } from '@react-navigation/elements';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { GlassCard } from '@/components/platform/GlassCard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ConversationList } from '@/components/conversations/ConversationList';
import { AdaptiveBackground } from '@/components/platform/AdaptiveBackground';
import { useConversations } from '@/hooks/useConversations';
import { useAppTheme } from '@/theme/ThemeProvider';
import type { ChatStackParamList } from '@/types/navigation';
import type { Conversation } from '@/types/api';
import { spacing } from '@/theme/spacing';

type NavigationProp = NativeStackNavigationProp<ChatStackParamList>;

export function ChatsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const headerHeight = useHeaderHeight();
  const { isDark } = useAppTheme();
  const { data: conversations, isLoading, refetch } = useConversations();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter((c) =>
      c.displayName.toLowerCase().includes(query),
    );
  }, [conversations, searchQuery]);

  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate('ChatWindow', {
      token: conversation.token,
      displayName: conversation.displayName,
    });
  };

  return (
    <AdaptiveBackground
      style={Platform.OS === 'ios' ? { paddingTop: headerHeight } : undefined}
    >
      <View style={styles.searchContainer}>
        {Platform.OS === 'ios' ? (
          <GlassCard style={styles.glassSearch}>
            <View style={styles.iosSearchRow}>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color="#8E8E93"
                style={styles.iosSearchIcon}
              />
              <RNTextInput
                placeholder="Search conversations..."
                placeholderTextColor="#8E8E93"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[
                  styles.iosSearchInput,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                ]}
                clearButtonMode="while-editing"
                returnKeyType="search"
              />
            </View>
          </GlassCard>
        ) : (
          <Searchbar
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchbar}
            mode="bar"
          />
        )}
      </View>

      <ConversationList
        conversations={filteredConversations}
        onConversationPress={handleConversationPress}
        refreshing={isLoading}
        onRefresh={() => refetch()}
      />

      {Platform.OS === 'android' && (
        <FAB
          icon="plus"
          onPress={() => {
            const parent = navigation.getParent();
            parent?.navigate('ContactsTab');
          }}
          style={styles.fab}
        />
      )}
    </AdaptiveBackground>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchbar: {
    elevation: 0,
  },
  glassSearch: {
    borderRadius: 22,
  },
  iosSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
  },
  iosSearchIcon: {
    marginRight: 8,
  },
  iosSearchInput: {
    flex: 1,
    fontSize: 17,
    padding: 0,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
  },
});
