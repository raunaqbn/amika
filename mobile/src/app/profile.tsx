import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, ChevronLeft, LogOut, MessageCircle, Plus, ShieldCheck, Sparkles, Trash2, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';
import { Avatar, Button, PaperCard, Spinner } from '@/components/ui';
import { ProfileStories } from '@/components/profile-stories';
import { API_URL, prepareImageForUpload, uploadImage } from '@/lib/api';
import { customInterestId, interestLabel, INTEREST_SUGGESTIONS } from '@/lib/interests';
import { border, colors, shadow, type } from '@/lib/theme';

const MAX_STATUS_LENGTH = 139;
const MAX_INTERESTS = 20;

function sameInterests(left: string[], right: string[]) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, updateProfile } = useAuth();
  const [statusText, setStatusText] = useState(user?.statusText || '');
  const [interests, setInterests] = useState<string[]>(user?.interests || []);
  const [customInterest, setCustomInterest] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);

  useEffect(() => {
    setStatusText(user?.statusText || '');
    setInterests(user?.interests || []);
  }, [user?.interests, user?.statusText]);

  const statusLength = [...statusText].length;
  const dirty = statusText.trim() !== (user?.statusText || '')
    || !sameInterests(interests, user?.interests || []);
  const selectedLabels = useMemo(() => new Set(interests.map((item) => interestLabel(item).toLocaleLowerCase())), [interests]);

  function confirmSignOut() {
    Alert.alert('Sign out of Amika?', 'Your memories will stay safely in your account.', [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => void signOut().catch((error) => Alert.alert('Could not sign out safely', error instanceof Error ? error.message : 'Try again.')),
      },
    ]);
  }

  const savePickedPhoto = useCallback(async (asset: ImagePicker.ImagePickerAsset) => {
    setPhotoSaving(true);
    try {
      const preparedUri = await prepareImageForUpload(asset.uri, asset.width, asset.height);
      const uploaded = await uploadImage(preparedUri);
      await updateProfile({ profileImage: uploaded.url });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Photo not updated', error instanceof Error ? error.message : 'Choose a different photo and try again.');
    } finally {
      setPhotoSaving(false);
    }
  }, [updateProfile]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void ImagePicker.getPendingResultAsync().then((result) => {
      if (result && 'assets' in result && result.assets?.[0]) void savePickedPhoto(result.assets[0]);
    });
  }, [savePickedPhoto]);

  async function choosePhoto(source: 'camera' | 'library') {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo permission needed', `Allow Amika to use your ${source === 'camera' ? 'camera' : 'photos'} so you can set a profile picture.`);
      return;
    }

    setPhotoSaving(true);
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1,
      };
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync({
          ...options,
          preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
        });
      if (result.canceled) return;
      await savePickedPhoto(result.assets[0]);
    } catch (error) {
      Alert.alert('Photo not updated', error instanceof Error ? error.message : 'Choose a different photo and try again.');
    } finally {
      setPhotoSaving(false);
    }
  }

  function openPhotoMenu() {
    Alert.alert('Set profile photo', 'Choose where your new picture comes from.', [
      { text: 'Take photo', onPress: () => void choosePhoto('camera') },
      { text: 'Photo library', onPress: () => void choosePhoto('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function confirmRemovePhoto() {
    Alert.alert('Remove profile photo?', 'Your initial will be shown until you choose another picture.', [
      { text: 'Keep photo', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setPhotoSaving(true);
          void updateProfile({ profileImage: null })
            .then(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success))
            .catch((error) => Alert.alert('Photo not removed', error instanceof Error ? error.message : 'Please try again.'))
            .finally(() => setPhotoSaving(false));
        },
      },
    ]);
  }

  function toggleInterest(id: string) {
    setInterests((current) => {
      const label = interestLabel(id).toLocaleLowerCase();
      const existing = current.find((item) => interestLabel(item).toLocaleLowerCase() === label);
      if (existing) return current.filter((item) => item !== existing);
      if (current.length >= MAX_INTERESTS) {
        Alert.alert('Interest list full', `Choose up to ${MAX_INTERESTS} interests.`);
        return current;
      }
      return [...current, id];
    });
  }

  function addCustomInterest() {
    const label = customInterest.trim();
    if (!label) return;
    if ([...label].length > 50) {
      Alert.alert('Interest is too long', 'Keep each interest to 50 characters or fewer.');
      return;
    }
    if (selectedLabels.has(label.toLocaleLowerCase())) {
      setCustomInterest('');
      return;
    }
    if (interests.length >= MAX_INTERESTS) {
      Alert.alert('Interest list full', `Choose up to ${MAX_INTERESTS} interests.`);
      return;
    }
    setInterests((current) => [...current, customInterestId(label)]);
    setCustomInterest('');
  }

  async function saveProfile() {
    if (statusLength > MAX_STATUS_LENGTH) {
      Alert.alert('Status is too long', `Keep it to ${MAX_STATUS_LENGTH} characters or fewer.`);
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ statusText: statusText.trim() || null, interests });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Profile not saved', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}>
          <ChevronLeft size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Your Amika</Text>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <View style={styles.avatarWrap}>
              <Avatar name={user?.name || 'A'} uri={user?.profileImage} size={104} color={colors.citrus} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose a new profile photo"
                disabled={photoSaving}
                hitSlop={5}
                onPress={openPhotoMenu}
                style={({ pressed }) => [styles.cameraButton, pressed && styles.pressed, photoSaving && styles.disabled]}
              >
                {photoSaving ? <Spinner size="small" /> : <Camera size={19} color={colors.ink} />}
              </Pressable>
            </View>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={styles.statusPreview}>
              <MessageCircle size={15} color={colors.ink} />
              <Text numberOfLines={2} style={[styles.statusPreviewText, !statusText.trim() && styles.statusPlaceholder]}>
                {statusText.trim() || 'Add a little status for your friends'}
              </Text>
            </View>
            <View style={styles.photoActions}>
              <Pressable accessibilityRole="button" disabled={photoSaving} onPress={openPhotoMenu} style={styles.photoAction}>
                <Camera size={16} color={colors.ink} />
                <Text style={styles.photoActionText}>{user?.profileImage ? 'Change photo' : 'Add photo'}</Text>
              </Pressable>
              {user?.profileImage ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Remove profile photo" disabled={photoSaving} onPress={confirmRemovePhoto} style={styles.removePhoto}>
                  <Trash2 size={16} color={colors.danger} />
                </Pressable>
              ) : null}
            </View>
          </View>

          {user ? <ProfileStories ownerId={user.id} ownerName={user.name} ownerImage={user.profileImage} canPost /> : null}

          <PaperCard style={styles.editor}>
            <View style={styles.sectionHeading}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.sage }]}><MessageCircle size={18} color={colors.ink} /></View>
              <View style={styles.sectionCopy}>
                <Text style={styles.sectionTitle}>Your status</Text>
                <Text style={styles.sectionBody}>A short note your Amika friends can see.</Text>
              </View>
            </View>
            <TextInput
              accessibilityLabel="Profile status"
              maxLength={MAX_STATUS_LENGTH}
              multiline
              onChangeText={setStatusText}
              placeholder="At the beach, back soon…"
              placeholderTextColor="#6F6A64"
              returnKeyType="done"
              style={styles.statusInput}
              value={statusText}
            />
            <Text style={styles.characterCount}>{statusLength}/{MAX_STATUS_LENGTH}</Text>

            <View style={styles.divider} />

            <View style={styles.sectionHeading}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.sky }]}><Sparkles size={18} color={colors.ink} /></View>
              <View style={styles.sectionCopy}>
                <Text style={styles.sectionTitle}>Your things</Text>
                <Text style={styles.sectionBody}>Choose what you are into lately.</Text>
              </View>
            </View>

            {interests.length ? (
              <View style={styles.selectedInterests}>
                {interests.map((id) => (
                  <Pressable key={id} accessibilityRole="button" accessibilityLabel={`Remove ${interestLabel(id)}`} onPress={() => toggleInterest(id)} style={styles.selectedChip}>
                    <Text style={styles.selectedChipText}>{interestLabel(id)}</Text>
                    <X size={14} color={colors.ink} />
                  </Pressable>
                ))}
              </View>
            ) : <Text style={styles.emptyInterests}>Nothing added yet—pick a few below.</Text>}

            <Text style={styles.suggestionLabel}>Quick picks</Text>
            <View style={styles.suggestions}>
              {INTEREST_SUGGESTIONS.map((item) => {
                const selected = selectedLabels.has(item.label.toLocaleLowerCase());
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    onPress={() => toggleInterest(item.id)}
                    style={[styles.suggestionChip, selected && styles.suggestionChipSelected]}
                  >
                    <Text style={styles.suggestionText}>{item.label}</Text>
                    {selected ? <X size={13} color={colors.ink} /> : <Plus size={13} color={colors.ink} />}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.customRow}>
              <TextInput
                accessibilityLabel="Custom interest"
                maxLength={50}
                onChangeText={setCustomInterest}
                onSubmitEditing={addCustomInterest}
                placeholder="Add your own"
                placeholderTextColor="#6F6A64"
                returnKeyType="done"
                style={styles.customInput}
                value={customInterest}
              />
              <Pressable accessibilityRole="button" accessibilityLabel="Add custom interest" disabled={!customInterest.trim()} onPress={addCustomInterest} style={[styles.addButton, !customInterest.trim() && styles.disabled]}>
                <Plus size={20} color={colors.ink} />
              </Pressable>
            </View>

            <Button label={dirty ? 'Save profile' : 'Profile saved'} tone="citrus" loading={saving} disabled={!dirty} onPress={() => void saveProfile()} />
          </PaperCard>

          <View style={styles.privacyRow}>
            <View style={styles.privacyIcon}><ShieldCheck size={20} color={colors.ink} /></View>
            <View style={styles.privacyCopy}>
              <Text style={styles.privacyTitle}>Memories stay yours</Text>
              <Text style={styles.privacyBody}>Your status and interests are shared only with Amika friends.</Text>
            </View>
          </View>

          <View style={styles.accountFooter}>
            <View>
              <Text style={styles.metaLabel}>Connected service</Text>
              <Text numberOfLines={1} style={styles.meta}>{API_URL.replace('https://', '')}</Text>
            </View>
            <Text style={styles.version}>Amika mobile · 1.0.0</Text>
          </View>
          <Button label="Sign out" tone="paper" onPress={confirmSignOut} />
          <LogOut size={17} color={colors.muted} style={styles.signoutIcon} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  keyboard: { flex: 1 },
  header: { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, borderBottomWidth: 1.5, borderBottomColor: colors.line },
  back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: type.heavy, fontSize: 19, color: colors.ink },
  content: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: 18, paddingBottom: 44, gap: 20 },
  hero: { alignItems: 'center', paddingHorizontal: 18, paddingVertical: 24, borderRadius: 20, backgroundColor: colors.periwinkle, ...border, ...shadow },
  avatarWrap: { position: 'relative' },
  cameraButton: { position: 'absolute', right: -5, bottom: 1, width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.citrus, ...border },
  name: { fontFamily: type.heavy, color: colors.ink, fontSize: 29, marginTop: 14, textAlign: 'center' },
  email: { fontFamily: type.medium, color: colors.ink, fontSize: 13, marginTop: 2 },
  statusPreview: { maxWidth: 320, minHeight: 42, marginTop: 14, paddingHorizontal: 13, paddingVertical: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 14, backgroundColor: 'rgba(255,252,246,.72)', ...border },
  statusPreviewText: { flexShrink: 1, fontFamily: type.medium, color: colors.ink, fontSize: 13, lineHeight: 19 },
  statusPlaceholder: { color: '#3D3C39' },
  photoActions: { marginTop: 13, flexDirection: 'row', alignItems: 'center', gap: 8 },
  photoAction: { minHeight: Platform.select({ android: 48, default: 44 }), paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 14, backgroundColor: colors.white, ...border },
  photoActionText: { fontFamily: type.heavy, color: colors.ink, fontSize: 13 },
  removePhoto: { width: Platform.select({ android: 48, default: 44 }), height: Platform.select({ android: 48, default: 44 }), alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.white, ...border },
  editor: { gap: 14 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  sectionIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', ...border },
  sectionCopy: { flex: 1 },
  sectionTitle: { fontFamily: type.heavy, color: colors.ink, fontSize: 17 },
  sectionBody: { marginTop: 1, fontFamily: type.regular, color: colors.muted, fontSize: 12, lineHeight: 17 },
  statusInput: { minHeight: 88, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24, textAlignVertical: 'top', borderRadius: 14, backgroundColor: colors.paper, fontFamily: type.regular, color: colors.ink, fontSize: 16, lineHeight: 22, ...border },
  characterCount: { alignSelf: 'flex-end', marginTop: -35, marginRight: 11, marginBottom: 6, fontFamily: type.medium, color: '#6F6A64', fontSize: 11 },
  divider: { height: 1.5, marginVertical: 4, backgroundColor: colors.paperDeep },
  selectedInterests: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  selectedChip: { minHeight: Platform.select({ android: 48, default: 44 }), paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, backgroundColor: colors.sky, ...border },
  selectedChipText: { fontFamily: type.heavy, color: colors.ink, fontSize: 12 },
  emptyInterests: { paddingVertical: 3, fontFamily: type.regular, color: colors.muted, fontSize: 13 },
  suggestionLabel: { marginTop: 2, fontFamily: type.heavy, color: colors.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: .9 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  suggestionChip: { minHeight: Platform.select({ android: 48, default: 44 }), paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 12, backgroundColor: colors.paper, borderWidth: 1.5, borderColor: colors.paperDeep },
  suggestionChipSelected: { backgroundColor: colors.citrus, borderColor: colors.line },
  suggestionText: { fontFamily: type.medium, color: colors.ink, fontSize: 12 },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  customInput: { flex: 1, minHeight: 48, paddingHorizontal: 14, borderRadius: 14, backgroundColor: colors.white, fontFamily: type.regular, color: colors.ink, fontSize: 15, ...border },
  addButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.sage, ...border },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 3 },
  privacyIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center', ...border },
  privacyCopy: { flex: 1 },
  privacyTitle: { fontFamily: type.heavy, color: colors.ink, fontSize: 14 },
  privacyBody: { marginTop: 2, fontFamily: type.regular, color: colors.muted, fontSize: 12, lineHeight: 17 },
  accountFooter: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, paddingTop: 3 },
  metaLabel: { fontFamily: type.heavy, color: colors.periwinkleDark, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  meta: { maxWidth: 210, fontFamily: type.medium, color: colors.ink, fontSize: 12, marginTop: 4 },
  version: { fontFamily: type.regular, color: colors.muted, fontSize: 10 },
  signoutIcon: { alignSelf: 'center' },
  pressed: { transform: [{ translateY: 2 }] },
  disabled: { opacity: .45 },
});
