import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AppState, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Check, ChevronRight, MessageCircle, Search, SquarePen, Users, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Screen } from '@/components/screen';
import { Avatar, EmptyState, ErrorState, PaperCard, Spinner } from '@/components/ui';
import { api, apiCached, getCachedApiData, setCachedApiData } from '@/lib/api';
import { refreshNotificationCount } from '@/lib/notification-count';
import { border, colors, shadow, type } from '@/lib/theme';
import type { DiscoverableUser, Thread } from '@/types';

const MESSAGES_PATH = '/api/messages';
const THREAD_POLL_MS = 5_000;

function sameThreads(current: Thread[], next: Thread[]) {
  return current.length === next.length && current.every((thread, index) => {
    const candidate = next[index];
    if (!candidate) return false;
    return thread.id === candidate.id
      && thread.kind === candidate.kind
      && thread.name === candidate.name
      && thread.profileImage === candidate.profileImage
      && thread.lastMessage === candidate.lastMessage
      && thread.lastMessageAt === candidate.lastMessageAt
      && thread.unreadCount === candidate.unreadCount
      && thread.memberCount === candidate.memberCount;
  });
}

export default function MessagesScreen() {
  const router = useRouter();
  const cachedThreads = getCachedApiData<Thread[]>(MESSAGES_PATH);
  const [threads, setThreads] = useState<Thread[]>(cachedThreads || []);
  const threadsRef = useRef(cachedThreads || []);
  const [loading, setLoading] = useState(!cachedThreads);
  const [error, setError] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);

  const load = useCallback(async (force = false) => {
    if (!getCachedApiData(MESSAGES_PATH)) setLoading(true);
    setError('');
    try {
      const nextThreads = force
        ? await api<Thread[]>(MESSAGES_PATH)
        : await apiCached<Thread[]>(MESSAGES_PATH);
      if (!sameThreads(threadsRef.current, nextThreads)) {
        threadsRef.current = nextThreads;
        setThreads(setCachedApiData(MESSAGES_PATH, nextThreads));
      }
      void refreshNotificationCount().catch(() => {});
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load messages.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load(true);
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') void load(true);
    }, THREAD_POLL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void load(true);
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [load]));

  const existingThreads = threads.filter((thread) => Boolean(thread.lastMessageAt));
  const composeButton = <Pressable
    accessibilityRole="button"
    accessibilityLabel="Start a new chat"
    onPress={() => setNewChatOpen(true)}
    style={({ pressed }) => [styles.composeButton, pressed && styles.pressed]}
  ><SquarePen size={20} color={colors.ink} /></Pressable>;

  const openThread = (thread: Thread) => router.push({
    pathname: '/conversation/[id]',
    params: {
      id: thread.id,
      name: thread.name,
      image: thread.profileImage || '',
      kind: thread.kind,
      memberCount: String(thread.memberCount || thread.members?.length || 0),
    },
  });

  return <>
    <Screen title="Messages" eyebrow="A quieter place to talk" action={composeButton}>
      {loading ? <Spinner color={colors.ink} style={{ marginVertical: 40 }} />
        : error ? <ErrorState message={error} onRetry={load} />
          : existingThreads.length ? existingThreads.map((thread, index) => <Pressable
            key={`${thread.kind}-${thread.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Open chat with ${thread.name}`}
            onPress={() => openThread(thread)}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <PaperCard style={{ backgroundColor: index % 2 ? '#FFF2C9' : colors.white }}>
              <View style={styles.row}>
                <View>
                  <Avatar name={thread.name} uri={thread.profileImage} color={index % 2 ? colors.rose : colors.sky} />
                  {thread.kind === 'group' ? <View style={styles.groupMark}><Users size={10} color={colors.ink} strokeWidth={2.5} /></View> : null}
                </View>
                <View style={styles.threadCopy}>
                  <View style={styles.nameRow}>
                    <Text numberOfLines={1} style={styles.name}>{thread.name}</Text>
                    {thread.unreadCount ? <View style={styles.badge}><Text style={styles.badgeText}>{thread.unreadCount > 9 ? '9+' : thread.unreadCount}</Text></View> : null}
                  </View>
                  <Text numberOfLines={1} style={styles.preview}>{thread.lastMessage}</Text>
                </View>
                <ChevronRight size={19} color={colors.muted} />
              </View>
            </PaperCard>
          </Pressable>)
            : <EmptyState title="No conversations yet" body="Start a chat with one friend or bring a few friends together." actionLabel="Start a new chat" onAction={() => setNewChatOpen(true)} />}
    </Screen>
    <NewChatModal visible={newChatOpen} onClose={() => setNewChatOpen(false)} onOpenThread={openThread} />
  </>;
}

function NewChatModal({ visible, onClose, onOpenThread }: { visible: boolean; onClose: () => void; onOpenThread: (thread: Thread) => void }) {
  const [people, setPeople] = useState<DiscoverableUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const loadPeople = useCallback(async () => {
    setSelectedIds([]);
    setQuery('');
    setError('');
    if (people.length) return;
    setLoading(true);
    try {
      setPeople(await api<DiscoverableUser[]>('/api/connections?accepted=true'));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Your friends could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [people.length]);

  const visiblePeople = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return people;
    return people.filter((person) => `${person.name} ${person.email}`.toLowerCase().includes(normalizedQuery));
  }, [people, query]);

  const togglePerson = (id: string) => setSelectedIds((current) => current.includes(id)
    ? current.filter((personId) => personId !== id)
    : [...current, id]);

  const startChat = async () => {
    if (!selectedIds.length || creating) return;
    const selected = people.filter((person) => selectedIds.includes(person.id));
    if (selected.length === 1) {
      const person = selected[0];
      onClose();
      onOpenThread({
        id: person.id,
        name: person.name,
        email: person.email,
        profileImage: person.profileImage,
        lastMessage: null,
        lastMessageAt: null,
        unreadCount: 0,
        kind: 'direct',
      });
      return;
    }

    setCreating(true);
    setError('');
    try {
      const thread = await api<Thread>('/api/messages', { method: 'POST', body: JSON.stringify({ memberIds: selectedIds }) });
      onClose();
      onOpenThread(thread);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'The group chat could not be created.');
    } finally {
      setCreating(false);
    }
  };

  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onShow={() => void loadPeople()} onRequestClose={onClose}>
    <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
      <View style={styles.modalHeader}>
        <View style={styles.modalHeading}><Text style={styles.modalEyebrow}>New conversation</Text><Text style={styles.modalTitle}>Who’s in this chat?</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close new chat" onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}><X size={21} color={colors.ink} /></Pressable>
      </View>
      <View style={styles.search}>
        <Search size={19} color={colors.muted} />
        <TextInput accessibilityLabel="Search your friends" autoFocus value={query} onChangeText={setQuery} placeholder="Search your friends" placeholderTextColor={colors.muted} style={styles.searchInput} />
      </View>
      {selectedIds.length > 1 ? <View style={styles.groupNote}><Users size={17} color={colors.ink} /><Text style={styles.groupNoteText}>You’re starting a group chat with {selectedIds.length} friends.</Text></View> : null}
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.peopleList}>
        {loading ? <View style={styles.modalState}><Spinner color={colors.ink} /><Text style={styles.modalStateText}>Loading your circle…</Text></View>
          : visiblePeople.length ? visiblePeople.map((person, index) => {
            const selected = selectedIds.includes(person.id);
            return <Pressable
              key={person.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${selected ? 'Remove' : 'Add'} ${person.name}`}
              onPress={() => togglePerson(person.id)}
              style={({ pressed }) => [styles.personRow, index > 0 && styles.rowDivider, selected && styles.personSelected, pressed && styles.rowPressed]}
            >
              <Avatar name={person.name} uri={person.profileImage} size={46} color={[colors.rose, colors.sky, colors.sage][index % 3]} />
              <View style={styles.personCopy}><Text numberOfLines={1} style={styles.personName}>{person.name}</Text><Text numberOfLines={1} style={styles.personEmail}>{person.email}</Text></View>
              <View style={[styles.check, selected && styles.checkSelected]}>{selected ? <Check size={16} color={colors.ink} strokeWidth={2.6} /> : null}</View>
            </Pressable>;
          }) : <View style={styles.modalState}><MessageCircle size={28} color={colors.periwinkleDark} /><Text style={styles.modalStateTitle}>{query ? 'No friends match that search' : 'No friends to message yet'}</Text><Text style={styles.modalStateText}>{query ? 'Try another name or email.' : 'Add a friend first, then come back to start a chat.'}</Text></View>}
      </ScrollView>
      {error ? <Text accessibilityRole="alert" style={styles.modalError}>{error}</Text> : null}
      <View style={styles.modalFooter}>
        <Text style={styles.selectedCount}>{selectedIds.length ? `${selectedIds.length} selected` : 'Choose one or more friends'}</Text>
        <Pressable accessibilityRole="button" disabled={!selectedIds.length || creating} onPress={() => void startChat()} style={({ pressed }) => [styles.startButton, (!selectedIds.length || creating) && styles.disabled, pressed && styles.pressed]}>
          {creating ? <Spinner size="small" color={colors.ink} /> : selectedIds.length > 1 ? <Users size={18} color={colors.ink} /> : <MessageCircle size={18} color={colors.ink} />}
          <Text style={styles.startButtonText}>{selectedIds.length > 1 ? 'Start group chat' : 'Start chat'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  threadCopy: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { flexShrink: 1, fontFamily: type.heavy, color: colors.ink, fontSize: 16 },
  preview: { fontFamily: type.regular, color: colors.muted, fontSize: 13, marginTop: 3 },
  badge: { minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: 10, backgroundColor: colors.periwinkle, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: type.heavy, color: colors.ink, fontSize: 10 },
  groupMark: { position: 'absolute', right: -5, bottom: -4, width: 21, height: 21, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.citrus, ...border },
  composeButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.white, ...border },
  pressed: { transform: [{ translateY: 2 }] },
  modalSafe: { flex: 1, backgroundColor: colors.paper },
  modalHeader: { minHeight: 78, paddingHorizontal: 18, paddingBottom: 12, flexDirection: 'row', alignItems: 'flex-end', gap: 12, borderBottomWidth: 1.5, borderBottomColor: colors.line },
  modalHeading: { flex: 1 },
  modalEyebrow: { fontFamily: type.heavy, color: colors.periwinkleDark, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' },
  modalTitle: { marginTop: 1, fontFamily: type.heavy, color: colors.ink, fontSize: 26, lineHeight: 31 },
  closeButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.white, ...border },
  search: { height: 50, marginHorizontal: 16, marginTop: 16, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 15, backgroundColor: colors.white, ...border },
  searchInput: { flex: 1, fontFamily: type.regular, color: colors.ink, fontSize: 16 },
  groupNote: { minHeight: 42, marginHorizontal: 16, marginTop: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 13, backgroundColor: colors.periwinkle, ...border },
  groupNoteText: { flex: 1, fontFamily: type.medium, color: colors.ink, fontSize: 12 },
  peopleList: { margin: 16, overflow: 'hidden', borderRadius: 18, backgroundColor: colors.white, ...border, ...shadow },
  personRow: { minHeight: 72, paddingHorizontal: 13, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 11 },
  rowDivider: { borderTopWidth: 1.5, borderTopColor: colors.line },
  personSelected: { backgroundColor: '#E4E7FF' },
  rowPressed: { backgroundColor: colors.paperDeep },
  personCopy: { flex: 1, minWidth: 0 },
  personName: { fontFamily: type.heavy, color: colors.ink, fontSize: 15 },
  personEmail: { marginTop: 2, fontFamily: type.regular, color: colors.muted, fontSize: 12 },
  check: { width: 27, height: 27, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper, ...border },
  checkSelected: { backgroundColor: colors.citrus },
  modalState: { minHeight: 190, padding: 28, alignItems: 'center', justifyContent: 'center', gap: 8 },
  modalStateTitle: { fontFamily: type.heavy, color: colors.ink, fontSize: 18, textAlign: 'center' },
  modalStateText: { fontFamily: type.regular, color: colors.muted, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  modalError: { marginHorizontal: 16, marginBottom: 10, padding: 11, borderRadius: 12, borderWidth: 1.5, borderColor: colors.danger, backgroundColor: '#FCE5E2', fontFamily: type.medium, color: colors.danger, fontSize: 12, lineHeight: 17 },
  modalFooter: { minHeight: 76, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTopWidth: 1.5, borderTopColor: colors.line, backgroundColor: colors.white },
  selectedCount: { flex: 1, fontFamily: type.medium, color: colors.muted, fontSize: 11 },
  startButton: { minHeight: 48, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 14, backgroundColor: colors.citrus, ...border, ...shadow },
  startButtonText: { fontFamily: type.heavy, color: colors.ink, fontSize: 13 },
  disabled: { opacity: .45, shadowOpacity: 0, elevation: 0 },
});
