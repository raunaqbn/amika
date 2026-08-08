import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, Search, UserPlus } from 'lucide-react-native';
import { Screen } from '@/components/screen';
import { Avatar, EmptyState, ErrorState, PaperCard } from '@/components/ui';
import { api, apiCached, getCachedApiData, invalidateApiCache } from '@/lib/api';
import { colors, type } from '@/lib/theme';
import type { Friend } from '@/types';

const FRIENDS_PATH = '/api/friends';
const cardColors = [colors.white, '#FFF2C9', '#E1E4FF'];
const avatarColors = [colors.rose, colors.sky, colors.sage];

export default function FriendsScreen() {
  const router = useRouter();
  const cachedFriends = getCachedApiData<Friend[]>(FRIENDS_PATH);
  const [friends, setFriends] = useState<Friend[]>(cachedFriends || []);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(!cachedFriends);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async (force = false) => {
    if (!getCachedApiData(FRIENDS_PATH)) setLoading(true);
    setError('');
    try {
      setFriends(await apiCached<Friend[]>(FRIENDS_PATH, { force }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load friends.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function addFriend() {
    const name = query.trim();
    if (!name) return Alert.alert('Type their name first', 'Use the search box for a name, then tap Add.');
    setAdding(true);
    try {
      await api('/api/friends', { method: 'POST', body: JSON.stringify({ name }) });
      invalidateApiCache(FRIENDS_PATH);
      setQuery('');
      await load(true);
    } catch (addError) {
      Alert.alert('Friend not added', addError instanceof Error ? addError.message : 'Try again.');
    } finally {
      setAdding(false);
    }
  }

  const visible = useMemo(
    () => friends.filter((friend) => friend.name.toLowerCase().includes(query.toLowerCase())),
    [friends, query],
  );
  const peopleLabel = friends.length === 1 ? '1 person in your circle' : `${friends.length} people in your circle`;

  return <Screen title="Friends" eyebrow={peopleLabel}>
    <View style={styles.search}>
      <Search size={19} color={colors.muted} />
      <TextInput style={styles.searchInput} value={query} onChangeText={setQuery} placeholder="Find or add someone" placeholderTextColor={colors.muted} />
      <Pressable accessibilityRole="button" accessibilityLabel="Add friend" onPress={addFriend} disabled={adding} style={styles.addButton}>
        {adding ? <ActivityIndicator size="small" color={colors.ink} /> : <UserPlus size={21} color={colors.ink} />}
      </Pressable>
    </View>

    {loading ? <ActivityIndicator color={colors.ink} style={styles.loader} />
      : error ? <ErrorState message={error} onRetry={load} />
        : visible.length ? visible.map((friend, index) => (
          <Pressable
            key={friend.id}
            accessibilityRole="button"
            accessibilityLabel={`View ${friend.name}'s profile`}
            onPress={() => router.push({ pathname: '/friend/[id]', params: { id: friend.id, data: JSON.stringify(friend) } })}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <PaperCard style={{ backgroundColor: cardColors[index % cardColors.length] }}>
              <View style={styles.friendRow}>
                <Avatar name={friend.name} uri={friend.customProfileImage || friend.profileImage} size={50} color={avatarColors[index % avatarColors.length]} />
                <View style={styles.friendCopy}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{friend.name}</Text>
                    {friend.linkedUserId ? <Text style={styles.amikaBadge}>On Amika</Text> : null}
                  </View>
                  <Text style={styles.counts}>{friend.memoriesCount || 0} memories · {friend.notesCount || 0} journal notes</Text>
                  {friend.howWeMet ? <Text numberOfLines={1} style={styles.note}>{friend.howWeMet}</Text> : null}
                </View>
                <ChevronRight size={20} color={colors.muted} />
              </View>
            </PaperCard>
          </Pressable>
        ))
          : friends.length ? <EmptyState title="No one by that name" body="Try another spelling, or tap Add to start a new friendship pocket." actionLabel={`Add ${query || 'friend'}`} onAction={addFriend} />
            : <EmptyState title="Start your circle" body="Add one person you want to remember the everyday things with." actionLabel="Add the name above" onAction={addFriend} />}
  </Screen>;
}

const styles = StyleSheet.create({
  search: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, paddingHorizontal: 14, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.line },
  searchInput: { flex: 1, fontFamily: type.regular, color: colors.ink, fontSize: 16 },
  addButton: { width: 36, height: 40, alignItems: 'center', justifyContent: 'center' },
  loader: { marginVertical: 40 },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  friendCopy: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { flexShrink: 1, fontFamily: type.heavy, color: colors.ink, fontSize: 17 },
  amikaBadge: { overflow: 'hidden', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: colors.periwinkle, fontFamily: type.heavy, color: colors.ink, fontSize: 9, textTransform: 'uppercase', letterSpacing: .7 },
  counts: { fontFamily: type.medium, color: colors.muted, fontSize: 12, marginTop: 3 },
  note: { fontFamily: type.regular, color: colors.ink, fontSize: 12, marginTop: 5 },
  pressed: { transform: [{ translateY: 2 }], opacity: .92 },
});
