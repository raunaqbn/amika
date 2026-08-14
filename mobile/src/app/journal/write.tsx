import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, ChevronDown, LockKeyhole, Send, Sparkles, Trash2 } from 'lucide-react-native';
import { FriendTagPicker } from '@/components/friend-tag-picker';
import { MemorySeedling } from '@/components/memory-seedling';
import { Spinner } from '@/components/ui';
import { api, apiCached, getToken, invalidateApiCache } from '@/lib/api';
import { readDurableData, removeDurableData, writeDurableData } from '@/lib/cache-storage';
import { border, colors, shadow, type } from '@/lib/theme';
import type { Friend, JournalNote } from '@/types';

const DRAFT_KEY = 'journal-draft-v3';
type Turn = { id: string; role: 'user' | 'assistant'; content: string };
type JournalDraft = { title: string; input: string; turns: Turn[]; friendIds: string[]; updatedAt: string };

export default function JournalWriterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const noteId = typeof params.id === 'string' ? params.id : undefined;
  const draftKey = noteId ? `${DRAFT_KEY}-edit-${noteId}` : DRAFT_KEY;
  const [friends, setFriends] = useState<Friend[]>([]);
  const [title, setTitle] = useState('');
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [responding, setResponding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const scrollRef = useRef<ScrollView>(null);
  const draftQueue = useRef<Promise<void>>(Promise.resolve());
  const draftRevision = useRef(0);

  useEffect(() => {
    void Promise.all([apiCached<Friend[]>('/api/friends'), apiCached<JournalNote[]>('/api/diary'), getToken()]).then(async ([nextFriends, notes, token]) => {
      setFriends(nextFriends);
      const stored = await readDurableData<JournalDraft>(token, draftKey);
      if (stored) {
        setTitle(stored.title);
        setInput(stored.input);
        setTurns(stored.turns);
        setFriendIds(stored.friendIds);
        setDraftStatus('saved');
      } else if (noteId) {
        const note = notes.find((candidate) => candidate.id === noteId);
        if (note) {
          setTitle(note.title || '');
          setTurns([{ id: `entry-${note.id}`, role: 'user', content: note.content }]);
          setFriendIds((note.friends || []).map((friend) => friend.id));
        }
      }
    }).catch((cause) => {
      Alert.alert('Could not open this entry', cause instanceof Error ? cause.message : 'Please try again.');
    }).finally(() => setHydrated(true));
  }, [draftKey, noteId]);

  useEffect(() => {
    if (!hydrated) return;
    const revision = ++draftRevision.current;
    setDraftStatus('saving');
    draftQueue.current = draftQueue.current.catch(() => undefined).then(async () => {
      const token = await getToken();
      const hasWords = input.trim() || turns.some((turn) => turn.role === 'user' && turn.content.trim());
      if (!hasWords) {
        await removeDurableData(token, [draftKey]);
        if (revision === draftRevision.current) setDraftStatus('idle');
        return;
      }
      await writeDurableData(token, draftKey, { title, input, turns, friendIds, updatedAt: new Date().toISOString() } satisfies JournalDraft);
      if (revision === draftRevision.current) setDraftStatus('saved');
    }).catch(() => {
      if (revision === draftRevision.current) setDraftStatus('error');
    });
  }, [draftKey, friendIds, hydrated, input, title, turns]);

  useEffect(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, [responding, turns]);

  const body = useMemo(() => [...turns.filter((turn) => turn.role === 'user').map((turn) => turn.content.trim()), input.trim()].filter(Boolean).join('\n\n'), [input, turns]);
  const words = body ? body.split(/\s+/).length : 0;

  async function askAmika() {
    const clean = input.trim();
    if (!clean) return Alert.alert('Write one honest thought', 'Amika will respond when there is something to hold onto.');
    const userTurn: Turn = { id: `user-${Date.now()}`, role: 'user', content: clean };
    const nextTurns = [...turns, userTurn];
    setTurns(nextTurns);
    setInput('');
    setResponding(true);
    try {
      const result = await api<{ message: string }>('/api/journal-guide', { method: 'POST', body: JSON.stringify({ body: nextTurns.filter((turn) => turn.role === 'user').map((turn) => turn.content).join('\n\n'), turns: nextTurns }) });
      setTurns([...nextTurns, { id: `amika-${Date.now()}`, role: 'assistant', content: result.message }]);
    } catch (cause) {
      Alert.alert('Amika could not respond', cause instanceof Error ? cause.message : 'Your draft is still safe.');
    } finally {
      setResponding(false);
    }
  }

  async function save() {
    if (!body) return Alert.alert('Write one honest thought', 'Your entry needs a little something to hold.');
    setSaving(true);
    try {
      const firstLine = body.split(/\n|[.!?]\s/)[0]?.trim();
      await api('/api/diary', { method: noteId ? 'PUT' : 'POST', body: JSON.stringify({ ...(noteId ? { id: noteId } : {}), title: title.trim() || firstLine?.slice(0, 64) || null, content: body, savedReflection: turns.filter((turn) => turn.role === 'assistant').at(-1)?.content || null, friendIds, friendTags: friendIds.map((friendId) => ({ friendId, sharedWithFriend: false })) }) });
      const token = await getToken();
      await removeDurableData(token, [draftKey]);
      invalidateApiCache('/api/diary');
      router.back();
    } catch (cause) {
      Alert.alert('Entry not saved', cause instanceof Error ? cause.message : 'Your draft is still safe.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (!noteId) return;
    Alert.alert('Delete this entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteEntry() },
    ]);
  }

  async function deleteEntry() {
    if (!noteId) return;
    setSaving(true);
    try {
      await api(`/api/diary?id=${encodeURIComponent(noteId)}`, { method: 'DELETE' });
      const token = await getToken();
      await removeDurableData(token, [draftKey]);
      invalidateApiCache('/api/diary');
      router.back();
    } catch (cause) {
      Alert.alert('Entry not deleted', cause instanceof Error ? cause.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to journal" onPress={() => router.back()} style={styles.back}><ArrowLeft size={18} color={colors.mossDeep} /><Text style={styles.backText}>Back</Text></Pressable>
          <View style={styles.brand}><MemorySeedling size={38} /><View><Text style={styles.brandTitle}>Journal with Amika</Text><Text style={styles.brandBody}>{noteId ? 'Edit your entry' : turns.filter((turn) => turn.role === 'user').length ? `${turns.filter((turn) => turn.role === 'user').length} writing turns` : 'Write, reflect, then save'}</Text></View></View>
        </View>
        <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.intro}><MemorySeedling size={72} /><View style={{ flex: 1 }}><Text style={styles.speaker}>AMIKA</Text><Text style={styles.prompt}>What’s on your mind?</Text><Text style={styles.promptBody}>Start with one honest thought. I’ll only respond when you ask.</Text></View></View>
          {turns.map((turn) => <View key={turn.id} style={turn.role === 'assistant' ? styles.assistantTurn : styles.userTurn}>{turn.role === 'assistant' ? <View style={styles.turnSpeaker}><MemorySeedling size={28} /><Text style={styles.speaker}>AMIKA</Text></View> : <Text style={styles.turnLabel}>YOU WROTE</Text>}<Text style={styles.turnText}>{turn.content}</Text></View>)}
          {responding ? <View style={styles.thinking}><Spinner size="small" color={colors.moss} /><Text style={styles.thinkingText}>Amika is reading your words…</Text></View> : null}
          <View style={styles.composer}><TextInput value={input} onChangeText={setInput} multiline placeholder={turns.length ? 'Keep writing…' : 'Write what is true before trying to make it tidy…'} placeholderTextColor="#8B8173" style={styles.input} textAlignVertical="top" maxLength={4000} autoFocus /><View style={styles.composerFooter}><Text style={[styles.wordCount, draftStatus === 'error' && styles.draftError]}>{words} words · {draftStatus === 'saved' ? 'Saved on this device' : draftStatus === 'saving' ? 'Saving draft…' : draftStatus === 'error' ? 'Draft not saved' : 'New draft'}</Text><Pressable disabled={responding || !input.trim()} onPress={() => void askAmika()} style={[styles.respond, (responding || !input.trim()) && styles.disabled]}><Text style={styles.respondText}>Get a response</Text><Send size={15} color={colors.white} /></Pressable></View></View>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: detailsOpen }} accessibilityHint="Shows the title and private people tags" onPress={() => setDetailsOpen((open) => !open)} style={styles.detailsToggle}><Sparkles size={17} color={colors.terracotta} /><Text style={styles.detailsToggleText}>Entry details</Text><ChevronDown size={17} color={colors.muted} style={detailsOpen ? styles.chevronOpen : undefined} /></Pressable>
          {detailsOpen ? <View style={styles.details}><Text style={styles.fieldLabel}>TITLE <Text style={styles.optional}>OPTIONAL</Text></Text><TextInput value={title} onChangeText={setTitle} placeholder="A small realization" placeholderTextColor={colors.muted} style={styles.titleInput} /><Text style={styles.fieldLabel}>PEOPLE IN THIS NOTE <Text style={styles.optional}>PRIVATE TAGS</Text></Text><FriendTagPicker friends={friends} selectedIds={friendIds} onChange={setFriendIds} multiple emptyLabel="Just me" helper="Tags help you find this entry later. They do not share it." /><View style={styles.privacy}><LockKeyhole size={14} color={colors.muted} /><Text style={styles.privacyText}>This journal entry stays private.</Text></View></View> : null}
        </ScrollView>
        <View style={styles.footer}>{noteId ? <Pressable accessibilityRole="button" accessibilityLabel="Delete journal entry" onPress={confirmDelete} style={styles.delete}><Trash2 size={18} color={colors.danger} /></Pressable> : <View style={styles.footerNote}><Sparkles size={15} color={colors.terracotta} /><Text style={styles.footerNoteText}>One gentle question at a time.</Text></View>}<Pressable disabled={saving || responding || !body} onPress={() => void save()} style={[styles.save, (saving || responding || !body) && styles.disabled]}>{saving ? <Spinner size="small" color={colors.white} /> : <Check size={16} color={colors.white} />}<Text style={styles.saveText}>{saving ? 'Keeping entry…' : noteId ? 'Save changes' : 'Finish & keep entry'}</Text></Pressable></View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper }, header: { minHeight: 66, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: colors.white, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.flax }, back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5 }, backText: { fontFamily: type.heavy, color: colors.mossDeep, fontSize: 13 }, brand: { flexDirection: 'row', alignItems: 'center', gap: 7 }, brandTitle: { fontFamily: type.heavy, color: colors.mossDeep, fontSize: 13 }, brandBody: { fontFamily: type.regular, color: colors.muted, fontSize: 10 },
  content: { padding: 18, paddingBottom: 28, gap: 18 }, intro: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingBottom: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.flax }, speaker: { fontFamily: type.heavy, color: colors.terracottaDeep, fontSize: 10, letterSpacing: .9 }, prompt: { marginTop: 3, fontFamily: type.heavy, color: colors.mossDeep, fontSize: 28, lineHeight: 32, letterSpacing: -.8 }, promptBody: { marginTop: 5, fontFamily: type.regular, color: colors.muted, fontSize: 13, lineHeight: 19 },
  userTurn: { gap: 6 }, assistantTurn: { gap: 7, padding: 16, borderRadius: 16, backgroundColor: colors.apricotSoft }, turnSpeaker: { flexDirection: 'row', alignItems: 'center', gap: 6 }, turnLabel: { fontFamily: type.heavy, color: colors.muted, fontSize: 10, letterSpacing: .8 }, turnText: { fontFamily: type.regular, color: colors.mossDeep, fontSize: 15, lineHeight: 23 }, thinking: { flexDirection: 'row', alignItems: 'center', gap: 9 }, thinkingText: { fontFamily: type.medium, color: colors.muted, fontSize: 12 },
  composer: { overflow: 'hidden', borderRadius: 16, backgroundColor: colors.white, ...border, ...shadow }, input: { minHeight: 170, padding: 16, fontFamily: type.regular, color: colors.mossDeep, fontSize: 16, lineHeight: 24 }, composerFooter: { minHeight: 58, paddingHorizontal: 10, paddingLeft: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.flax }, wordCount: { flex: 1, fontFamily: type.medium, color: colors.muted, fontSize: 10 }, draftError: { color: colors.danger }, respond: { minHeight: 40, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 12, backgroundColor: colors.moss }, respondText: { fontFamily: type.heavy, color: colors.white, fontSize: 12 }, disabled: { opacity: .42 },
  detailsToggle: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, borderRadius: 14, backgroundColor: colors.paperDeep, ...border }, detailsToggleText: { flex: 1, fontFamily: type.heavy, color: colors.mossDeep, fontSize: 13 }, chevronOpen: { transform: [{ rotate: '180deg' }] }, details: { gap: 11, padding: 15, borderRadius: 16, backgroundColor: colors.paperDeep }, fieldLabel: { fontFamily: type.heavy, color: colors.mossDeep, fontSize: 10, letterSpacing: .8 }, optional: { color: colors.muted, fontFamily: type.medium }, titleInput: { minHeight: 46, paddingHorizontal: 13, borderRadius: 13, backgroundColor: colors.white, fontFamily: type.regular, color: colors.mossDeep, fontSize: 14, ...border }, privacy: { flexDirection: 'row', alignItems: 'center', gap: 7 }, privacyText: { fontFamily: type.medium, color: colors.muted, fontSize: 11 },
  footer: { padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, backgroundColor: colors.white, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.flax }, footerNote: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }, footerNoteText: { fontFamily: type.medium, color: colors.muted, fontSize: 10 }, delete: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.paperDeep, ...border }, save: { minHeight: 46, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 13, backgroundColor: colors.moss }, saveText: { fontFamily: type.heavy, color: colors.white, fontSize: 12 },
});
