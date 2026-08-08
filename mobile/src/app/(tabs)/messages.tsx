import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Screen } from '@/components/screen';
import { Avatar, EmptyState, ErrorState, PaperCard } from '@/components/ui';
import { apiCached, getCachedApiData } from '@/lib/api';
import { refreshNotificationCount } from '@/lib/notification-count';
import { colors, type } from '@/lib/theme';
import type { Thread } from '@/types';

const MESSAGES_PATH = '/api/messages';

export default function MessagesScreen() {
  const router = useRouter(); const cachedThreads = getCachedApiData<Thread[]>(MESSAGES_PATH); const [threads, setThreads] = useState<Thread[]>(cachedThreads || []); const [loading, setLoading] = useState(!cachedThreads); const [error, setError] = useState('');
  const load = useCallback(async (force = false) => { if (!getCachedApiData(MESSAGES_PATH)) setLoading(true); setError(''); try { setThreads(await apiCached<Thread[]>(MESSAGES_PATH, { force })); void refreshNotificationCount().catch(() => {}); } catch (e) { setError(e instanceof Error ? e.message : 'Could not load messages.'); } finally { setLoading(false); } }, []);
  useFocusEffect(useCallback(() => { void load(true); }, [load]));
  return <Screen title="Messages" eyebrow="A quieter place to talk">{loading ? <ActivityIndicator color={colors.ink} style={{ marginVertical: 40 }} /> : error ? <ErrorState message={error} onRetry={load} /> : threads.length ? threads.map((thread, index) => <Pressable key={thread.id} onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: thread.id, name: thread.name } })}><PaperCard style={{ backgroundColor: index % 2 ? '#FFF2C9' : colors.white }}><View style={styles.row}><Avatar name={thread.name} uri={thread.profileImage} color={index % 2 ? colors.rose : colors.sky} /><View style={{ flex: 1 }}><View style={styles.nameRow}><Text style={styles.name}>{thread.name}</Text>{thread.unreadCount ? <View style={styles.badge}><Text style={styles.badgeText}>{thread.unreadCount}</Text></View> : null}</View><Text numberOfLines={1} style={styles.preview}>{thread.lastMessage || 'Say hello and make a new memory.'}</Text></View><ChevronRight size={19} color={colors.muted} /></View></PaperCard></Pressable>) : <EmptyState title="No conversations yet" body="Once you connect with an Amika friend, your private thread will be waiting here." />}</Screen>;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, name: { fontFamily: type.heavy, color: colors.ink, fontSize: 16 }, preview: { fontFamily: type.regular, color: colors.muted, fontSize: 13, marginTop: 3 }, badge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.periwinkle, alignItems: 'center', justifyContent: 'center' }, badgeText: { fontFamily: type.heavy, color: colors.ink, fontSize: 10 }, });
