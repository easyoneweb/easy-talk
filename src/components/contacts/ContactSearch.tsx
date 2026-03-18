import React from 'react';
import {
  StyleSheet,
  View,
  Platform,
  TextInput as RNTextInput,
} from 'react-native';
import { Searchbar } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { GlassCard } from '@/components/platform/GlassCard';
import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/spacing';

interface ContactSearchProps {
  query: string;
  onChangeQuery: (query: string) => void;
}

export function ContactSearch({ query, onChangeQuery }: ContactSearchProps) {
  const { isDark } = useAppTheme();

  return (
    <View style={styles.container}>
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
              placeholder="Search users..."
              placeholderTextColor="#8E8E93"
              value={query}
              onChangeText={onChangeQuery}
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
          placeholder="Search users..."
          value={query}
          onChangeText={onChangeQuery}
          style={styles.searchbar}
          mode="bar"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
});
