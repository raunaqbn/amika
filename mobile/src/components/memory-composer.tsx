import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { Camera, ChevronDown, ChevronUp, ImagePlus, Lock, Sparkles, UserPlus, UserRound, Users } from 'lucide-react-native';
import { api, apiCached, getCachedApiData, imageSource, prepareImageForUpload, uploadImage } from '@/lib/api';
import { border, colors, shadow, type } from '@/lib/theme';
import type { Friend } from '@/types';
import { Button, Field } from './ui';
import { FriendTagPicker } from './friend-tag-picker';

const FRIENDS_PATH = '/api/friends';

export function MemoryComposer({ initiallyOpen = false, compact = false, initialFriendId, onSaved }: { initiallyOpen?: boolean; compact?: boolean; initialFriendId?: string; onSaved?: () => void }) {
  const [open, setOpen] = useState(initiallyOpen);
  const [friends, setFriends] = useState<Friend[]>(() => getCachedApiData<Friend[]>(FRIENDS_PATH) || []);
  const [friendIds, setFriendIds] = useState<string[]>(initialFriendId ? [initialFriendId] : []);
  const [shareWithMore, setShareWithMore] = useState(false);
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
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
    const permission = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Photo permission needed', 'Allow Amika to use photos so you can keep this memory.');
    try {
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: .55 })
        : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: .55,
          preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
        });
      if (result.canceled) return;
      const asset = result.assets[0];
      setPreparingPhoto(true);
      setImageUri(await prepareImageForUpload(asset.uri, asset.width, asset.height));
    } catch (error) {
      Alert.alert('Photo not ready', error instanceof Error ? error.message : 'Please choose a different photo.');
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
      const uploaded = imageUri ? await uploadImage(imageUri) : null;
      await api('/api/memories', { method: 'POST', body: JSON.stringify({ friendId: friendIds[0] || null, friendIds, content: content.trim(), imageUrl: uploaded?.url || null, visibility, sharedWithFriend: friendIds.length > 0 && visibility === 'friends', memoryDate: new Date().toISOString() }) });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setContent(''); setImageUri(null); setFriendIds(initialFriendId ? [initialFriendId] : []); setShareWithMore(false); setVisibility('private'); setOpen(false);
      onSaved?.();
    } catch (error) { Alert.alert('Memory not saved', error instanceof Error ? error.message : 'Please try again.'); }
    finally { setSaving(false); }
  }

  const selectedFriends = friends.filter((friend) => friendIds.includes(friend.id));
  const selected = selectedFriends[0];
  const allSelectedAreConnected = selectedFriends.length === friendIds.length && friendIds.length > 0 && selectedFriends.every((friend) => friend.linkedUserId);
  const audienceLabel = friendIds.length > 1 ? `Shared with ${friendIds.length} friends` : selected ? `Shared with ${selected.name}` : 'Choose an Amika friend';
  return <View style={[styles.packet, compact && { marginHorizontal: 0 }]}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={styles.packetTop}>
      <View style={styles.packetIcon}><Sparkles size={19} color={colors.ink} /></View><View style={{ flex: 1 }}><Text style={styles.kicker}>Today’s memory</Text><Text style={styles.packetTitle}>{open ? 'Hold onto this moment' : 'What should today remember?'}</Text></View>{open ? <ChevronUp color={colors.ink} /> : <ChevronDown color={colors.ink} />}
    </Pressable>
    {open ? <View style={styles.body}>
      <View style={styles.photoRow}>{imageUri ? <Image source={imageSource(imageUri)} style={styles.preview} contentFit="cover" /> : <View style={styles.photoEmpty}><ImagePlus size={28} color={colors.ink} /><Text style={styles.photoEmptyText}>{preparingPhoto ? 'Preparing photo…' : 'A photo makes it vivid'}</Text></View>}<View style={styles.photoButtons}><Pressable disabled={preparingPhoto} onPress={() => pick('camera')} style={styles.smallButton}><Camera size={17} color={colors.ink} /><Text style={styles.smallButtonText}>Camera</Text></Pressable><Pressable disabled={preparingPhoto} onPress={() => pick('library')} style={styles.smallButton}><ImagePlus size={17} color={colors.ink} /><Text style={styles.smallButtonText}>Library</Text></Pressable></View></View>
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
      {friends.filter((friend) => friend.linkedUserId).length > 1 ? <Pressable accessibilityRole="button" accessibilityState={{ expanded: shareWithMore }} onPress={() => { setShareWithMore((current) => { if (current) setFriendIds((ids) => ids.slice(0, 1)); return !current; }); }} style={styles.shareMore}>{shareWithMore ? <UserRound size={17} color={colors.ink} /> : <UserPlus size={17} color={colors.ink} />}<Text style={styles.shareMoreText}>{shareWithMore ? 'Use one friend' : 'Share with more friends'}</Text></Pressable> : null}
      <Text style={styles.label}>Who can see it</Text><View style={styles.privacyRow}><Pressable accessibilityState={{ disabled: !allSelectedAreConnected, selected: visibility === 'friends' }} disabled={!allSelectedAreConnected} onPress={() => setVisibility('friends')} style={[styles.privacy, visibility === 'friends' && styles.privacyActive, !allSelectedAreConnected && styles.privacyDisabled]}>{friendIds.length > 1 ? <Users size={17} color={colors.ink} /> : <UserRound size={17} color={colors.ink} />}<View><Text style={styles.privacyTitle}>{friendIds.length > 1 ? 'Selected friends' : 'Tagged friend'}</Text><Text style={styles.privacyBody}>{audienceLabel}</Text></View></Pressable><Pressable accessibilityState={{ selected: visibility === 'private' }} onPress={() => setVisibility('private')} style={[styles.privacy, visibility === 'private' && styles.privacyActive]}><Lock size={17} color={colors.ink} /><View><Text style={styles.privacyTitle}>Only me</Text><Text style={styles.privacyBody}>Private keepsake</Text></View></Pressable></View>
      <Button label="Save today’s memory" tone="ink" loading={saving} disabled={preparingPhoto} onPress={save} />
    </View> : <Pressable onPress={() => setOpen(true)} style={styles.fold}><Text style={styles.foldText}>Add photo · tag a friend · keep it forever</Text></Pressable>}
  </View>;
}

const styles = StyleSheet.create({
  packet: { backgroundColor: colors.periwinkle, borderRadius: 20, ...border, ...shadow }, packetTop: { minHeight: 92, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }, packetIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.citrus, alignItems: 'center', justifyContent: 'center', ...border }, kicker: { fontFamily: type.heavy, color: colors.periwinkleDark, textTransform: 'uppercase', fontSize: 10, letterSpacing: 1.4 }, packetTitle: { fontFamily: type.heavy, color: colors.ink, fontSize: 20, lineHeight: 25, marginTop: 2 }, fold: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 16, borderTopWidth: 1.5, borderTopColor: colors.line, backgroundColor: 'rgba(255,255,255,.22)', borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }, foldText: { fontFamily: type.medium, fontSize: 12, color: colors.ink },
  body: { padding: 15, paddingTop: 2, gap: 15 }, photoRow: { flexDirection: 'row', gap: 10 }, preview: { flex: 1, aspectRatio: 4 / 3, borderRadius: 14, ...border }, photoEmpty: { flex: 1, minHeight: 122, borderRadius: 14, borderStyle: 'dashed', backgroundColor: 'rgba(255,255,255,.3)', alignItems: 'center', justifyContent: 'center', gap: 5, ...border }, photoEmptyText: { fontFamily: type.medium, fontSize: 12, color: colors.ink }, photoButtons: { width: 96, gap: 8 }, smallButton: { flex: 1, backgroundColor: colors.white, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 4, ...border }, smallButtonText: { fontFamily: type.heavy, fontSize: 11, color: colors.ink },
  label: { fontFamily: type.heavy, color: colors.ink, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }, optional: { fontFamily: type.medium, color: colors.muted, fontSize: 10, letterSpacing: .5 },
  shareMore: { alignSelf: 'flex-start', minHeight: 42, paddingHorizontal: 12, borderRadius: 14, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 7, ...border }, shareMoreText: { fontFamily: type.heavy, color: colors.ink, fontSize: 12 },
  privacyRow: { flexDirection: 'row', gap: 8 }, privacy: { flex: 1, minHeight: 68, backgroundColor: 'rgba(255,255,255,.35)', borderRadius: 14, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8, ...border }, privacyActive: { backgroundColor: colors.citrus }, privacyDisabled: { opacity: .48 }, privacyTitle: { fontFamily: type.heavy, color: colors.ink, fontSize: 12 }, privacyBody: { fontFamily: type.regular, color: colors.ink, fontSize: 10, marginTop: 1 },
});
