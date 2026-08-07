import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Search, UserPlus } from 'lucide-react-native';
import { Screen } from '@/components/screen';
import { Avatar, EmptyState, ErrorState, PaperCard } from '@/components/ui';
import { api } from '@/lib/api';
import { border, colors, type } from '@/lib/theme';
import type { Friend } from '@/types';

export default function FriendsScreen() {
  const [friends, setFriends] = useState<Friend[]>([]); const [query, setQuery] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [adding, setAdding] = useState(false);
  const load = useCallback(async () => { setLoading(true); setError(''); try { setFriends(await api<Friend[]>('/api/friends')); } catch (e) { setError(e instanceof Error ? e.message : 'Could not load friends.'); } finally { setLoading(false); } }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  async function addFriend() { const name = query.trim(); if (!name) return Alert.alert('Type their name first', 'Use the search box for a name, then tap Add.'); setAdding(true); try { await api('/api/friends', { method: 'POST', body: JSON.stringify({ name }) }); setQuery(''); await load(); } catch (e) { Alert.alert('Friend not added', e instanceof Error ? e.message : 'Try again.'); } finally { setAdding(false); } }
  const visible = friends.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));
  const peopleLabel = friends.length === 1 ? '1 person in your circle' : `${friends.length} people in your circle`;
  return <Screen title="Friends" eyebrow={peopleLabel}><View style={styles.search}><Search size={19} color={colors.muted} /><TextInput style={styles.searchInput} value={query} onChangeText={setQuery} placeholder="Find or add someone" placeholderTextColor={colors.muted} /><Pressable accessibilityLabel="Add friend" onPress={addFriend} disabled={adding}><UserPlus size={21} color={colors.ink} /></Pressable></View>
    {loading ? <ActivityIndicator color={colors.ink} style={{ marginVertical: 40 }} /> : error ? <ErrorState message={error} onRetry={load} /> : visible.length ? visible.map((friend, index) => <PaperCard key={friend.id} style={{ backgroundColor: [colors.white, '#FFF2C9', '#E1E4FF'][index % 3] }}><View style={styles.friendRow}><Avatar name={friend.name} uri={friend.customProfileImage || friend.profileImage} size={50} color={[colors.rose, colors.sky, colors.sage][index % 3]} /><View style={{ flex: 1 }}><Text style={styles.name}>{friend.name}</Text><Text style={styles.counts}>{friend.memoriesCount || 0} memories · {friend.notesCount || 0} journal notes</Text>{friend.howWeMet ? <Text numberOfLines={1} style={styles.note}>{friend.howWeMet}</Text> : null}</View></View></PaperCard>) : friends.length ? <EmptyState title="No one by that name" body="Try another spelling, or tap Add to start a new friendship pocket." actionLabel={`Add ${query || 'friend'}`} onAction={addFriend} /> : <EmptyState title="Start your circle" body="Add one person you want to remember the everyday things with." actionLabel="Add the name above" onAction={addFriend} />}
  </Screen>;
}

const styles = StyleSheet.create({ search: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, paddingHorizontal: 14, backgroundColor: colors.white, ...border }, searchInput: { flex: 1, fontFamily: type.regular, color: colors.ink, fontSize: 16 }, friendRow: { flexDirection: 'row', alignItems: 'center', gap: 13 }, name: { fontFamily: type.heavy, color: colors.ink, fontSize: 17 }, counts: { fontFamily: type.medium, color: colors.muted, fontSize: 12, marginTop: 3 }, note: { fontFamily: type.regular, color: colors.ink, fontSize: 12, marginTop: 5 }, });
