import React, { useCallback, useMemo, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { api, imageSource } from '@/lib/api';
import { colors, type } from '@/lib/theme';
import { useAuth } from '@/context/auth';
import { Spinner } from '@/components/ui';
import { StoryViewer } from '@/components/profile-stories';
import { StoryComposer, type StoryPhoto } from '@/components/story-composer';
import type { Story } from '@/types';

type Group = { userId: string; name: string; image?: string | null; stories: Story[] };

export function HomeStories() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<StoryPhoto | null>(null);
  const [active, setActive] = useState<{ group: number; story: number } | null>(null);

  const load = useCallback(async () => {
    try { setStories(await api<Story[]>('/api/stories?scope=feed')); }
    catch { setStories([]); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const groups = useMemo(() => {
    const map = new Map<string, Group>();
    stories.forEach((story) => {
      const author = story.author || (story.isOwn && user ? { id: user.id, name: user.name, profileImage: user.profileImage } : undefined);
      if (!author) return;
      const current = map.get(story.userId);
      if (current) current.stories.push(story);
      else map.set(story.userId, { userId: story.userId, name: story.isOwn ? 'Your story' : author.name, image: author.profileImage, stories: [story] });
    });
    return [...map.values()].sort((a, b) => Number(b.userId === user?.id) - Number(a.userId === user?.id));
  }, [stories, user]);

  const pick = useCallback(async (source: 'camera' | 'library') => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo permission needed', `Allow Amika to use your ${source === 'camera' ? 'camera' : 'photos'} to add a story.`);
      return;
    }
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
      ...(source === 'library' ? { preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible } : {}),
    };
    const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;
    const asset = result.assets[0];
    setSelectedPhoto({ height: asset.height, uri: asset.uri, width: asset.width });
  }, []);

  const openPicker = useCallback(() => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: 'Add a 24-hour story', options: ['Cancel', 'Take photo', 'Choose from library'], cancelButtonIndex: 0 },
        (index) => { if (index === 1) void pick('camera'); if (index === 2) void pick('library'); },
      );
    } else {
      Alert.alert('Add a 24-hour story', undefined, [
        { text: 'Take photo', onPress: () => void pick('camera') },
        { text: 'Choose from library', onPress: () => void pick('library') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [pick]);

  const activeGroup = active ? groups[active.group] : undefined;
  const activeStory = active && activeGroup ? activeGroup.stories[active.story] : undefined;

  return <View style={styles.section}>
    <View style={styles.heading}><View><Text style={styles.kicker}>Fresh from your circle</Text><Text style={styles.title}>Stories</Text></View><Text style={styles.helper}>24 hours</Text></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
      <Pressable accessibilityRole="button" accessibilityLabel="Add a story" onPress={openPicker} style={styles.storyButton}>
        <View style={[styles.storyRing, styles.addRing]}><Plus size={27} color={colors.moss} /></View>
        <Text numberOfLines={1} style={styles.storyLabel}>Add story</Text>
      </Pressable>
      {loading ? <View style={styles.loading}><Spinner size="small" /><Text style={styles.loadingText}>Gathering…</Text></View> : groups.map((group, groupIndex) => {
        const newest = group.stories[group.stories.length - 1];
        return <Pressable key={group.userId} accessibilityRole="button" accessibilityLabel={`Open ${group.name}`} onPress={() => setActive({ group: groupIndex, story: group.stories.length - 1 })} style={styles.storyButton}>
          <View style={styles.storyRing}><Image source={imageSource(newest.imageUrl)} style={styles.thumbnail} contentFit="cover" cachePolicy="memory-disk" recyclingKey={newest.id} /></View>
          <Text numberOfLines={1} style={styles.storyLabel}>{group.name}</Text>
        </Pressable>;
      })}
    </ScrollView>
    {activeGroup && activeStory && active ? <StoryViewer
      story={activeStory}
      ownerName={activeGroup.name}
      ownerImage={activeGroup.image}
      position={active.story}
      total={activeGroup.stories.length}
      onClose={() => setActive(null)}
      onMove={(story) => setActive((current) => current ? { ...current, story } : null)}
      onRefresh={load}
      onDeleted={() => { setActive(null); void load(); }}
    /> : null}
    <StoryComposer
      photo={selectedPhoto}
      defaultVisibility="friends"
      onCancel={() => setSelectedPhoto(null)}
      onChooseAnother={openPicker}
      onPosted={async () => { setSelectedPhoto(null); await load(); }}
    />
  </View>;
}

const styles = StyleSheet.create({
  section: { paddingBottom: 4 },
  heading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  kicker: { fontFamily: type.medium, color: colors.terracotta, fontSize: 11 },
  title: { marginTop: 1, fontFamily: type.heavy, color: colors.mossDeep, fontSize: 24, letterSpacing: -.5 },
  helper: { paddingBottom: 3, fontFamily: type.medium, color: colors.muted, fontSize: 12 },
  rail: { gap: 12, paddingTop: 13, paddingBottom: 2 },
  storyButton: { width: 70, alignItems: 'center', gap: 6 },
  storyRing: { width: 66, height: 66, padding: 3, overflow: 'hidden', borderRadius: 33, borderWidth: 2, borderColor: colors.terracotta, backgroundColor: colors.white },
  addRing: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: colors.moss, backgroundColor: colors.apricotSoft },
  thumbnail: { width: '100%', height: '100%', borderRadius: 28 },
  storyLabel: { maxWidth: 70, fontFamily: type.medium, color: colors.mossDeep, fontSize: 11, textAlign: 'center' },
  loading: { width: 92, height: 66, alignItems: 'center', justifyContent: 'center', gap: 4 },
  loadingText: { fontFamily: type.regular, color: colors.muted, fontSize: 10 },
});
