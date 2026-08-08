import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { addNotificationReceivedListener } from 'expo-notifications/build/NotificationsEmitter';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Send } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';
import { Avatar, EmptyState } from '@/components/ui';
import { api, getCachedApiData, invalidateApiCache, setCachedApiData } from '@/lib/api';
import { refreshNotificationCount } from '@/lib/notification-count';
import { border, colors, type } from '@/lib/theme';
import type { Message } from '@/types';

const MESSAGE_POLL_MS = 2_000;

function mergeMessages(current: Message[], incoming: Message[]) {
  const byId = new Map(current.map((message) => [message.id, message]));
  incoming.forEach((message) => byId.set(message.id, message));
  return [...byId.values()].sort((a, b) => {
    const timeDifference = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return timeDifference || a.id.localeCompare(b.id);
  });
}

function sameMessages(current: Message[], next: Message[]) {
  return current.length === next.length && current.every((message, index) => {
    const candidate = next[index];
    return Boolean(candidate)
      && message.id === candidate.id
      && message.content === candidate.content
      && message.createdAt === candidate.createdAt;
  });
}

export default function ConversationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id, name, image, kind, memberCount } = useLocalSearchParams<{ id: string; name?: string; image?: string; kind?: 'direct' | 'group'; memberCount?: string }>();
  const isGroup = kind === 'group';
  const conversationPath = useMemo(() => `/api/messages?${isGroup ? 'thread' : 'with'}=${encodeURIComponent(id)}`, [id, isGroup]);
  const cachedMessages = getCachedApiData<Message[]>(conversationPath) || [];
  const [messages, setMessages] = useState<Message[]>(cachedMessages);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);
  const hasPositionedList = useRef(false);
  const shouldStickToBottom = useRef(true);
  const messagesRef = useRef(cachedMessages);
  const conversationPathRef = useRef(conversationPath);
  conversationPathRef.current = conversationPath;

  const scrollToLatest = useCallback((animated: boolean) => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated }));
  }, []);

  const load = useCallback(() => api<Message[]>(conversationPath).then((incomingMessages) => {
    if (conversationPathRef.current !== conversationPath) return;
    const nextMessages = mergeMessages(messagesRef.current, incomingMessages);
    if (sameMessages(messagesRef.current, nextMessages)) return;
    messagesRef.current = nextMessages;
    setMessages(setCachedApiData(conversationPath, nextMessages));
    invalidateApiCache('/api/messages');
    void refreshNotificationCount().catch(() => {});
  }).catch(() => {}), [conversationPath]);
  useEffect(() => {
    const cached = getCachedApiData<Message[]>(conversationPath) || [];
    messagesRef.current = cached;
    setMessages(cached);
    hasPositionedList.current = false;
    shouldStickToBottom.current = true;
    void load();
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') void load();
    }, MESSAGE_POLL_MS);
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void load();
    });
    const notificationSubscription = addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data || {};
      const matchesConversation = isGroup
        ? data.type === 'message' && data.isGroup === true && data.threadId === id
        : data.type === 'message' && data.isGroup !== true && data.senderId === id;
      if (matchesConversation) void load();
    });
    return () => {
      clearInterval(interval);
      appStateSubscription.remove();
      notificationSubscription.remove();
    };
  }, [conversationPath, id, isGroup, load]);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      shouldStickToBottom.current = true;
      scrollToLatest(true);
    });
    return () => subscription.remove();
  }, [scrollToLatest]);

  async function send() {
    const content = draft.trim();
    if (!content) return;
    setSending(true);
    try {
      const message = await api<Message>('/api/messages', { method: 'POST', body: JSON.stringify(isGroup ? { threadId: id, content } : { recipientId: id, content }) });
      setDraft('');
      shouldStickToBottom.current = true;
      setMessages((current) => {
        const nextMessages = mergeMessages(current, [message]);
        messagesRef.current = nextMessages;
        return setCachedApiData(conversationPath, nextMessages);
      });
      invalidateApiCache('/api/messages');
    } catch (sendError) {
      Alert.alert('Message not sent', sendError instanceof Error ? sendError.message : 'Try again.');
    } finally {
      setSending(false);
    }
  }
  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}><ChevronLeft size={24} color={colors.ink} /></Pressable><Avatar name={name || 'F'} uri={image} size={39} color={isGroup ? colors.sky : colors.rose} /><View style={styles.headerCopy}><Text numberOfLines={1} style={styles.name}>{name || 'Friend'}</Text><Text style={styles.subtitle}>{isGroup ? `${memberCount || ''} people` : 'Private thread'}</Text></View></View><FlatList ref={listRef} data={messages} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} keyboardShouldPersistTaps="handled" onContentSizeChange={() => {
    if (!hasPositionedList.current || shouldStickToBottom.current) {
      scrollToLatest(hasPositionedList.current);
      hasPositionedList.current = true;
    }
  }} onScroll={({ nativeEvent }) => {
    const distanceFromBottom = nativeEvent.contentSize.height - nativeEvent.layoutMeasurement.height - nativeEvent.contentOffset.y;
    shouldStickToBottom.current = distanceFromBottom < 80;
  }} scrollEventThrottle={16} ListEmptyComponent={<EmptyState title={isGroup ? 'Give everyone something to gather around' : 'Start with something small'} body={isGroup ? 'Only the friends in this group can see these messages.' : 'Send the thought that made you think of them.'} />} renderItem={({ item }) => { const mine = item.senderId === user?.id; return <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>{isGroup && !mine ? <Text style={styles.senderName}>{item.sender?.name || 'Friend'}</Text> : null}<Text style={styles.message}>{item.content}</Text><Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text></View>; }} /><View style={styles.composer}><TextInput value={draft} onChangeText={setDraft} placeholder={isGroup ? 'Message the group…' : 'Message your friend…'} placeholderTextColor={colors.muted} style={styles.input} multiline /><Pressable accessibilityRole="button" accessibilityLabel="Send message" disabled={sending} onPress={send} style={styles.send}><Send size={19} color={colors.ink} /></Pressable></View></KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.paper }, header: { minHeight: 66, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1.5, borderBottomColor: colors.line }, back: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1, minWidth: 0 }, name: { fontFamily: type.heavy, color: colors.ink, fontSize: 16 }, subtitle: { fontFamily: type.medium, color: colors.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }, list: { flexGrow: 1, padding: 16, gap: 10 }, bubble: { maxWidth: '80%', borderRadius: 16, padding: 12, ...border }, mine: { alignSelf: 'flex-end', backgroundColor: colors.periwinkle, borderBottomRightRadius: 4 }, theirs: { alignSelf: 'flex-start', backgroundColor: colors.white, borderBottomLeftRadius: 4 }, senderName: { marginBottom: 3, fontFamily: type.heavy, color: colors.periwinkleDark, fontSize: 11 }, message: { fontFamily: type.regular, color: colors.ink, fontSize: 15, lineHeight: 21 }, time: { fontFamily: type.medium, color: colors.muted, fontSize: 9, marginTop: 5, textAlign: 'right' }, composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 9, padding: 10, borderTopWidth: 1.5, borderTopColor: colors.line, backgroundColor: colors.paper }, input: { flex: 1, minHeight: 45, maxHeight: 100, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: colors.white, fontFamily: type.regular, color: colors.ink, ...border }, send: { width: 45, height: 45, borderRadius: 14, backgroundColor: colors.citrus, alignItems: 'center', justifyContent: 'center', ...border }, });
