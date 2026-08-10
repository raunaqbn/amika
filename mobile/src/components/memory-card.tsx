import React, { memo, useCallback, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Globe2, Heart, Lock, MessageCircle, UserRound, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Avatar, PaperCard } from './ui';
import { MemoryMediaCarousel } from './memory-media-carousel';
import { api } from '@/lib/api';
import { border, colors, type } from '@/lib/theme';
import type { Memory } from '@/types';

function niceDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Today';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

type MemoryCardProps = {
  memory: Memory;
  onReaction?: (memoryId: string, reactedByMe: boolean, reactionCount: number) => void;
};

export const MemoryCard = memo(function MemoryCard({ memory, onReaction }: MemoryCardProps) {
  const router = useRouter();
  const reacting = useRef(false);
  const actor = memory.author?.name || 'You';
  const person = memory.friend?.name;
  const hasMultipleRecipients = memory.visibility === 'friends' && (memory.audienceCount || 0) > 1;
  const AudienceIcon = memory.visibility === 'private' ? Lock : memory.visibility === 'public' ? Globe2 : hasMultipleRecipients ? Users : UserRound;
  const audienceLabel = memory.visibility === 'private'
    ? 'Only me'
    : memory.visibility === 'public'
      ? 'Public'
      : hasMultipleRecipients ? `Shared with ${memory.audienceCount} friends` : person ? `Shared with ${person}` : 'Tagged friend';
  const media = memory.media?.length ? memory.media : memory.imageUrl ? [{ type: 'image' as const, url: memory.imageUrl }] : [];
  const openMemory = useCallback(() => {
    router.push({ pathname: '/memory/[id]', params: { id: memory.id } });
  }, [memory.id, router]);
  const react = useCallback(async () => {
    if (reacting.current) return;
    reacting.current = true;
    const wasReacted = Boolean(memory.reactedByMe);
    const previousCount = memory.reactionCount || 0;
    const nextCount = Math.max(0, previousCount + (wasReacted ? -1 : 1));
    onReaction?.(memory.id, !wasReacted, nextCount);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await api(`/api/memories/${memory.id}/reactions`, { method: 'POST', body: JSON.stringify({ emoji: 'heart' }) });
    } catch {
      onReaction?.(memory.id, wasReacted, previousCount);
    } finally {
      reacting.current = false;
    }
  }, [memory.id, memory.reactedByMe, memory.reactionCount, onReaction]);
  return <PaperCard style={styles.card}><Pressable accessibilityRole="button" accessibilityLabel={`Open memory by ${actor}`} onPress={openMemory}>
    <View style={styles.meta}><Avatar name={actor} uri={memory.author?.profileImage} size={38} /><View style={{ flex: 1 }}><Text style={styles.actor}>{actor}{person ? <Text style={styles.with}> with {person}</Text> : null}</Text><Text style={styles.date}>{niceDate(memory.memoryDate)}</Text></View><View style={styles.visibility}><AudienceIcon size={13} color={colors.ink} /><Text style={styles.visibilityText}>{audienceLabel}</Text></View></View>
  </Pressable>{media.length ? <MemoryMediaCarousel media={media} height={320} onPressImage={openMemory} /> : <Pressable onPress={openMemory}><View style={styles.textOnly}><Text style={styles.bigQuote}>“</Text><Text style={styles.textOnlyCopy}>{memory.content}</Text></View></Pressable>}
    {media.length ? <Pressable onPress={openMemory}><Text style={styles.content}>{memory.content}</Text></Pressable> : null}
  <View style={styles.actions}><Pressable accessibilityLabel={memory.reactedByMe ? 'Remove heart' : 'Heart memory'} onPress={react} style={styles.action}><Heart size={19} color={memory.reactedByMe ? colors.danger : colors.ink} fill={memory.reactedByMe ? colors.danger : 'transparent'} /><Text style={styles.actionText}>{memory.reactionCount || 0}</Text></Pressable><Pressable accessibilityLabel="Open comments" onPress={openMemory} style={styles.action}><MessageCircle size={19} color={colors.ink} /><Text style={styles.actionText}>{memory.commentCount || 0}</Text></Pressable><Text style={styles.tapHint}>Tap to open</Text></View></PaperCard>;
});

const styles = StyleSheet.create({
  card: { padding: 0 }, meta: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 }, actor: { fontFamily: type.heavy, color: colors.ink, fontSize: 14 }, with: { fontFamily: type.regular }, date: { fontFamily: type.regular, color: colors.muted, fontSize: 12, marginTop: 1 },
  visibility: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 5, paddingHorizontal: 8, borderRadius: 20, backgroundColor: colors.paperDeep, ...border }, visibilityText: { fontFamily: type.medium, color: colors.ink, fontSize: 10 },
  content: { fontFamily: type.medium, fontSize: 16, lineHeight: 23, color: colors.ink, padding: 14, paddingBottom: 8 }, textOnly: { minHeight: 160, backgroundColor: colors.periwinkle, padding: 20, borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: colors.line, justifyContent: 'center' }, bigQuote: { position: 'absolute', left: 13, top: -9, fontFamily: type.heavy, fontSize: 90, color: 'rgba(32,32,31,.14)' }, textOnlyCopy: { fontFamily: type.heavy, color: colors.ink, fontSize: 23, lineHeight: 30 },
  actions: { flexDirection: 'row', alignItems: 'center', minHeight: 46, paddingHorizontal: 14, gap: 18 }, action: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 36, minHeight: 42 }, actionText: { fontFamily: type.heavy, color: colors.ink, fontSize: 13 }, tapHint: { marginLeft: 'auto', fontFamily: type.medium, color: colors.muted, fontSize: 11 },
});
