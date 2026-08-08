import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Check, ChevronRight, Clock3, Search, UserPlus, X } from 'lucide-react-native';
import { Screen } from '@/components/screen';
import { Avatar, EmptyState, ErrorState, PaperCard } from '@/components/ui';
import { useAuth } from '@/context/auth';
import { api, apiCached, getCachedApiData, invalidateApiCache } from '@/lib/api';
import { border, colors, shadow, type } from '@/lib/theme';
import type { Connection, DiscoverableUser, Friend } from '@/types';

const FRIENDS_PATH = '/api/friends';
const CONNECTIONS_PATH = '/api/connections';
const cardColors = [colors.white, '#FFF2C9', '#E1E4FF'];
const avatarColors = [colors.rose, colors.sky, colors.sage];

type ConnectionState = 'none' | 'sent' | 'received' | 'accepted';

export default function FriendsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const cachedFriends = getCachedApiData<Friend[]>(FRIENDS_PATH);
  const cachedConnections = getCachedApiData<Connection[]>(CONNECTIONS_PATH);
  const [friends, setFriends] = useState<Friend[]>(cachedFriends || []);
  const [connections, setConnections] = useState<Connection[]>(cachedConnections || []);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DiscoverableUser[]>([]);
  const [loading, setLoading] = useState(!cachedFriends);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [searchError, setSearchError] = useState('');
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [addingPrivate, setAddingPrivate] = useState(false);
  const searchSequence = useRef(0);

  const load = useCallback(async (force = false) => {
    if (!getCachedApiData(FRIENDS_PATH)) setLoading(true);
    setError('');
    try {
      const [nextFriends, nextConnections] = await Promise.all([
        apiCached<Friend[]>(FRIENDS_PATH, { force }),
        apiCached<Connection[]>(CONNECTIONS_PATH, { force }),
      ]);
      setFriends(nextFriends);
      setConnections(nextConnections);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load friends.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  useEffect(() => {
    const trimmedQuery = query.trim();
    const sequence = ++searchSequence.current;
    if (trimmedQuery.length < 2) {
      setSearchResults([]);
      setSearchError('');
      setSearching(false);
      return;
    }

    setSearchResults([]);
    setSearchError('');
    setSearching(true);
    const timer = setTimeout(() => {
      void api<DiscoverableUser[]>(`/api/users/search?q=${encodeURIComponent(trimmedQuery)}`)
        .then((results) => {
          if (searchSequence.current === sequence) setSearchResults(results);
        })
        .catch((searchFailure) => {
          if (searchSequence.current !== sequence) return;
          setSearchResults([]);
          setSearchError(searchFailure instanceof Error ? searchFailure.message : 'Could not search Amika right now.');
        })
        .finally(() => {
          if (searchSequence.current === sequence) setSearching(false);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const connectionByUserId = useMemo(() => {
    const result = new Map<string, { connection: Connection; state: ConnectionState }>();
    connections.forEach((connection) => {
      const otherUserId = connection.otherUser?.id
        || (connection.requesterId === user?.id ? connection.addresseeId : connection.requesterId);
      if (!otherUserId || connection.status === 'rejected') return;
      const state: ConnectionState = connection.status === 'accepted'
        ? 'accepted'
        : connection.requesterId === user?.id ? 'sent' : 'received';
      result.set(otherUserId, { connection, state });
    });
    return result;
  }, [connections, user?.id]);

  const pendingRequests = useMemo(
    () => connections.filter((connection) => connection.status === 'pending' && connection.addresseeId === user?.id && connection.otherUser),
    [connections, user?.id],
  );

  const visibleFriends = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return friends;
    return friends.filter((friend) => friend.name.toLowerCase().includes(normalizedQuery) || friend.email?.toLowerCase().includes(normalizedQuery));
  }, [friends, query]);

  async function connectWith(discoveredUser: DiscoverableUser) {
    const existing = connectionByUserId.get(discoveredUser.id);
    if (existing?.state === 'sent' || existing?.state === 'accepted') return;
    setActionUserId(discoveredUser.id);
    setSearchError('');
    try {
      if (existing?.state === 'received') {
        await api('/api/connections', {
          method: 'PUT',
          body: JSON.stringify({ id: existing.connection.id, status: 'accepted' }),
        });
        setConnections((current) => current.map((connection) => connection.id === existing.connection.id ? { ...connection, status: 'accepted' } : connection));
        invalidateApiCache(FRIENDS_PATH);
        invalidateApiCache(CONNECTIONS_PATH);
        await load(true);
        return;
      }

      const created = await api<Omit<Connection, 'otherUser'>>('/api/connections', {
        method: 'POST',
        body: JSON.stringify({ addresseeId: discoveredUser.id }),
      });
      setConnections((current) => [{ ...created, otherUser: discoveredUser }, ...current]);
      invalidateApiCache(CONNECTIONS_PATH);
    } catch (connectionError) {
      setSearchError(connectionError instanceof Error ? connectionError.message : 'Could not send the friend request.');
    } finally {
      setActionUserId(null);
    }
  }

  async function acceptRequest(connection: Connection) {
    if (!connection.otherUser) return;
    await connectWith(connection.otherUser);
  }

  async function addPrivateFriend() {
    const name = query.trim();
    if (!name) return Alert.alert('Type their name first', 'Enter a name, then save them as a private friend.');
    setAddingPrivate(true);
    try {
      await api('/api/friends', { method: 'POST', body: JSON.stringify({ name }) });
      invalidateApiCache(FRIENDS_PATH);
      setQuery('');
      await load(true);
    } catch (addError) {
      Alert.alert('Friend not added', addError instanceof Error ? addError.message : 'Try again.');
    } finally {
      setAddingPrivate(false);
    }
  }

  const peopleLabel = friends.length === 1 ? '1 person in your circle' : `${friends.length} people in your circle`;
  const trimmedQuery = query.trim();

  return <Screen title="Friends" eyebrow={peopleLabel}>
    <View style={styles.search}>
      <Search size={19} color={colors.muted} />
      <TextInput
        accessibilityLabel="Search people on Amika"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={styles.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder="Search name or email"
        placeholderTextColor={colors.muted}
      />
      {query ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10} onPress={() => setQuery('')} style={styles.clearButton}><X size={19} color={colors.muted} /></Pressable> : null}
    </View>
    <Text style={styles.searchHint}>{trimmedQuery.length === 1 ? 'Type one more character to search Amika.' : 'Find people already on Amika, or keep someone as a private friend.'}</Text>

    {!trimmedQuery && pendingRequests.length ? <View style={styles.section}>
      <Text style={styles.sectionLabel}>Friend requests</Text>
      <View style={styles.discoveryPanel}>
        {pendingRequests.map((connection, index) => {
          const person = connection.otherUser!;
          return <View key={connection.id} style={[styles.discoveryRow, index > 0 && styles.rowDivider]}>
            <Avatar name={person.name} uri={person.profileImage} size={46} color={colors.sky} />
            <View style={styles.discoveryCopy}><Text numberOfLines={1} style={styles.name}>{person.name}</Text><Text numberOfLines={1} style={styles.email}>{person.email}</Text></View>
            <ConnectionButton state="received" loading={actionUserId === person.id} name={person.name} onPress={() => void acceptRequest(connection)} />
          </View>;
        })}
      </View>
    </View> : null}

    {trimmedQuery.length >= 2 ? <View style={styles.section}>
      <Text style={styles.sectionLabel}>People on Amika</Text>
      {searching && !searchResults.length ? <View style={styles.searchingRow}><ActivityIndicator color={colors.ink} /><Text style={styles.searchingText}>Searching Amika…</Text></View> : null}
      {searchError ? <View style={styles.inlineError}><Text style={styles.inlineErrorText}>{searchError}</Text></View> : null}
      {!searching && !searchError && !searchResults.length ? <View style={styles.noResults}>
        <Text style={styles.noResultsTitle}>No Amika account found</Text>
        <Text style={styles.noResultsBody}>Check the spelling or save “{trimmedQuery}” as a private friend for your own memories.</Text>
        <Pressable accessibilityRole="button" onPress={() => void addPrivateFriend()} disabled={addingPrivate} style={({ pressed }) => [styles.privateButton, pressed && styles.pressed]}>
          {addingPrivate ? <ActivityIndicator size="small" color={colors.ink} /> : <><UserPlus size={18} color={colors.ink} /><Text style={styles.privateButtonText}>Save as private friend</Text></>}
        </Pressable>
      </View> : null}
      {searchResults.length ? <View style={styles.discoveryPanel}>
        {searchResults.map((person, index) => <View key={person.id} style={[styles.discoveryRow, index > 0 && styles.rowDivider]}>
          <Avatar name={person.name} uri={person.profileImage} size={46} color={avatarColors[index % avatarColors.length]} />
          <View style={styles.discoveryCopy}><Text numberOfLines={1} style={styles.name}>{person.name}</Text><Text numberOfLines={1} style={styles.email}>{person.email}</Text></View>
          <ConnectionButton state={connectionByUserId.get(person.id)?.state || 'none'} loading={actionUserId === person.id} name={person.name} onPress={() => void connectWith(person)} />
        </View>)}
      </View> : null}
    </View> : null}

    {loading ? <ActivityIndicator color={colors.ink} style={styles.loader} />
      : error ? <ErrorState message={error} onRetry={load} />
        : <View style={styles.section}>
          <Text style={styles.sectionLabel}>{trimmedQuery ? 'In your circle' : 'Your circle'}</Text>
          {visibleFriends.length ? visibleFriends.map((friend, index) => (
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
                      <Text numberOfLines={1} style={styles.name}>{friend.name}</Text>
                      {friend.linkedUserId ? <Text style={styles.amikaBadge}>On Amika</Text> : null}
                    </View>
                    <Text style={styles.counts}>{friend.memoriesCount || 0} memories · {friend.notesCount || 0} journal notes</Text>
                    {friend.howWeMet ? <Text numberOfLines={1} style={styles.note}>{friend.howWeMet}</Text> : null}
                  </View>
                  <ChevronRight size={20} color={colors.muted} />
                </View>
              </PaperCard>
            </Pressable>
          )) : !trimmedQuery ? <EmptyState title="Start your circle" body="Search for someone on Amika above, or type a name to keep them privately." /> : null}
        </View>}
  </Screen>;
}

function ConnectionButton({ state, loading, name, onPress }: { state: ConnectionState; loading: boolean; name: string; onPress: () => void }) {
  const disabled = loading || state === 'sent' || state === 'accepted';
  const label = state === 'accepted' ? 'Friends' : state === 'sent' ? 'Sent' : state === 'received' ? 'Accept' : 'Add';
  const Icon = state === 'accepted' ? Check : state === 'sent' ? Clock3 : UserPlus;
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={`${label} ${name}`}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [styles.connectionButton, state === 'received' && styles.acceptButton, disabled && styles.connectionButtonDisabled, pressed && styles.pressed]}
  >
    {loading ? <ActivityIndicator size="small" color={colors.ink} /> : <><Icon size={16} color={colors.ink} /><Text style={styles.connectionButtonText}>{label}</Text></>}
  </Pressable>;
}

const styles = StyleSheet.create({
  search: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, paddingHorizontal: 14, backgroundColor: colors.white, ...border },
  searchInput: { flex: 1, fontFamily: type.regular, color: colors.ink, fontSize: 16 },
  clearButton: { width: 32, height: 40, alignItems: 'center', justifyContent: 'center' },
  searchHint: { marginTop: 8, marginBottom: 3, paddingHorizontal: 3, fontFamily: type.regular, color: colors.muted, fontSize: 12, lineHeight: 17 },
  section: { marginTop: 17, gap: 10 },
  sectionLabel: { paddingHorizontal: 3, fontFamily: type.heavy, color: colors.ink, fontSize: 12, letterSpacing: .9, textTransform: 'uppercase' },
  discoveryPanel: { overflow: 'hidden', borderRadius: 18, backgroundColor: colors.white, ...border, ...shadow },
  discoveryRow: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 13, paddingVertical: 12 },
  rowDivider: { borderTopWidth: 1.5, borderTopColor: colors.line },
  discoveryCopy: { flex: 1, minWidth: 0 },
  email: { marginTop: 2, fontFamily: type.regular, color: colors.muted, fontSize: 12 },
  connectionButton: { minWidth: 72, minHeight: 38, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 12, backgroundColor: colors.citrus, ...border },
  acceptButton: { backgroundColor: colors.sage },
  connectionButtonDisabled: { backgroundColor: colors.paperDeep, opacity: .72 },
  connectionButtonText: { fontFamily: type.heavy, color: colors.ink, fontSize: 12 },
  searchingRow: { minHeight: 74, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 18, backgroundColor: colors.white, ...border },
  searchingText: { fontFamily: type.medium, color: colors.muted, fontSize: 14 },
  inlineError: { borderRadius: 14, padding: 13, backgroundColor: '#FBE2DE', ...border },
  inlineErrorText: { fontFamily: type.medium, color: colors.danger, fontSize: 13, lineHeight: 18 },
  noResults: { alignItems: 'flex-start', borderRadius: 18, padding: 17, backgroundColor: colors.white, ...border },
  noResultsTitle: { fontFamily: type.heavy, color: colors.ink, fontSize: 17 },
  noResultsBody: { marginTop: 4, fontFamily: type.regular, color: colors.muted, fontSize: 13, lineHeight: 19 },
  privateButton: { minHeight: 42, marginTop: 14, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 12, backgroundColor: colors.sky, ...border },
  privateButtonText: { fontFamily: type.heavy, color: colors.ink, fontSize: 13 },
  loader: { marginVertical: 40 },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  friendCopy: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { flexShrink: 1, fontFamily: type.heavy, color: colors.ink, fontSize: 17 },
  amikaBadge: { overflow: 'hidden', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: colors.periwinkle, fontFamily: type.heavy, color: colors.ink, fontSize: 9, textTransform: 'uppercase', letterSpacing: .7 },
  counts: { fontFamily: type.medium, color: colors.muted, fontSize: 12, marginTop: 3 },
  note: { fontFamily: type.regular, color: colors.ink, fontSize: 12, marginTop: 5 },
  pressed: { transform: [{ translateY: 2 }], opacity: .92 },
});
