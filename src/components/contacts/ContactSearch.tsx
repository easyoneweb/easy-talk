import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { Searchbar } from 'react-native-paper';
import { spacing } from '@/theme/spacing';

interface ContactSearchProps {
  query: string;
  onChangeQuery: (query: string) => void;
}

export function ContactSearch({ query, onChangeQuery }: ContactSearchProps) {
  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search users..."
        value={query}
        onChangeText={onChangeQuery}
        style={styles.searchbar}
        mode={Platform.OS === 'android' ? 'bar' : 'view'}
      />
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
});
