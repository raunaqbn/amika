import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, LockKeyhole, PenLine, Search, UsersRound } from 'lucide-react-native';
import { Screen } from '@/components/screen';
import { MemorySeedling } from '@/components/memory-seedling';
import { ErrorState, Spinner } from '@/components/ui';
import { apiCached, getCachedApiData } from '@/lib/api';
import { getToken } from '@/lib/api';
import { readDurableData } from '@/lib/cache-storage';
import { border, colors, shadow, type } from '@/lib/theme';
import type { Friend, JournalNote } from '@/types';

const JOURNAL_PATH = '/api/diary';
const FRIENDS_PATH = '/api/friends';
const DRAFT_KEY = 'journal-draft-v3';

type JournalDraft = { title: string; input: string; turns: { id: string; role: 'user' | 'assistant'; content: string }[]; friendIds: string[]; updatedAt: string };

export default function JournalScreen() {
  const router = useRouter();
  const cachedNotes = getCachedApiData<JournalNote[]>(JOURNAL_PATH);
  const [notes, setNotes] = useState<JournalNote[]>(cachedNotes || []);
  const [friends, setFriends] = useState<Friend[]>(() => getCachedApiData<Friend[]>(FRIENDS_PATH) || []);
  const [draft, setDraft] = useState<JournalDraft | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(!cachedNotes);
  const [error, setError] = useState('');

  const load = useCallback(async (force = false) => {
    if (!getCachedApiData(JOURNAL_PATH)) setLoading(true);
    setError('');
    try {
      const [nextNotes, nextFriends, token] = await Promise.all([
        apiCached<JournalNote[]>(JOURNAL_PATH, { force }),
        apiCached<Friend[]>(FRIENDS_PATH),
        getToken(),
      ]);
      setNotes(nextNotes);
      setFriends(nextFriends);
      setDraft((await readDurableData<JournalDraft>(token, DRAFT_KEY)) || null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not open your journal.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return notes;
    return notes.filter((note) => [note.title, note.content, note.analysis, ...(note.friends || []).map((friend) => friend.name)].filter(Boolean).join(' ').toLowerCase().includes(term));
  }, [notes, query]);

  return (
    <Screen title="Journal" eyebrow="Private by default">
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.date}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          <Text style={styles.heroTitle}>What’s on your mind?</Text>
          <Text style={styles.heroBody}>Take a breath. Start anywhere—you do not need to make it coherent yet.</Text>
        </View>
        <MemorySeedling size={88} />
      </View>

      {draft ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/journal/write' as never)} style={({ pressed }) => [styles.resume, pressed && styles.pressed]}>
          <View style={styles.actionMark}><PenLine size={20} color={colors.mossDeep} /></View>
          <View style={styles.actionCopy}>
            <Text style={styles.resumeKicker}>Continue saved draft</Text>
            <Text numberOfLines={1} style={styles.actionTitle}>{draft.title || 'Untitled thought'}</Text>
            <Text numberOfLines={1} style={styles.actionBody}>{draft.input || draft.turns.filter((turn) => turn.role === 'user').at(-1)?.content || 'Your words are waiting.'}</Text>
          </View>
          <ChevronRight size={19} color={colors.muted} />
        </Pressable>
      ) : null}

      <Pressable accessibilityRole="button" onPress={() => router.push('/journal/write' as never)} style={({ pressed }) => [styles.begin, pressed && styles.pressed]}>
        <View style={styles.actionMark}><PenLine size={20} color={colors.mossDeep} /></View>
        <View style={styles.actionCopy}>
          <Text style={styles.beginTitle}>Begin writing</Text>
          <Text style={styles.beginBody}>A thought, a feeling, something that happened—whatever is present.</Text>
        </View>
        <ChevronRight size={19} color={colors.white} />
      </Pressable>

      <View style={styles.activity}>
        <Text style={styles.activityText}>{notes.length ? `${notes.length} ${notes.length === 1 ? 'entry' : 'entries'} in your journal` : 'A fresh page is waiting'}</Text>
        <View style={styles.private}><LockKeyhole size={13} color={colors.muted} /><Text style={styles.activityText}>Just yours</Text></View>
      </View>

      <View style={styles.libraryHeader}>
        <View><Text style={styles.sectionKicker}>Your journal</Text><Text style={styles.sectionTitle}>Recent writing</Text></View>
      </View>
      <View style={styles.search}><Search size={17} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Search your words" placeholderTextColor={colors.muted} style={styles.searchInput} /></View>

      {loading ? <Spinner color={colors.moss} style={styles.loading} /> : error ? <ErrorState message={error} onRetry={() => void load(true)} /> : filtered.length ? filtered.map((note) => (
        <Pressable key={note.id} accessibilityRole="button" accessibilityLabel={`Open ${note.title || 'untitled journal entry'} for editing`} onPress={() => router.push({ pathname: '/journal/write', params: { id: note.id } } as never)} style={({ pressed }) => [styles.entry, pressed && styles.entryPressed]}>
          <Text style={styles.entryDate}>{new Date(note.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
          <Text style={styles.entryTitle}>{note.title || 'Untitled entry'}</Text>
          <Text numberOfLines={4} style={styles.entryContent}>{note.content}</Text>
          {note.friends?.length ? <View style={styles.people}><UsersRound size={14} color={colors.muted} /><Text style={styles.peopleText}>{note.friends.map((friend) => friend.name).join(', ')}</Text></View> : null}
          {note.analysis ? <View style={styles.reflection}><View style={styles.reflectionTitle}><MemorySeedling size={28} /><Text style={styles.reflectionLabel}>A gentle reflection</Text></View><Text numberOfLines={3} style={styles.reflectionText}>{note.analysis}</Text></View> : null}
          <View style={styles.entryAction}><Text style={styles.entryActionText}>Open and edit</Text><ChevronRight size={16} color={colors.moss} /></View>
        </Pressable>
      )) : (
        <View style={styles.empty}><MemorySeedling size={92} /><Text style={styles.emptyTitle}>{query ? 'No entries match' : 'A blank page, in a good way'}</Text><Text style={styles.emptyBody}>{query ? 'Try a feeling, a person, or a phrase you remember writing.' : 'This space is for the part of a memory that only needs to belong to you.'}</Text></View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { minHeight: 210, flexDirection: 'row', alignItems: 'center', gap: 15, padding: 20, borderRadius: 18, backgroundColor: colors.apricotSoft, ...border, ...shadow },
  heroCopy: { flex: 1 }, date: { fontFamily: type.heavy, color: colors.terracottaDeep, fontSize: 10, letterSpacing: .4 },
  heroTitle: { marginTop: 6, fontFamily: type.heavy, color: colors.mossDeep, fontSize: 34, lineHeight: 37, letterSpacing: -1.2 },
  heroBody: { marginTop: 9, maxWidth: 260, fontFamily: type.regular, color: colors.muted, fontSize: 14, lineHeight: 21 },
  resume: { minHeight: 84, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.white, ...border },
  begin: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.moss, ...shadow },
  pressed: { transform: [{ translateY: 2 }] }, actionMark: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.apricot }, actionCopy: { flex: 1, gap: 2 },
  resumeKicker: { fontFamily: type.heavy, color: colors.terracottaDeep, fontSize: 10 }, actionTitle: { fontFamily: type.heavy, color: colors.mossDeep, fontSize: 15 }, actionBody: { fontFamily: type.regular, color: colors.muted, fontSize: 12 },
  beginTitle: { fontFamily: type.heavy, color: colors.white, fontSize: 16 }, beginBody: { fontFamily: type.regular, color: '#E9E6DE', fontSize: 12, lineHeight: 17 },
  activity: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 3 }, activityText: { fontFamily: type.medium, color: colors.muted, fontSize: 11 }, private: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  libraryHeader: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }, sectionKicker: { fontFamily: type.heavy, color: colors.terracottaDeep, fontSize: 10 }, sectionTitle: { marginTop: 2, fontFamily: type.heavy, color: colors.mossDeep, fontSize: 27, letterSpacing: -.8 },
  search: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 13, borderRadius: 14, backgroundColor: colors.white, ...border }, searchInput: { flex: 1, fontFamily: type.regular, color: colors.mossDeep, fontSize: 14 }, loading: { alignSelf: 'center', marginVertical: 45 },
  entry: { padding: 18, borderRadius: 16, backgroundColor: colors.white, ...border }, entryPressed: { backgroundColor: colors.paperDeep }, entryDate: { fontFamily: type.heavy, color: colors.terracottaDeep, fontSize: 10 }, entryTitle: { marginTop: 5, fontFamily: type.heavy, color: colors.mossDeep, fontSize: 20 }, entryContent: { marginTop: 8, fontFamily: type.regular, color: colors.mossDeep, fontSize: 15, lineHeight: 23 }, entryAction: { marginTop: 14, paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.flax }, entryActionText: { fontFamily: type.heavy, color: colors.moss, fontSize: 11 },
  people: { marginTop: 13, flexDirection: 'row', alignItems: 'center', gap: 7 }, peopleText: { flex: 1, fontFamily: type.medium, color: colors.muted, fontSize: 12 }, reflection: { marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: colors.apricotSoft }, reflectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 7 }, reflectionLabel: { fontFamily: type.heavy, color: colors.mossDeep, fontSize: 12 }, reflectionText: { marginTop: 8, fontFamily: type.regular, color: colors.muted, fontSize: 13, lineHeight: 19 },
  empty: { alignItems: 'center', paddingVertical: 42, paddingHorizontal: 20 }, emptyTitle: { marginTop: 8, fontFamily: type.heavy, color: colors.mossDeep, fontSize: 21, textAlign: 'center' }, emptyBody: { marginTop: 6, maxWidth: 300, fontFamily: type.regular, color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
