import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpen, Cake, Camera, ChevronLeft, Heart, MessageCircle, Sparkles } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MemoryCard } from '@/components/memory-card';
import { Avatar, Button, EmptyState, ErrorState, Spinner } from '@/components/ui';
import { ProfileStories } from '@/components/profile-stories';
import { apiCached, getCachedApiData } from '@/lib/api';
import { getMemoryFeedSnapshot, updateCachedMemory } from '@/lib/memory-feed';
import { interestLabel } from '@/lib/interests';
import { border, colors, shadow, type } from '@/lib/theme';
import type { Friend, Memory } from '@/types';

const FRIENDS_PATH = '/api/friends';

function parseInterests(value?: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    // Older friend records may store interests as comma-separated text.
  }
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function birthdayLabel(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

export default function FriendProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const cachedFriends = getCachedApiData<Friend[]>(FRIENDS_PATH);
  const initialFriend = cachedFriends?.find((item) => item.id === id);
  const initialMemories = getMemoryFeedSnapshot().items.filter((memory) => memory.friendId === id || memory.friend?.id === id);
  const [friend, setFriend] = useState<Friend | undefined>(initialFriend);
  const [memories, setMemories] = useState<Memory[]>(initialMemories);
  const [loading, setLoading] = useState(!initialFriend);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiCached<Friend[]>(FRIENDS_PATH, { force: true }).then((items) => {
      if (!active) return;
      setFriend(items.find((item) => item.id === id));
      setLoading(false);
    }).catch((loadError) => {
      if (!active) return;
      setError(loadError instanceof Error ? loadError.message : 'Could not open this profile.');
      setLoading(false);
    });
    return () => { active = false; };
  }, [id]);

  const interests = useMemo(() => parseInterests(friend?.interests), [friend?.interests]);
  const birthday = birthdayLabel(friend?.birthday);
  const updateReaction = useCallback((memoryId: string, reactedByMe: boolean, reactionCount: number) => {
    updateCachedMemory(memoryId, { reactedByMe, reactionCount });
    setMemories((current) => current.map((memory) => memory.id === memoryId ? { ...memory, reactedByMe, reactionCount } : memory));
  }, []);

  if (loading) return <SafeAreaView style={styles.state}><Spinner color={colors.ink} size="large" /><Text style={styles.stateText}>Opening this friendship…</Text></SafeAreaView>;
  if (!friend) return <SafeAreaView style={styles.state}><ErrorState message={error || 'This friend is no longer in your circle.'} onRetry={() => router.back()} /></SafeAreaView>;

  const image = friend.customProfileImage || friend.profileImage;
  return <SafeAreaView style={styles.safe} edges={['top']}>
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to friends" onPress={() => router.back()} style={styles.back}>
        <ChevronLeft size={25} color={colors.ink} />
      </Pressable>
      <Text style={styles.headerTitle}>Friend profile</Text>
    </View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Avatar name={friend.name} uri={image} size={92} color={colors.citrus} />
        <Text style={styles.connection}>{friend.linkedUserId ? 'Connected on Amika' : 'In your circle'}</Text>
        <Text style={styles.name}>{friend.name}</Text>
        {friend.statusText ? <Text style={styles.status}>“{friend.statusText}”</Text> : null}
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.statNumber}>{friend.memoriesCount || 0}</Text><Text style={styles.statLabel}>memories</Text></View>
          <View style={styles.statRule} />
          <View style={styles.stat}><Text style={styles.statNumber}>{friend.notesCount || 0}</Text><Text style={styles.statLabel}>journal notes</Text></View>
        </View>
        <View style={styles.actions}>
          <Button label="Add a memory" tone="citrus" onPress={() => router.push({ pathname: '/add', params: { friendId: friend.id } })} style={styles.actionButton} />
          {friend.linkedUserId ? <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: friend.linkedUserId || '', name: friend.name } })} style={styles.messageButton}>
            <MessageCircle size={19} color={colors.ink} /><Text style={styles.messageLabel}>Message</Text>
          </Pressable> : null}
        </View>
      </View>

      {friend.linkedUserId ? <ProfileStories ownerId={friend.linkedUserId} ownerName={friend.name} ownerImage={image} /> : null}

      <View style={styles.details}>
        <View style={styles.detailRow}><View style={[styles.detailIcon, { backgroundColor: colors.rose }]}><Heart size={18} color={colors.ink} /></View><View style={styles.detailCopy}><Text style={styles.detailLabel}>How you met</Text><Text style={styles.detailValue}>{friend.howWeMet || 'No beginning added yet.'}</Text></View></View>
        {birthday ? <View style={styles.detailRow}><View style={[styles.detailIcon, { backgroundColor: colors.citrus }]}><Cake size={18} color={colors.ink} /></View><View style={styles.detailCopy}><Text style={styles.detailLabel}>Birthday</Text><Text style={styles.detailValue}>{birthday}</Text></View></View> : null}
        <View style={styles.detailRow}><View style={[styles.detailIcon, { backgroundColor: colors.sky }]}><BookOpen size={18} color={colors.ink} /></View><View style={styles.detailCopy}><Text style={styles.detailLabel}>Private notes</Text><Text style={styles.detailValue}>{friend.notes || 'Nothing private noted yet.'}</Text></View></View>
        {interests.length ? <View style={styles.interests}><View style={styles.interestHeading}><Sparkles size={17} color={colors.ink} /><Text style={styles.detailLabel}>Their things</Text></View><View style={styles.chips}>{interests.map((interest) => <Text key={interest} style={styles.chip}>{interestLabel(interest)}</Text>)}</View></View> : null}
      </View>

      <View style={styles.memoryHeading}><View><Text style={styles.memoryKicker}>Shared history</Text><Text style={styles.memoryTitle}>Memories with {friend.name}</Text></View><Camera size={22} color={colors.ink} /></View>
      {memories.length ? memories.map((memory) => <MemoryCard key={memory.id} memory={memory} onReaction={updateReaction} />) : <EmptyState title="Your shared history starts here" body="Keep one small moment from today and it will appear in this friendship." actionLabel="Add the first memory" onAction={() => router.push({ pathname: '/add', params: { friendId: friend.id } })} />}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: colors.paper },
  stateText: { fontFamily: type.medium, color: colors.muted },
  header: { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: 1.5, borderBottomColor: colors.line },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: type.heavy, fontSize: 19, color: colors.ink },
  content: { padding: 18, paddingBottom: 42, gap: 20 },
  hero: { alignItems: 'center', padding: 22, borderRadius: 20, backgroundColor: colors.periwinkle, ...border, ...shadow },
  connection: { marginTop: 13, fontFamily: type.heavy, color: colors.periwinkleDark, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.25 },
  name: { marginTop: 2, fontFamily: type.heavy, color: colors.ink, fontSize: 29, textAlign: 'center' },
  status: { maxWidth: 290, marginTop: 7, fontFamily: type.medium, color: colors.ink, opacity: .72, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  stats: { marginTop: 17, flexDirection: 'row', alignItems: 'center' },
  stat: { minWidth: 100, alignItems: 'center' },
  statNumber: { fontFamily: type.heavy, color: colors.ink, fontSize: 21 },
  statLabel: { fontFamily: type.medium, color: colors.ink, fontSize: 10, marginTop: 1 },
  statRule: { width: 1.5, height: 31, backgroundColor: colors.line, opacity: .35 },
  actions: { width: '100%', flexDirection: 'row', gap: 9, marginTop: 19 },
  actionButton: { flex: 1 },
  messageButton: { minHeight: 48, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 14, backgroundColor: colors.white, ...border },
  messageLabel: { fontFamily: type.heavy, color: colors.ink, fontSize: 14 },
  details: { padding: 17, gap: 17, borderRadius: 18, backgroundColor: colors.white, ...border },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  detailIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', ...border },
  detailCopy: { flex: 1, paddingTop: 1 },
  detailLabel: { fontFamily: type.heavy, color: colors.ink, fontSize: 12, textTransform: 'uppercase', letterSpacing: .9 },
  detailValue: { marginTop: 4, fontFamily: type.regular, color: colors.muted, fontSize: 14, lineHeight: 20 },
  interests: { gap: 9, paddingTop: 2 },
  interestHeading: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, backgroundColor: colors.paperDeep, fontFamily: type.medium, color: colors.ink, fontSize: 12 },
  memoryHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 3 },
  memoryKicker: { fontFamily: type.heavy, color: colors.periwinkleDark, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2 },
  memoryTitle: { marginTop: 2, maxWidth: 300, fontFamily: type.heavy, color: colors.ink, fontSize: 22, lineHeight: 27 },
});
