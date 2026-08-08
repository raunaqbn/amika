import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/screen';
import { MemoryComposer } from '@/components/memory-composer';
import { MemoryCard } from '@/components/memory-card';
import { DividerLabel, EmptyState, ErrorState } from '@/components/ui';
import {
  getMemoryFeedSnapshot,
  invalidateMemoryFeed,
  loadMemoryFeed,
  loadMoreMemories,
  updateCachedMemory,
} from '@/lib/memory-feed';
import { colors, type } from '@/lib/theme';
import type { Memory } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const initialFeed = getMemoryFeedSnapshot();
  const [memories, setMemories] = useState(initialFeed.items);
  const [hasMore, setHasMore] = useState(Boolean(initialFeed.nextCursor));
  const [loading, setLoading] = useState(!initialFeed.items.length);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const loadingMoreRef = useRef(false);

  const applyFeed = useCallback((feed: ReturnType<typeof getMemoryFeedSnapshot>) => {
    setMemories(feed.items);
    setHasMore(Boolean(feed.nextCursor));
  }, []);

  const load = useCallback(async (quiet = false, force = false) => {
    if (!quiet) setLoading(true);
    setError('');
    try {
      applyFeed(await loadMemoryFeed(force));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load memories.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [applyFeed]);

  useFocusEffect(useCallback(() => {
    const cached = getMemoryFeedSnapshot();
    if (cached.items.length) {
      applyFeed(cached);
      setLoading(false);
    }
    void load(Boolean(cached.items.length));
  }, [applyFeed, load]));

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      applyFeed(await loadMoreMemories());
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [applyFeed, hasMore]);

  const updateReaction = useCallback((memoryId: string, reactedByMe: boolean, reactionCount: number) => {
    applyFeed(updateCachedMemory(memoryId, { reactedByMe, reactionCount }));
  }, [applyFeed]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    void load(true, true);
  }, [load]);

  const memorySaved = useCallback(() => {
    invalidateMemoryFeed();
    void load(true, true);
  }, [load]);

  const renderMemory = useCallback(({ item }: { item: Memory }) => (
    <MemoryCard memory={item} onReaction={updateReaction} />
  ), [updateReaction]);

  return <Screen title="Your circle" eyebrow="Amika · Today" scroll={false}>
    <FlatList
      data={memories}
      renderItem={renderMemory}
      keyExtractor={(memory) => memory.id}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={<View style={styles.listHeader}><MemoryComposer onSaved={memorySaved} /><DividerLabel>Recently kept</DividerLabel></View>}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={loading
        ? <ActivityIndicator color={colors.ink} style={styles.loader} />
        : error
          ? <ErrorState message={error} onRetry={() => load()} />
          : <EmptyState title="Your pocket is ready" body="The first memory can be tiny: a joke, a walk, the song someone sent you." actionLabel="Keep today" onAction={() => router.push('/add')} />}
      ListFooterComponent={memories.length
        ? loadingMore
          ? <ActivityIndicator color={colors.ink} style={styles.footerLoader} />
          : !hasMore
            ? <Text style={styles.end}>That’s the whole circle for now.</Text>
            : null
        : null}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.ink} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.45}
      initialNumToRender={3}
      maxToRenderPerBatch={4}
      updateCellsBatchingPeriod={40}
      windowSize={5}
      removeClippedSubviews={Platform.OS === 'android'}
    />
  </Screen>;
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 34 },
  listHeader: { gap: 18, marginBottom: 18 },
  separator: { height: 18 },
  loader: { marginVertical: 40 },
  footerLoader: { marginVertical: 22 },
  end: { marginTop: 18, fontFamily: type.medium, color: colors.muted, textAlign: 'center', fontSize: 12 },
});
