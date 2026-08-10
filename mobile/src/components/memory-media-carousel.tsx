import React, { memo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { CircleAlert, Images, Play } from 'lucide-react-native';
import { imageSource, mediaSource } from '@/lib/api';
import { colors, type } from '@/lib/theme';
import type { MemoryMedia } from '@/types';

type PlayerComponent = React.ComponentType<{
  height: number;
  source: ReturnType<typeof mediaSource>;
  width: number;
}>;

function VideoSlide({ active, height, item, width }: { active: boolean; height: number; item: MemoryMedia; width: number }) {
  const [Player, setPlayer] = useState<PlayerComponent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function loadPlayer() {
    if (loading || Player) return;
    setLoading(true);
    setError(false);
    try {
      const module = await import('./memory-video-player');
      setPlayer(() => module.MemoryVideoPlayer);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (Player && active) return <Player height={height} source={mediaSource(item.url)} width={width} />;
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={error ? 'Video unavailable' : 'Play video'}
    disabled={loading}
    onPress={() => void loadPlayer()}
    style={[styles.videoPlaceholder, { width, height }]}
  >
    <View style={styles.playButton}>{error ? <CircleAlert size={24} color={colors.white} /> : <Play size={25} color={colors.white} fill={colors.white} />}</View>
    <Text style={styles.videoTitle}>{error ? 'Video unavailable' : loading ? 'Opening video…' : 'Tap to play'}</Text>
    <Text style={styles.videoHint}>{error ? 'Try again after updating Amika.' : 'Video stays paused until you choose it.'}</Text>
  </Pressable>;
}

export const MemoryMediaCarousel = memo(function MemoryMediaCarousel({
  media,
  height,
  onPressImage,
}: {
  media: MemoryMedia[];
  height: number;
  onPressImage?: () => void;
}) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  if (!media.length) return null;
  return <View
    style={[styles.frame, { height }]}
    onLayout={(event) => setWidth(Math.round(event.nativeEvent.layout.width))}
  >
    {width ? <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      onMomentumScrollEnd={(event) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
    >
      {media.map((item, mediaIndex) => item.type === 'video'
        ? <VideoSlide active={mediaIndex === index} height={height} item={item} key={`${item.url}-${mediaIndex}`} width={width} />
        : <Pressable accessibilityRole="imagebutton" accessibilityLabel={`Open photo ${mediaIndex + 1} of ${media.length}`} key={`${item.url}-${mediaIndex}`} onPress={onPressImage}>
          <Image source={imageSource(item.url)} style={{ width, height }} contentFit="contain" cachePolicy="memory-disk" recyclingKey={item.url} enforceEarlyResizing />
        </Pressable>)}
    </ScrollView> : null}
    {media.length > 1 ? <>
      <View pointerEvents="none" style={styles.count}><Images size={13} color={colors.white} /><Text style={styles.countText}>{index + 1}/{media.length}</Text></View>
      <View pointerEvents="none" style={styles.dots}>{media.map((_, dot) => <View key={dot} style={[styles.dot, dot === index && styles.dotActive]} />)}</View>
    </> : null}
  </View>;
});

const styles = StyleSheet.create({
  frame: { width: '100%', overflow: 'hidden', backgroundColor: colors.ink, borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: colors.line },
  videoPlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 28, backgroundColor: colors.ink },
  playButton: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.16)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,.72)' },
  videoTitle: { fontFamily: type.heavy, color: colors.white, fontSize: 15 },
  videoHint: { fontFamily: type.regular, color: 'rgba(255,255,255,.68)', fontSize: 11, textAlign: 'center' },
  count: { position: 'absolute', top: 10, right: 10, minHeight: 28, paddingHorizontal: 9, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(20,20,20,.72)' },
  countText: { fontFamily: type.heavy, color: colors.white, fontSize: 11 },
  dots: { position: 'absolute', left: 0, right: 0, bottom: 10, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.48)' },
  dotActive: { width: 16, backgroundColor: colors.white },
});
