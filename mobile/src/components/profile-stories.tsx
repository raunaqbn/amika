import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft, ChevronRight, Heart, MessageCircle, Plus, Send, Trash2, X } from 'lucide-react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { api, imageSource } from '@/lib/api';
import { Avatar, Spinner } from '@/components/ui';
import { StoryComposer, type StoryPhoto } from '@/components/story-composer';
import { border, colors, shadow, type } from '@/lib/theme';
import type { Story, StoryComment } from '@/types';

type Props = {
  ownerId: string;
  ownerName: string;
  ownerImage?: string | null;
  canPost?: boolean;
};

function timeLeft(value: string) {
  const remaining = Math.max(0, new Date(value).getTime() - Date.now());
  const hours = Math.ceil(remaining / 3_600_000);
  return hours > 1 ? `${hours}h left` : 'Less than 1h left';
}

export function ProfileStories({ ownerId, ownerName, ownerImage, canPost = false }: Props) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<StoryPhoto | null>(null);

  const load = useCallback(async () => {
    try {
      setStories(await api<Story[]>(`/api/stories?userId=${encodeURIComponent(ownerId)}`));
    } catch {
      setStories([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => { void load(); }, [load]);

  const pickPhoto = useCallback(async (source: 'camera' | 'library') => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo permission needed', `Allow Amika to use your ${source === 'camera' ? 'camera' : 'photos'} to post a story.`);
      return;
    }
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
      ...(source === 'library' ? { preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible } : {}),
    };
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;
    const asset = result.assets[0];
    setSelectedPhoto({ height: asset.height, uri: asset.uri, width: asset.width });
  }, []);

  const openPicker = useCallback(() => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: 'Add a 24-hour story', options: ['Cancel', 'Take photo', 'Choose from library'], cancelButtonIndex: 0 },
        (index) => {
          if (index === 1) void pickPhoto('camera');
          if (index === 2) void pickPhoto('library');
        },
      );
      return;
    }
    Alert.alert('Add a 24-hour story', undefined, [
      { text: 'Take photo', onPress: () => void pickPhoto('camera') },
      { text: 'Choose from library', onPress: () => void pickPhoto('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [pickPhoto]);

  if (!canPost && !loading && stories.length === 0) return null;

  return <View style={styles.section}>
    <View style={styles.sectionHeading}>
      <View style={styles.headingCopy}>
        <Text style={styles.kicker}>Only on this profile</Text>
        <Text style={styles.title}>{canPost ? 'Your stories' : `${ownerName}'s stories`}</Text>
      </View>
      <Text style={styles.helper}>24h · never on Home</Text>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
      {canPost ? <Pressable accessibilityRole="button" accessibilityLabel="Add a story" onPress={openPicker} style={styles.storyButton}>
        <View style={[styles.storyRing, styles.addRing]}><Plus size={27} color={colors.ink} /></View>
        <Text style={styles.storyLabel}>Add story</Text>
      </Pressable> : null}
      {loading ? <View style={styles.loading}><Spinner size="small" /><Text style={styles.loadingText}>Checking…</Text></View> : null}
      {stories.map((story, index) => <Pressable key={story.id} accessibilityRole="button" accessibilityLabel={`Open ${ownerName}'s story, ${timeLeft(story.expiresAt)}`} onPress={() => setActiveIndex(index)} style={styles.storyButton}>
        <View style={styles.storyRing}><Image source={imageSource(story.imageUrl)} style={styles.thumbnail} contentFit="cover" cachePolicy="memory-disk" recyclingKey={story.id} /></View>
        <Text numberOfLines={1} style={styles.storyLabel}>{index === stories.length - 1 ? 'Newest' : `Story ${index + 1}`}</Text>
      </Pressable>)}
    </ScrollView>

    <StoryComposer
      photo={selectedPhoto}
      defaultVisibility="friends"
      onCancel={() => setSelectedPhoto(null)}
      onChooseAnother={openPicker}
      onPosted={async () => { setSelectedPhoto(null); await load(); }}
    />

    {activeIndex !== null && stories[activeIndex] ? <StoryViewer
      story={stories[activeIndex]}
      ownerName={ownerName}
      ownerImage={ownerImage}
      position={activeIndex}
      total={stories.length}
      onClose={() => setActiveIndex(null)}
      onMove={(next) => setActiveIndex(next)}
      onRefresh={load}
      onDeleted={() => { setActiveIndex(null); void load(); }}
    /> : null}
  </View>;
}

export function StoryViewer({ story, ownerName, ownerImage, position, total, onClose, onMove, onRefresh, onDeleted }: {
  story: Story;
  ownerName: string;
  ownerImage?: string | null;
  position: number;
  total: number;
  onClose: () => void;
  onMove: (index: number) => void;
  onRefresh: () => Promise<void>;
  onDeleted: () => void;
}) {
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [reply, setReply] = useState('');
  const [threadOpen, setThreadOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const reacting = useRef(false);

  const loadComments = useCallback(async () => {
    try { setComments(await api<StoryComment[]>(`/api/stories/${story.id}/comments`)); }
    catch { setComments([]); }
  }, [story.id]);

  useEffect(() => { setThreadOpen(false); setComments([]); setReply(''); }, [story.id]);
  const expiry = useMemo(() => timeLeft(story.expiresAt), [story.expiresAt]);

  const react = async () => {
    if (reacting.current) return;
    reacting.current = true;
    try {
      await api(`/api/stories/${story.id}/reactions`, { method: 'POST', body: '{}' });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await onRefresh();
    } finally { reacting.current = false; }
  };

  const openReplies = async () => { setThreadOpen(true); await loadComments(); };
  const sendReply = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    try {
      await api(`/api/stories/${story.id}/comments`, { method: 'POST', body: JSON.stringify({ content: reply.trim() }) });
      setReply('');
      await loadComments();
      await onRefresh();
    } finally { setSending(false); }
  };
  const confirmDelete = () => Alert.alert('Delete this story?', 'It will disappear immediately for everyone.', [
    { text: 'Keep', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => void api(`/api/stories?id=${story.id}`, { method: 'DELETE' }).then(onDeleted) },
  ]);

  return <Modal visible animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
    <SafeAreaProvider style={styles.viewerProvider}>
      <StatusBar hidden animated />
      <SafeAreaView style={styles.viewerSafe} edges={['top', 'right', 'bottom', 'left']}>
        <View style={styles.progress}>{Array.from({ length: total }, (_, index) => <View key={index} style={[styles.progressTrack, index <= position && styles.progressDone]} />)}</View>
        <View style={styles.viewerHeader}>
          <Avatar name={ownerName} uri={ownerImage} size={40} color={colors.citrus} />
          <View style={styles.viewerIdentity}><Text numberOfLines={1} style={styles.viewerName}>{ownerName}</Text><Text style={styles.viewerMeta}>{expiry} · {story.visibility === 'public' ? 'Public' : 'Friends'}</Text></View>
          {story.isOwn ? <Pressable accessibilityRole="button" accessibilityLabel="Delete story" onPress={confirmDelete} style={styles.viewerHeaderButton}><Trash2 size={19} color={colors.white} /></Pressable> : null}
          <Pressable accessibilityRole="button" accessibilityLabel="Close story" onPress={onClose} style={styles.viewerHeaderButton}><X size={22} color={colors.white} /></Pressable>
        </View>

        <View style={styles.viewerStage}>
          <Image source={imageSource(story.imageUrl)} style={StyleSheet.absoluteFill} contentFit="contain" cachePolicy="memory-disk" priority="high" />
          {story.content ? <View style={styles.viewerCaptionWrap}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.viewerCaptionContent}><Text style={styles.viewerCaption}>{story.content}</Text></ScrollView></View> : null}
          {total > 1 ? <>
            <Pressable accessibilityRole="button" accessibilityLabel="Previous story" disabled={position === 0} onPress={() => onMove(position - 1)} style={[styles.previous, position === 0 && styles.hidden]}><ChevronLeft size={26} color={colors.white} /></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Next story" disabled={position === total - 1} onPress={() => onMove(position + 1)} style={[styles.next, position === total - 1 && styles.hidden]}><ChevronRight size={26} color={colors.white} /></Pressable>
          </> : null}
        </View>

        <View style={styles.viewerActions}>
          <Pressable accessibilityRole="button" accessibilityLabel={story.reactedByMe ? 'Remove heart' : 'Love story'} onPress={() => void react()} style={styles.viewerAction}><Heart size={21} color={story.reactedByMe ? colors.rose : colors.white} fill={story.reactedByMe ? colors.rose : 'transparent'} /><Text style={styles.viewerActionText}>{story.reactionCount || 'Love'}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Open story replies" onPress={() => void openReplies()} style={[styles.viewerAction, styles.replyAction]}><MessageCircle size={20} color={colors.ink} /><Text style={styles.replyActionText}>Reply{story.commentCount ? ` · ${story.commentCount}` : ''}</Text></Pressable>
        </View>

        {threadOpen ? <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.thread}>
          <View style={styles.threadHeader}><Text style={styles.threadTitle}>Replies</Text><Pressable accessibilityRole="button" accessibilityLabel="Close replies" onPress={() => setThreadOpen(false)} style={styles.headerButton}><X size={21} color={colors.ink} /></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.commentList}>{comments.length ? comments.map((item) => <View key={item.id} style={styles.comment}><Text style={styles.commentAuthor}>{item.author.name}</Text><Text style={styles.commentText}>{item.content}</Text></View>) : <Text style={styles.emptyComments}>No replies yet. Start the conversation.</Text>}</ScrollView>
          <View style={styles.replyComposer}><TextInput value={reply} onChangeText={setReply} maxLength={240} placeholder="Send a reply…" placeholderTextColor={colors.muted} autoFocus style={styles.replyInput} /><Pressable accessibilityRole="button" accessibilityLabel="Send reply" disabled={!reply.trim() || sending} onPress={() => void sendReply()} style={[styles.sendButton, (!reply.trim() || sending) && styles.disabled]}>{sending ? <Spinner size="small" /> : <Send size={19} color={colors.ink} />}</Pressable></View>
        </KeyboardAvoidingView> : null}
      </SafeAreaView>
    </SafeAreaProvider>
  </Modal>;
}

const styles = StyleSheet.create({
  section: { padding: 17, borderRadius: 20, backgroundColor: colors.periwinkle, ...border, ...shadow },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  headingCopy: { flex: 1 },
  kicker: { fontFamily: type.heavy, color: colors.periwinkleDark, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.1 },
  title: { marginTop: 2, fontFamily: type.heavy, color: colors.ink, fontSize: 23 },
  helper: { fontFamily: type.medium, color: colors.ink, fontSize: 11 },
  rail: { gap: 13, paddingTop: 17, paddingBottom: 4 },
  storyButton: { width: 78, alignItems: 'center', gap: 7 },
  storyRing: { width: 74, height: 74, padding: 3, overflow: 'hidden', borderRadius: 37, borderWidth: 3, borderColor: colors.citrus, backgroundColor: colors.white },
  addRing: { alignItems: 'center', justifyContent: 'center', borderColor: colors.line, borderStyle: 'dashed', backgroundColor: colors.citrus },
  thumbnail: { width: '100%', height: '100%', borderRadius: 31 },
  storyLabel: { maxWidth: 78, fontFamily: type.heavy, color: colors.ink, fontSize: 11 },
  loading: { width: 78, height: 74, alignItems: 'center', justifyContent: 'center', gap: 4 },
  loadingText: { fontFamily: type.medium, color: colors.muted, fontSize: 10 },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  viewerProvider: { flex: 1, backgroundColor: colors.ink },
  viewerSafe: { flex: 1, minHeight: 0, backgroundColor: colors.ink },
  progress: { flexDirection: 'row', gap: 4, paddingHorizontal: 10, paddingTop: 7 },
  progressTrack: { height: 3, flex: 1, borderRadius: 2, backgroundColor: 'rgba(255,255,255,.3)' },
  progressDone: { backgroundColor: colors.white },
  viewerHeader: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 11 },
  viewerIdentity: { minWidth: 0, flex: 1 },
  viewerName: { fontFamily: type.heavy, color: colors.white, fontSize: 14 },
  viewerMeta: { marginTop: 1, fontFamily: type.medium, color: colors.paperDeep, fontSize: 11 },
  viewerHeaderButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  viewerStage: { flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', backgroundColor: '#11110F' },
  viewerCaptionWrap: { position: 'absolute', left: 16, right: 16, bottom: 14, maxHeight: 126, alignItems: 'center' },
  viewerCaptionContent: { alignItems: 'center' },
  viewerCaption: { paddingHorizontal: 12, paddingVertical: 8, overflow: 'hidden', borderRadius: 12, backgroundColor: 'rgba(17,17,15,.72)', fontFamily: type.heavy, color: colors.white, fontSize: 16, lineHeight: 22, textAlign: 'center' },
  viewerActions: { flexShrink: 0, flexDirection: 'row', gap: 9, padding: 10 },
  viewerAction: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 15, borderRadius: 14, borderWidth: 1.5, borderColor: colors.white },
  viewerActionText: { fontFamily: type.heavy, color: colors.white, fontSize: 13 },
  replyAction: { flex: 1, backgroundColor: colors.white },
  replyActionText: { fontFamily: type.heavy, color: colors.ink, fontSize: 13 },
  previous: { position: 'absolute', left: 8, top: '44%', width: 44, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: 'rgba(32,32,31,.72)' },
  next: { position: 'absolute', right: 8, top: '44%', width: 44, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: 'rgba(32,32,31,.72)' },
  hidden: { opacity: 0 },
  thread: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%', borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: colors.paper, overflow: 'hidden' },
  threadHeader: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 17, borderBottomWidth: 1.5, borderBottomColor: colors.line },
  threadTitle: { fontFamily: type.heavy, color: colors.ink, fontSize: 18 },
  commentList: { padding: 15, paddingBottom: 20 },
  comment: { paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.paperDeep },
  commentAuthor: { fontFamily: type.heavy, color: colors.ink, fontSize: 12 },
  commentText: { marginTop: 2, fontFamily: type.regular, color: colors.ink, fontSize: 14, lineHeight: 19 },
  emptyComments: { fontFamily: type.regular, color: colors.muted, fontSize: 13 },
  replyComposer: { flexDirection: 'row', gap: 8, padding: 10, borderTopWidth: 1.5, borderTopColor: colors.line, backgroundColor: colors.white },
  replyInput: { minHeight: 46, flex: 1, paddingHorizontal: 13, borderRadius: 14, backgroundColor: colors.paper, fontFamily: type.regular, color: colors.ink, fontSize: 15, ...border },
  sendButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.citrus, ...border },
  disabled: { opacity: .45 },
});
