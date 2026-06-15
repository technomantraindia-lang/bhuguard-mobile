import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApiList } from '../hooks/useApiList';
import { colors } from '../theme/colors';
import type { ApiRecord } from '../utils/apiHelpers';
import { EMPTY_DATA_MESSAGE, PENDING_API_MESSAGE } from '../utils/apiError';
import { pickString } from '../utils/apiHelpers';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';
import { ScreenHeader } from './ScreenHeader';
import { SearchBar } from './SearchBar';

interface ApiListScreenProps {
  title: string;
  subtitle?: string;
  fetcher: () => Promise<ApiRecord>;
  listKeys: string[];
  emptyTitle?: string;
  emptyMessage?: string;
  searchKeys?: string[];
  onItemPress?: (item: ApiRecord) => void;
  renderItem: (item: ApiRecord, index: number) => ReactNode;
  keyExtractor?: (item: ApiRecord, index: number) => string;
}

function matchesSearch(item: ApiRecord, query: string, keys: string[]): boolean {
  const haystack = keys
    .map((key) => pickString(item, key))
    .join(' ')
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

export function ApiListScreen({
  title,
  subtitle,
  fetcher,
  listKeys,
  emptyTitle = 'No records',
  emptyMessage = EMPTY_DATA_MESSAGE,
  searchKeys = ['name', 'title', 'farm_name', 'site_name', 'report_code', 'assignment_code', 'status', 'village', 'district'],
  onItemPress,
  renderItem,
  keyExtractor,
}: ApiListScreenProps) {
  const [search, setSearch] = useState('');
  const { items, loading, refreshing, error, pending, reload, refresh } = useApiList({
    fetcher,
    listKeys,
  });

  const filteredItems = useMemo(() => {
    if (!search.trim()) {
      return items;
    }

    return items.filter((item) => matchesSearch(item, search.trim(), searchKeys));
  }, [items, search, searchKeys]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.pad}>
          <ScreenHeader title={title} subtitle={subtitle} />
        </View>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (error && items.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.pad}>
          <ScreenHeader title={title} subtitle={subtitle} />
        </View>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item, index) =>
          keyExtractor?.(item, index) ?? String(item.id ?? item.uuid ?? index)
        }
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <ScreenHeader title={title} subtitle={subtitle} />
            <SearchBar value={search} onChangeText={setSearch} placeholder="Search records..." />
            {error ? <Text style={styles.inlineError}>{error}</Text> : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.itemWrap}>
            {onItemPress ? (
              <Pressable onPress={() => onItemPress(item)}>{renderItem(item, index)}</Pressable>
            ) : (
              renderItem(item, index)
            )}
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title={pending ? 'Module ready' : emptyTitle}
            message={pending ? PENDING_API_MESSAGE : emptyMessage}
          />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 20, paddingTop: 12 },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  headerBlock: { gap: 10, marginBottom: 8 },
  inlineError: { color: colors.error, fontSize: 13 },
  itemWrap: { marginBottom: 12 },
});
