import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { Check, ChevronLeft, ChevronRight, MessageCircle, UserPlus, X } from 'lucide-react-native';
import { Screen } from '@/components/screen';
import { Avatar, Button, EmptyState, ErrorState } from '@/components/ui';
import { useAuth } from '@/context/auth';
import { api, imageSource, invalidateApiCache } from '@/lib/api';
import { invalidateMemoryFeed } from '@/lib/memory-feed';
import { refreshNotificationCount } from '@/lib/notification-count';
import { border, colors, shadow, type } from '@/lib/theme';
import type { Connection, SharedItem, Thread } from '@/types';

function timeAgo(value: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [sharedItems, setSharedItems] = useState<SharedItem[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [requests, setRequests] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else if (!hasLoaded.current) setLoading(true);
    setError('');
    try {
      const [nextSharedItems, nextThreads, nextConnections] = await Promise.all([
        api<SharedItem[]>('/api/shared-items?type=received&status=pending&itemType=memory'),
        api<Thread[]>('/api/messages'),
        api<Connection[]>('/api/connections?type=received&status=pending'),
      ]);
      setSharedItems(nextSharedItems);
      setThreads(nextThreads.filter((thread) => thread.unreadCount > 0));
      setRequests(nextConnections.filter((request) => request.status === 'pending' && request.addresseeId === user?.id));
      hasLoaded.current = true;
      void refreshNotificationCount().catch(() => {});
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const count = sharedItems.length + threads.reduce((sum, thread) => sum + thread.unreadCount, 0) + requests.length;
  const eyebrow = useMemo(() => count ? `${count} new ${count === 1 ? 'moment' : 'moments'}` : 'You’re all caught up', [count]);

  async function updateSharedItem(item: SharedItem, status: 'accepted' | 'rejected') {
    setActionId(item.id);
    try {
      await api('/api/shared-items', { method: 'PUT', body: JSON.stringify({ id: item.id, status }) });
      setSharedItems((current) => current.filter((candidate) => candidate.id !== item.id));
      invalidateApiCache('/api/shared-items');
      if (status === 'accepted') {
        invalidateMemoryFeed();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Alert.alert('Memory saved', 'It’s now part of your memories with this friend.');
      }
      void refreshNotificationCount().catch(() => {});
    } catch (actionError) {
      Alert.alert('Could not update memory', actionError instanceof Error ? actionError.message : 'Try again.');
    } finally {
      setActionId(null);
    }
  }

  async function updateRequest(request: Connection, status: 'accepted' | 'rejected') {
    setActionId(request.id);
    try {
      await api('/api/connections', { method: 'PUT', body: JSON.stringify({ id: request.id, status }) });
      setRequests((current) => current.filter((candidate) => candidate.id !== request.id));
      invalidateApiCache('/api/connections');
      invalidateApiCache('/api/friends');
      void refreshNotificationCount().catch(() => {});
    } catch (actionError) {
      Alert.alert('Could not update request', actionError instanceof Error ? actionError.message : 'Try again.');
    } finally {
      setActionId(null);
    }
  }

  const backButton = <Pressable accessibilityRole="button" accessibilityLabel="Close notifications" onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}><ChevronLeft size={24} color={colors.ink} /></Pressable>;

  return <Screen
    title="Notifications"
    eyebrow={eyebrow}
    right={backButton}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.ink} />}
  >
    {loading ? <ActivityIndicator color={colors.ink} style={styles.loader} />
      : error ? <ErrorState message={error} onRetry={load} />
        : !count ? <EmptyState title="Nothing new right now" body="Messages, memories you’re tagged in, and friend requests will gather here." />
          : <>
            {sharedItems.length ? <View style={styles.section}>
              <Text style={styles.sectionLabel}>Memories with you</Text>
              {sharedItems.map((item, index) => <View key={item.id} style={[styles.memoryCard, { backgroundColor: index % 2 ? '#FFF2C9' : colors.white }]}>
                <View style={styles.metaRow}>
                  <Avatar name={item.sharedBy.name} uri={item.sharedBy.profileImage} size={44} color={colors.rose} />
                  <View style={styles.metaCopy}>
                    <Text style={styles.eventText}><Text style={styles.eventName}>{item.sharedBy.name}</Text> added a memory with you</Text>
                    <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
                  </View>
                </View>
                {item.item?.imageUrl ? <Image source={imageSource(item.item.imageUrl)} style={styles.memoryImage} contentFit="cover" cachePolicy="memory-disk" transition={100} enforceEarlyResizing /> : null}
                {item.item?.content ? <Text style={styles.memoryText}>{item.item.content}</Text> : null}
                <View style={styles.actions}>
                  <Button label="Save to my memories" tone="citrus" loading={actionId === item.id} onPress={() => void updateSharedItem(item, 'accepted')} style={styles.saveButton} />
                  <Pressable accessibilityRole="button" accessibilityLabel={`Dismiss memory from ${item.sharedBy.name}`} disabled={actionId === item.id} onPress={() => void updateSharedItem(item, 'rejected')} style={({ pressed }) => [styles.dismissButton, pressed && styles.pressed]}><X size={19} color={colors.muted} /></Pressable>
                </View>
              </View>)}
            </View> : null}

            {threads.length ? <View style={styles.section}>
              <Text style={styles.sectionLabel}>Messages</Text>
              <View style={styles.listCard}>
                {threads.map((thread, index) => <Pressable
                  key={thread.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${thread.unreadCount} unread ${thread.unreadCount === 1 ? 'message' : 'messages'} from ${thread.name}`}
                  onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: thread.id, name: thread.name } })}
                  style={({ pressed }) => [styles.listRow, index > 0 && styles.rowDivider, pressed && styles.rowPressed]}
                >
                  <View style={styles.iconTile}><MessageCircle size={19} color={colors.ink} /></View>
                  <Avatar name={thread.name} uri={thread.profileImage} size={42} color={colors.sky} />
                  <View style={styles.rowCopy}><Text style={styles.rowTitle}>{thread.name}</Text><Text numberOfLines={1} style={styles.rowBody}>{thread.lastMessage}</Text></View>
                  <View style={styles.messageBadge}><Text style={styles.messageBadgeText}>{thread.unreadCount > 9 ? '9+' : thread.unreadCount}</Text></View>
                  <ChevronRight size={18} color={colors.muted} />
                </Pressable>)}
              </View>
            </View> : null}

            {requests.length ? <View style={styles.section}>
              <Text style={styles.sectionLabel}>Friend requests</Text>
              <View style={styles.listCard}>
                {requests.map((request, index) => {
                  const person = request.otherUser;
                  if (!person) return null;
                  return <View key={request.id} style={[styles.listRow, index > 0 && styles.rowDivider]}>
                    <View style={[styles.iconTile, { backgroundColor: colors.sage }]}><UserPlus size={18} color={colors.ink} /></View>
                    <Avatar name={person.name} uri={person.profileImage} size={42} color={colors.sage} />
                    <View style={styles.rowCopy}><Text style={styles.rowTitle}>{person.name}</Text><Text numberOfLines={1} style={styles.rowBody}>Wants to connect on Amika</Text></View>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Accept ${person.name}'s friend request`} disabled={actionId === request.id} onPress={() => void updateRequest(request, 'accepted')} style={({ pressed }) => [styles.acceptButton, pressed && styles.pressed]}>{actionId === request.id ? <ActivityIndicator size="small" color={colors.ink} /> : <Check size={19} color={colors.ink} strokeWidth={2.5} />}</Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Dismiss ${person.name}'s friend request`} disabled={actionId === request.id} onPress={() => void updateRequest(request, 'rejected')} style={({ pressed }) => [styles.smallDismiss, pressed && styles.pressed]}><X size={18} color={colors.muted} /></Pressable>
                  </View>;
                })}
              </View>
            </View> : null}
          </>}
  </Screen>;
}

const styles = StyleSheet.create({
  backButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, ...border },
  pressed: { transform: [{ translateY: 2 }] },
  loader: { marginVertical: 48 },
  section: { gap: 12 },
  sectionLabel: { fontFamily: type.heavy, color: colors.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.35 },
  memoryCard: { borderRadius: 18, padding: 15, gap: 13, ...border, ...shadow },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  metaCopy: { flex: 1 },
  eventText: { fontFamily: type.regular, color: colors.ink, fontSize: 14, lineHeight: 19 },
  eventName: { fontFamily: type.heavy },
  time: { fontFamily: type.medium, color: colors.muted, fontSize: 10, marginTop: 2 },
  memoryImage: { width: '100%', aspectRatio: 4 / 3, borderRadius: 13, backgroundColor: colors.paperDeep, ...border },
  memoryText: { fontFamily: type.regular, color: colors.ink, fontSize: 16, lineHeight: 23 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  saveButton: { flex: 1 },
  dismissButton: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, ...border },
  listCard: { overflow: 'hidden', borderRadius: 18, backgroundColor: colors.white, ...border, ...shadow },
  listRow: { minHeight: 74, paddingHorizontal: 12, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 9 },
  rowDivider: { borderTopWidth: 1.5, borderTopColor: colors.line },
  rowPressed: { backgroundColor: colors.paperDeep },
  iconTile: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.periwinkle, ...border },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { fontFamily: type.heavy, color: colors.ink, fontSize: 15 },
  rowBody: { fontFamily: type.regular, color: colors.muted, fontSize: 12, marginTop: 2 },
  messageBadge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.citrus, ...border },
  messageBadgeText: { fontFamily: type.heavy, color: colors.ink, fontSize: 9 },
  acceptButton: { width: 39, height: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.citrus, ...border },
  smallDismiss: { width: 34, height: 39, alignItems: 'center', justifyContent: 'center' },
});
