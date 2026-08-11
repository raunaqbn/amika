import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Platform, RefreshControl, StyleSheet, Text, View, type ViewToken } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/screen';
import { MemoryCard } from '@/components/memory-card';
import { HomeStories } from '@/components/home-stories';
import { DividerLabel, EmptyState, ErrorState, Spinner } from '@/components/ui';
import {
  getMemoryFeedSnapshot,
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
  const [visibleMemoryIds, setVisibleMemoryIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState('');
  const loadingMoreRef = useRef(false);
  const refreshingRef = useRef(false);

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

  const refresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    try {
      await load(true, true);
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
    }
  }, [load]);

  const renderMemory = useCallback(({ item }: { item: Memory }) => (
    <MemoryCard memory={item} onReaction={updateReaction} playbackEnabled={!refreshing && visibleMemoryIds.has(item.id)} />
  ), [refreshing, updateReaction, visibleMemoryIds]);
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken<Memory>[] }) => {
    setVisibleMemoryIds(new Set(viewableItems.flatMap(({ item }) => item?.id ? [item.id] : [])));
  }).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 45 }).current;
  const listHeader = useMemo(() => <View style={styles.listHeader}><HomeStories /><DividerLabel>Recent memories</DividerLabel></View>, []);

  return <Screen title="Home" eyebrow="Your circle · Today" scroll={false}>
    <FlatList
      data={memories}
      renderItem={renderMemory}
      keyExtractor={(memory) => memory.id}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={listHeader}
      ItemSeparatorComponent={MemorySeparator}
      ListEmptyComponent={loading
        ? <Spinner color={colors.ink} style={styles.loader} />
        : error
          ? <ErrorState message={error} onRetry={() => load()} />
          : <EmptyState title="Your pocket is ready" body="The first memory can be tiny: a joke, a walk, the song someone sent you." actionLabel="Keep today" onAction={() => router.push('/add')} />}
      ListFooterComponent={memories.length
        ? loadingMore
          ? <Spinner color={colors.ink} style={styles.footerLoader} />
          : !hasMore
            ? <Text style={styles.end}>That’s the whole circle for now.</Text>
            : null
        : null}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.ink} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.45}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      initialNumToRender={4}
      maxToRenderPerBatch={6}
      updateCellsBatchingPeriod={16}
      windowSize={7}
      removeClippedSubviews={Platform.OS === 'android'}
    />
  </Screen>;
}

const MemorySeparator = memo(function MemorySeparator() {
  return <View style={styles.separator} />;
});

const styles = StyleSheet.create({
  listContent: { paddingBottom: 34 },
  listHeader: { gap: 18, marginBottom: 18 },
  separator: { height: 18 },
  loader: { marginVertical: 40 },
  footerLoader: { marginVertical: 22 },
  end: { marginTop: 18, fontFamily: type.medium, color: colors.muted, textAlign: 'center', fontSize: 12 },
});
