import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { Globe2, Lock, Pencil, RefreshCw, X } from 'lucide-react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { api, uploadImage } from '@/lib/api';
import { PhotoEditor } from '@/components/photo-editor';
import { Spinner } from '@/components/ui';
import { border, colors, type } from '@/lib/theme';
import type { Story } from '@/types';

export type StoryPhoto = { height: number; uri: string; width: number };

type Props = {
  defaultVisibility?: 'public' | 'friends';
  onCancel: () => void;
  onChooseAnother: () => void;
  onPosted: (story: Story) => void | Promise<void>;
  photo: StoryPhoto | null;
};

export function StoryComposer({ defaultVisibility = 'friends', onCancel, onChooseAnother, onPosted, photo }: Props) {
  const { height: screenHeight } = useWindowDimensions();
  const [editSource, setEditSource] = useState<StoryPhoto | null>(photo);
  const [draft, setDraft] = useState<StoryPhoto | null>(null);
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'friends'>(defaultVisibility);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!photo) {
      setEditSource(null);
      setDraft(null);
      setCaption('');
      setPosting(false);
      return;
    }
    setEditSource(photo);
    setDraft(null);
    setCaption('');
    setVisibility(defaultVisibility);
  }, [defaultVisibility, photo]);

  function discard() {
    if (posting) return;
    Alert.alert('Discard this story?', 'Your original photo will stay unchanged.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: onCancel },
    ]);
  }

  async function post() {
    if (!draft || posting) return;
    setPosting(true);
    try {
      const uploaded = await uploadImage(draft.uri);
      const story = await api<Story>('/api/stories', {
        method: 'POST',
        body: JSON.stringify({ imageUrl: uploaded.url, content: caption.trim(), visibility }),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await onPosted(story);
    } catch (error) {
      Alert.alert('Story not posted', error instanceof Error ? error.message : 'Try another photo.');
      setPosting(false);
    }
  }

  const previewHeight = Math.min(470, Math.max(250, screenHeight * .46));

  return <>
    <PhotoEditor
      visible={Boolean(photo && editSource && !draft)}
      uri={editSource?.uri || null}
      width={editSource?.width || 0}
      height={editSource?.height || 0}
      onCancel={onCancel}
      onChooseAnother={onChooseAnother}
      onUsePhoto={(edited) => {
        const next = { height: edited.height, uri: edited.uri, width: edited.width };
        setEditSource(next);
        setDraft(next);
      }}
    />

    <Modal
      visible={Boolean(photo && draft)}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={discard}
    >
      <SafeAreaProvider style={styles.safe}>
        <StatusBar style="dark" />
        <SafeAreaView style={styles.safe} edges={['top', 'right', 'bottom', 'left']}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Cancel story" disabled={posting} onPress={discard} style={styles.headerButton}>
              <X size={22} color={colors.mossDeep} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={styles.kicker}>24-hour moment</Text>
              <Text style={styles.title}>Finish your story</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={posting ? 'Posting story' : 'Post story'} disabled={posting} onPress={() => void post()} style={[styles.postButton, posting && styles.disabled]}>
              {posting ? <Spinner size="small" color={colors.white} /> : <Text style={styles.postLabel}>Post</Text>}
            </Pressable>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.body}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              <View style={[styles.preview, { height: previewHeight }]}>
                {draft ? <Image source={draft.uri} style={StyleSheet.absoluteFill} contentFit="contain" /> : null}
                {caption.trim() ? <View style={styles.captionOverlay}><Text style={styles.captionPreview}>{caption.trim()}</Text></View> : null}
                <View style={styles.photoActions}>
                  <Pressable accessibilityRole="button" accessibilityLabel="Edit story photo" disabled={posting} onPress={() => setDraft(null)} style={styles.photoAction}>
                    <Pencil size={16} color={colors.mossDeep} /><Text style={styles.photoActionText}>Edit photo</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel="Choose another story photo" disabled={posting} onPress={onChooseAnother} style={styles.photoAction}>
                    <RefreshCw size={16} color={colors.mossDeep} /><Text style={styles.photoActionText}>Replace</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.controls}>
                <View style={styles.labelRow}><Text style={styles.fieldLabel}>Text on your story</Text><Text style={styles.counter}>{caption.length}/280</Text></View>
                <TextInput
                  accessibilityLabel="Story text"
                  value={caption}
                  onChangeText={setCaption}
                  maxLength={280}
                  multiline
                  placeholder="Add a little context…"
                  placeholderTextColor={colors.muted}
                  style={styles.captionInput}
                />

                <Text style={styles.fieldLabel}>Who can see it</Text>
                <View accessibilityRole="radiogroup" style={styles.segmented}>
                  <Pressable accessibilityRole="radio" accessibilityState={{ checked: visibility === 'friends', selected: visibility === 'friends' }} onPress={() => setVisibility('friends')} style={[styles.segment, visibility === 'friends' && styles.segmentSelected]}>
                    <Lock size={17} color={colors.mossDeep} /><Text style={styles.segmentText}>Friends</Text>
                  </Pressable>
                  <Pressable accessibilityRole="radio" accessibilityState={{ checked: visibility === 'public', selected: visibility === 'public' }} onPress={() => setVisibility('public')} style={[styles.segment, visibility === 'public' && styles.segmentSelected]}>
                    <Globe2 size={17} color={colors.mossDeep} /><Text style={styles.segmentText}>Public</Text>
                  </Pressable>
                </View>
                <Text style={styles.audienceNote}>Friends is the default. Stories disappear after 24 hours.</Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.flax },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, minWidth: 0 },
  kicker: { fontFamily: type.medium, color: colors.terracottaDeep, fontSize: 10, letterSpacing: .8, textTransform: 'uppercase' },
  title: { marginTop: 1, fontFamily: type.heavy, color: colors.mossDeep, fontSize: 18 },
  postButton: { minWidth: 64, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.moss },
  postLabel: { fontFamily: type.heavy, color: colors.white, fontSize: 14 },
  body: { flex: 1 },
  content: { flexGrow: 1 },
  preview: { position: 'relative', overflow: 'hidden', backgroundColor: '#11110F' },
  captionOverlay: { position: 'absolute', left: 16, right: 16, bottom: 70, maxHeight: 126, alignItems: 'center' },
  captionPreview: { paddingHorizontal: 12, paddingVertical: 8, overflow: 'hidden', borderRadius: 12, backgroundColor: 'rgba(17,17,15,.72)', fontFamily: type.heavy, color: colors.white, fontSize: 17, lineHeight: 23, textAlign: 'center' },
  photoActions: { position: 'absolute', left: 12, right: 12, bottom: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  photoAction: { minHeight: 44, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 14, backgroundColor: colors.white },
  photoActionText: { fontFamily: type.heavy, color: colors.mossDeep, fontSize: 12 },
  controls: { padding: 17, paddingBottom: 28, gap: 8 },
  labelRow: { marginTop: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldLabel: { marginTop: 5, fontFamily: type.heavy, color: colors.mossDeep, fontSize: 12 },
  counter: { fontFamily: type.medium, color: colors.muted, fontSize: 11 },
  captionInput: { minHeight: 88, padding: 13, borderRadius: 14, backgroundColor: colors.white, fontFamily: type.regular, color: colors.mossDeep, fontSize: 16, lineHeight: 22, textAlignVertical: 'top', ...border },
  segmented: { flexDirection: 'row', padding: 3, borderRadius: 14, backgroundColor: colors.paperDeep, ...border },
  segment: { minHeight: 44, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 11 },
  segmentSelected: { backgroundColor: colors.apricot },
  segmentText: { fontFamily: type.heavy, color: colors.mossDeep, fontSize: 13 },
  audienceNote: { fontFamily: type.regular, color: colors.muted, fontSize: 12, lineHeight: 17 },
  disabled: { opacity: .45 },
});
