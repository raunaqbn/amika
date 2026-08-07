import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/screen';
import { MemoryComposer } from '@/components/memory-composer';
import { MemoryCard } from '@/components/memory-card';
import { DividerLabel, EmptyState, ErrorState } from '@/components/ui';
import { api } from '@/lib/api';
import { colors, type } from '@/lib/theme';
import type { Memory } from '@/types';

export default function HomeScreen() {
  const router = useRouter(); const [memories, setMemories] = useState<Memory[]>([]); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState('');
  const load = useCallback(async (quiet = false) => { if (!quiet) setLoading(true); setError(''); try { setMemories(await api<Memory[]>('/api/memories?scope=feed')); } catch (e) { setError(e instanceof Error ? e.message : 'Could not load memories.'); } finally { setLoading(false); setRefreshing(false); } }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  return <Screen title="Your circle" eyebrow="Amika · Today" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={colors.ink} />}>
    <MemoryComposer onSaved={() => load(true)} />
    <DividerLabel>Recently kept</DividerLabel>
    {loading ? <ActivityIndicator color={colors.ink} style={{ marginVertical: 40 }} /> : error ? <ErrorState message={error} onRetry={() => load()} /> : memories.length ? memories.map((memory) => <MemoryCard key={memory.id} memory={memory} onChanged={() => load(true)} />) : <EmptyState title="Your pocket is ready" body="The first memory can be tiny: a joke, a walk, the song someone sent you." actionLabel="Keep today" onAction={() => router.push('/add')} />}
    {!loading && memories.length > 0 ? <Text style={{ fontFamily: type.medium, color: colors.muted, textAlign: 'center', fontSize: 12 }}>That’s the whole circle for now.</Text> : null}
  </Screen>;
}
