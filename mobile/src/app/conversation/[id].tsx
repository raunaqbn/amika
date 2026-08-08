import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Send } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';
import { Avatar, EmptyState } from '@/components/ui';
import { api, apiCached, getCachedApiData, invalidateApiCache, setCachedApiData } from '@/lib/api';
import { refreshNotificationCount } from '@/lib/notification-count';
import { border, colors, type } from '@/lib/theme';
import type { Message } from '@/types';

export default function ConversationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id, name, image } = useLocalSearchParams<{ id: string; name?: string; image?: string }>();
  const conversationPath = useMemo(() => `/api/messages?with=${encodeURIComponent(id)}`, [id]);
  const [messages, setMessages] = useState<Message[]>(() => getCachedApiData<Message[]>(conversationPath) || []);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const load = useCallback(() => apiCached<Message[]>(conversationPath, { force: true }).then((nextMessages) => {
    setMessages(nextMessages);
    invalidateApiCache('/api/messages');
    void refreshNotificationCount().catch(() => {});
  }).catch(() => {}), [conversationPath]);
  useEffect(() => { void load(); }, [load]);

  async function send() {
    const content = draft.trim();
    if (!content) return;
    setSending(true);
    try {
      const message = await api<Message>('/api/messages', { method: 'POST', body: JSON.stringify({ recipientId: id, content }) });
      setDraft('');
      setMessages((current) => setCachedApiData(conversationPath, [...current, message]));
      invalidateApiCache('/api/messages');
    } catch (sendError) {
      Alert.alert('Message not sent', sendError instanceof Error ? sendError.message : 'Try again.');
    } finally {
      setSending(false);
    }
  }
  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}><ChevronLeft size={24} color={colors.ink} /></Pressable><Avatar name={name || 'F'} uri={image} size={39} color={colors.rose} /><View><Text style={styles.name}>{name || 'Friend'}</Text><Text style={styles.subtitle}>Private thread</Text></View></View><FlatList data={messages} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} ListEmptyComponent={<EmptyState title="Start with something small" body="Send the thought that made you think of them." />} renderItem={({ item }) => { const mine = item.senderId === user?.id; return <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}><Text style={styles.message}>{item.content}</Text><Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text></View>; }} /><View style={styles.composer}><TextInput value={draft} onChangeText={setDraft} placeholder="Message your friend…" placeholderTextColor={colors.muted} style={styles.input} multiline /><Pressable accessibilityRole="button" accessibilityLabel="Send message" disabled={sending} onPress={send} style={styles.send}><Send size={19} color={colors.ink} /></Pressable></View></KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.paper }, header: { minHeight: 66, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1.5, borderBottomColor: colors.line }, back: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }, name: { fontFamily: type.heavy, color: colors.ink, fontSize: 16 }, subtitle: { fontFamily: type.medium, color: colors.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }, list: { flexGrow: 1, padding: 16, gap: 10 }, bubble: { maxWidth: '80%', borderRadius: 16, padding: 12, ...border }, mine: { alignSelf: 'flex-end', backgroundColor: colors.periwinkle, borderBottomRightRadius: 4 }, theirs: { alignSelf: 'flex-start', backgroundColor: colors.white, borderBottomLeftRadius: 4 }, message: { fontFamily: type.regular, color: colors.ink, fontSize: 15, lineHeight: 21 }, time: { fontFamily: type.medium, color: colors.muted, fontSize: 9, marginTop: 5, textAlign: 'right' }, composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 9, padding: 10, borderTopWidth: 1.5, borderTopColor: colors.line, backgroundColor: colors.paper }, input: { flex: 1, minHeight: 45, maxHeight: 100, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: colors.white, fontFamily: type.regular, color: colors.ink, ...border }, send: { width: 45, height: 45, borderRadius: 14, backgroundColor: colors.citrus, alignItems: 'center', justifyContent: 'center', ...border }, });
