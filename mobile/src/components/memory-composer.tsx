import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { Camera, ChevronDown, ChevronUp, ImagePlus, Lock, Pencil, Sparkles, Trash2, UserPlus, UserRound, Users, Video } from 'lucide-react-native';
import { api, apiCached, getCachedApiData, imageSource, prepareImageForUpload, uploadMemoryMedia } from '@/lib/api';
import { prependCachedMemory } from '@/lib/memory-feed';
import { border, colors, shadow, type } from '@/lib/theme';
import type { Friend, Memory } from '@/types';
import { Button, Field } from './ui';
import { FriendTagPicker } from './friend-tag-picker';
import { DEFAULT_PHOTO_EDIT, PhotoEditor, type PhotoEditRecipe } from './photo-editor';
import { useAuth } from '@/context/auth';

const FRIENDS_PATH = '/api/friends';
const MAX_MEDIA = 10;

type DraftMedia = {
  id: string;
  type: 'image' | 'video';
  uri: string;
  sourceUri: string;
  width: number;
  height: number;
  durationMs?: number;
  fileName?: string | null;
  mimeType?: string | null;
  recipe: PhotoEditRecipe;
};

function DraftVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls />;
}

export function MemoryComposer({ initiallyOpen = false, compact = false, initialFriendId, onSaved }: { initiallyOpen?: boolean; compact?: boolean; initialFriendId?: string; onSaved?: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(initiallyOpen);
  const [friends, setFriends] = useState<Friend[]>(() => getCachedApiData<Friend[]>(FRIENDS_PATH) || []);
  const [friendIds, setFriendIds] = useState<string[]>(initialFriendId ? [initialFriendId] : []);
  const [shareWithMore, setShareWithMore] = useState(false);
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<DraftMedia[]>([]);
  const [editingPhoto, setEditingPhoto] = useState<DraftMedia | null>(null);
  const [visibility, setVisibility] = useState<'private' | 'friends'>('private');
  const [saving, setSaving] = useState(false);
  const [preparingPhoto, setPreparingPhoto] = useState(false);

  useFocusEffect(useCallback(() => {
    apiCached<Friend[]>(FRIENDS_PATH).then((items) => {
      setFriends(items);
    }).catch(() => {});
  }, []));

  useEffect(() => {
    if (initialFriendId) setFriendIds([initialFriendId]);
  }, [initialFriendId]);

  useEffect(() => {
    if (friends.length) setFriendIds((current) => current.filter((friendId) => friends.some((friend) => friend.id === friendId)));
  }, [friends]);

  async function pick(source: 'camera' | 'library') {
    if (media.length >= MAX_MEDIA) return Alert.alert('Post is full', `You can add up to ${MAX_MEDIA} photos and videos.`);
    const permission = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Media permission needed', 'Allow Amika to use your camera or library so you can keep this memory.');
    setPreparingPhoto(true);
    try {
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images', 'videos'], quality: 1, videoMaxDuration: 60 })
        : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images', 'videos'],
          allowsMultipleSelection: true,
          orderedSelection: true,
          selectionLimit: MAX_MEDIA - media.length,
          quality: 1,
          preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
        });
      if (result.canceled) return;
      const prepared = await Promise.all(result.assets.slice(0, MAX_MEDIA - media.length).map(async (asset): Promise<DraftMedia> => {
        const type = asset.type === 'video' ? 'video' : 'image';
        const uri = type === 'image' ? await prepareImageForUpload(asset.uri, asset.width, asset.height) : asset.uri;
        if (type === 'video' && (asset.fileSize || 0) > 100 * 1024 * 1024) throw new Error('Videos must be 100 MB or smaller.');
        return {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          type,
          uri,
          sourceUri: asset.uri,
          width: asset.width,
          height: asset.height,
          durationMs: asset.duration || undefined,
          fileName: asset.fileName,
          mimeType: asset.mimeType,
          recipe: DEFAULT_PHOTO_EDIT,
        };
      }));
      setMedia((current) => [...current, ...prepared].slice(0, MAX_MEDIA));
    } catch (error) {
      Alert.alert('Media not ready', error instanceof Error ? error.message : 'Please choose a different photo or video.');
    } finally {
      setPreparingPhoto(false);
    }
  }

  async function save() {
    if (!content.trim()) return Alert.alert('Add a few words', 'What made this moment worth keeping?');
    if (visibility === 'friends' && !allSelectedAreConnected) {
      return Alert.alert('Choose Amika friends', 'Everyone selected must be connected with you on Amika, or select Only me.');
    }
    setSaving(true);
    try {
      if (!user?.id) throw new Error('Your session is still loading. Please try again.');
      const uploaded = await Promise.all(media.map(async (item) => ({
        type: item.type,
        ...(await uploadMemoryMedia({
          uri: item.uri,
          ownerId: user.id,
          fileName: item.fileName,
          mimeType: item.mimeType,
          type: item.type,
        })),
        width: item.width,
        height: item.height,
        durationMs: item.durationMs,
      })));
      const memory = await api<Memory>('/api/memories', { method: 'POST', body: JSON.stringify({ friendId: friendIds[0] || null, friendIds, content: content.trim(), media: uploaded, visibility, sharedWithFriend: friendIds.length > 0 && visibility === 'friends', memoryDate: new Date().toISOString() }) });
      await prependCachedMemory({
        ...memory,
        friend: selected ? { id: selected.id, name: selected.name, profileImage: selected.customProfileImage || selected.profileImage } : null,
        audienceCount: visibility === 'friends' ? friendIds.length : 0,
        reactionCount: 0,
        commentCount: 0,
        reactedByMe: false,
        isOwn: true,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setContent(''); setMedia([]); setEditingPhoto(null); setFriendIds(initialFriendId ? [initialFriendId] : []); setShareWithMore(false); setVisibility('private'); setOpen(false);
      onSaved?.();
    } catch (error) { Alert.alert('Memory not saved', error instanceof Error ? error.message : 'Please try again.'); }
    finally { setSaving(false); }
  }

  const selectedFriends = friends.filter((friend) => friendIds.includes(friend.id));
  const selected = selectedFriends[0];
  const allSelectedAreConnected = selectedFriends.length === friendIds.length && friendIds.length > 0 && selectedFriends.every((friend) => friend.linkedUserId);
  const audienceLabel = friendIds.length > 1 ? `Shared with ${friendIds.length} friends` : selected ? `Shared with ${selected.name}` : 'Choose an Amika friend';
  function toggleMultipleSharing() {
    if (shareWithMore) setFriendIds((ids) => ids.slice(0, 1));
    setShareWithMore(!shareWithMore);
  }
  return <View style={[styles.packet, compact && { marginHorizontal: 0 }]}>
    <PhotoEditor
      visible={Boolean(editingPhoto)}
      uri={editingPhoto?.sourceUri || null}
      width={editingPhoto?.width || 1}
      height={editingPhoto?.height || 1}
      initialRecipe={editingPhoto?.recipe || DEFAULT_PHOTO_EDIT}
      onCancel={() => setEditingPhoto(null)}
      onChooseAnother={() => { setEditingPhoto(null); void pick('library'); }}
      onUsePhoto={(photo) => {
        if (editingPhoto) setMedia((current) => current.map((item) => item.id === editingPhoto.id ? { ...item, uri: photo.uri, width: photo.width, height: photo.height, recipe: photo.recipe, mimeType: 'image/jpeg', fileName: `${item.fileName || 'photo'}.jpg` } : item));
        setEditingPhoto(null);
      }}
    />
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={styles.packetTop}>
      <View style={styles.packetIcon}><Sparkles size={19} color={colors.ink} /></View><View style={{ flex: 1 }}><Text style={styles.kicker}>Today’s memory</Text><Text style={styles.packetTitle}>{open ? 'Hold onto this moment' : 'What should today remember?'}</Text></View>{open ? <ChevronUp color={colors.ink} /> : <ChevronDown color={colors.ink} />}
    </Pressable>
    {open ? <View style={styles.body}>
      <View style={styles.photoRow}>
        <View style={styles.mediaPicker}>
          {media.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewList}>{media.map((item, index) => <View key={item.id} style={styles.previewWrap}>
            {item.type === 'image' ? <Image source={imageSource(item.uri)} style={styles.preview} contentFit="cover" alt={`Selected photo ${index + 1}`} /> : <DraftVideo uri={item.uri} />}
            <View style={styles.mediaBadge}>{item.type === 'video' ? <Video size={12} color={colors.white} /> : <ImagePlus size={12} color={colors.white} />}<Text style={styles.mediaBadgeText}>{index + 1}</Text></View>
            <View style={styles.photoActions}>
              {item.type === 'image' ? <Pressable accessibilityRole="button" accessibilityLabel={`Edit photo ${index + 1}`} onPress={() => setEditingPhoto(item)} style={styles.photoAction}><Pencil size={15} color={colors.ink} /><Text style={styles.photoActionText}>Edit</Text></Pressable> : <View />}
              <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.type} ${index + 1}`} onPress={() => setMedia((current) => current.filter((candidate) => candidate.id !== item.id))} style={styles.photoAction}><Trash2 size={15} color={colors.ink} /></Pressable>
            </View>
          </View>)}</ScrollView> : <View style={styles.photoEmpty}><ImagePlus size={28} color={colors.ink} /><Text style={styles.photoEmptyText}>{preparingPhoto ? 'Preparing media…' : 'Add up to 10 moments'}</Text><Text style={styles.photoEmptyHint}>Photos, videos, crop, and filters</Text></View>}
          <Text style={styles.mediaCount}>{media.length}/{MAX_MEDIA} selected</Text>
        </View>
        <View style={styles.photoButtons}><Pressable accessibilityRole="button" accessibilityLabel="Take a memory photo or video" disabled={preparingPhoto || media.length >= MAX_MEDIA} onPress={() => pick('camera')} style={styles.smallButton}><Camera size={17} color={colors.ink} /><Text style={styles.smallButtonText}>Camera</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Choose photos or videos from the library" disabled={preparingPhoto || media.length >= MAX_MEDIA} onPress={() => pick('library')} style={styles.smallButton}><ImagePlus size={17} color={colors.ink} /><Text style={styles.smallButtonText}>Library</Text></Pressable></View>
      </View>
      <Field label="The moment" placeholder="The tiny thing you don’t want to forget…" multiline value={content} onChangeText={setContent} maxLength={500} />
      <Text style={styles.label}>Who was there? <Text style={styles.optional}>Optional</Text></Text>
      <FriendTagPicker
        friends={friends}
        selectedIds={friendIds}
        multiple={shareWithMore}
        onChange={(ids) => {
          const nextFriendIds = ids.slice(0, 10);
          setFriendIds(nextFriendIds);
          const selectedItems = friends.filter((friend) => nextFriendIds.includes(friend.id));
          setVisibility(nextFriendIds.length && selectedItems.length === nextFriendIds.length && selectedItems.every((friend) => friend.linkedUserId) ? 'friends' : 'private');
        }}
        helper={friends.length ? (shareWithMore ? 'Choose up to 10 Amika friends. Everyone selected will be able to see this memory.' : 'Choose one friend by default, or add more people below.') : 'No friends yet—you can still save this memory privately.'}
      />
      {friends.filter((friend) => friend.linkedUserId).length > 1 ? <Pressable accessibilityRole="button" accessibilityState={{ expanded: shareWithMore }} onPress={toggleMultipleSharing} style={styles.shareMore}>{shareWithMore ? <UserRound size={17} color={colors.ink} /> : <UserPlus size={17} color={colors.ink} />}<Text style={styles.shareMoreText}>{shareWithMore ? 'Use one friend' : 'Share with more friends'}</Text></Pressable> : null}
      <Text style={styles.label}>Who can see it</Text><View accessibilityRole="radiogroup" style={styles.privacyRow}><Pressable accessibilityRole="radio" accessibilityState={{ checked: visibility === 'friends', disabled: !allSelectedAreConnected, selected: visibility === 'friends' }} disabled={!allSelectedAreConnected} onPress={() => setVisibility('friends')} style={[styles.privacy, visibility === 'friends' && styles.privacyActive, !allSelectedAreConnected && styles.privacyDisabled]}>{friendIds.length > 1 ? <Users size={17} color={colors.ink} /> : <UserRound size={17} color={colors.ink} />}<View><Text style={styles.privacyTitle}>{friendIds.length > 1 ? 'Selected friends' : 'Tagged friend'}</Text><Text style={styles.privacyBody}>{audienceLabel}</Text></View></Pressable><Pressable accessibilityRole="radio" accessibilityState={{ checked: visibility === 'private', selected: visibility === 'private' }} onPress={() => setVisibility('private')} style={[styles.privacy, visibility === 'private' && styles.privacyActive]}><Lock size={17} color={colors.ink} /><View><Text style={styles.privacyTitle}>Only me</Text><Text style={styles.privacyBody}>Private keepsake</Text></View></Pressable></View>
      <Button label="Save today’s memory" tone="ink" loading={saving} disabled={preparingPhoto} onPress={save} />
    </View> : <Pressable onPress={() => setOpen(true)} style={styles.fold}><Text style={styles.foldText}>Add photos or video · tag friends · keep it forever</Text></Pressable>}
  </View>;
}

const styles = StyleSheet.create({
  packet: { backgroundColor: colors.periwinkle, borderRadius: 20, ...border, ...shadow }, packetTop: { minHeight: 92, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }, packetIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.citrus, alignItems: 'center', justifyContent: 'center', ...border }, kicker: { fontFamily: type.heavy, color: colors.periwinkleDark, textTransform: 'uppercase', fontSize: 10, letterSpacing: 1.4 }, packetTitle: { fontFamily: type.heavy, color: colors.ink, fontSize: 20, lineHeight: 25, marginTop: 2 }, fold: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 16, borderTopWidth: 1.5, borderTopColor: colors.line, backgroundColor: 'rgba(255,255,255,.22)', borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }, foldText: { fontFamily: type.medium, fontSize: 12, color: colors.ink },
  body: { padding: 15, paddingTop: 2, gap: 15 }, photoRow: { flexDirection: 'row', gap: 10 }, mediaPicker: { flex: 1, minWidth: 0 }, previewList: { gap: 8 }, previewWrap: { width: 210, height: 158, overflow: 'hidden', borderRadius: 14, backgroundColor: colors.ink, ...border }, preview: { position: 'absolute', inset: 0 }, mediaBadge: { position: 'absolute', top: 7, right: 7, minHeight: 24, paddingHorizontal: 7, borderRadius: 12, backgroundColor: 'rgba(20,20,20,.7)', flexDirection: 'row', alignItems: 'center', gap: 4 }, mediaBadgeText: { fontFamily: type.heavy, color: colors.white, fontSize: 10 }, mediaCount: { marginTop: 5, fontFamily: type.medium, color: colors.periwinkleDark, fontSize: 10 }, photoActions: { position: 'absolute', left: 7, right: 7, bottom: 7, flexDirection: 'row', justifyContent: 'space-between' }, photoAction: { minWidth: 48, height: 42, paddingHorizontal: 11, borderRadius: 12, backgroundColor: colors.citrus, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, ...border }, photoActionText: { fontFamily: type.heavy, color: colors.ink, fontSize: 11 }, photoEmpty: { minHeight: 122, borderRadius: 14, borderStyle: 'dashed', backgroundColor: 'rgba(255,255,255,.3)', alignItems: 'center', justifyContent: 'center', gap: 4, ...border }, photoEmptyText: { fontFamily: type.medium, fontSize: 12, color: colors.ink }, photoEmptyHint: { fontFamily: type.regular, fontSize: 10, color: colors.periwinkleDark }, photoButtons: { width: 82, gap: 8 }, smallButton: { flex: 1, minHeight: 48, backgroundColor: colors.white, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 4, ...border }, smallButtonText: { fontFamily: type.heavy, fontSize: 11, color: colors.ink },
  label: { fontFamily: type.heavy, color: colors.ink, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }, optional: { fontFamily: type.medium, color: colors.muted, fontSize: 10, letterSpacing: .5 },
  shareMore: { alignSelf: 'flex-start', minHeight: 42, paddingHorizontal: 12, borderRadius: 14, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 7, ...border }, shareMoreText: { fontFamily: type.heavy, color: colors.ink, fontSize: 12 },
  privacyRow: { flexDirection: 'row', gap: 8 }, privacy: { flex: 1, minHeight: 68, backgroundColor: 'rgba(255,255,255,.35)', borderRadius: 14, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8, ...border }, privacyActive: { backgroundColor: colors.citrus }, privacyDisabled: { opacity: .48 }, privacyTitle: { fontFamily: type.heavy, color: colors.ink, fontSize: 12 }, privacyBody: { fontFamily: type.regular, color: colors.ink, fontSize: 10, marginTop: 1 },
});
