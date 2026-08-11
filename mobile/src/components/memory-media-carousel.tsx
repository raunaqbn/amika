import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useIsFocused } from 'expo-router';
import { ChevronLeft, ChevronRight, CircleAlert, Images, Play } from 'lucide-react-native';
import { imageSource, mediaSource } from '@/lib/api';
import { colors, type } from '@/lib/theme';
import type { MemoryMedia } from '@/types';

type PlayerComponent = React.ComponentType<{
  contentFit: 'contain' | 'cover';
  height: number;
  source: ReturnType<typeof mediaSource>;
  width: number;
}>;

function VideoSlide({ active, contentFit, height, item, width }: { active: boolean; contentFit: 'contain' | 'cover'; height: number; item: MemoryMedia; width: number }) {
  const [Player, setPlayer] = useState<PlayerComponent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadPlayer = useCallback(async () => {
    if (loading || Player) return;
    setLoading(true);
    setError(false);
    try {
      const module = await import('./memory-video-player');
      if (mounted.current) setPlayer(() => module.MemoryVideoPlayer);
    } catch {
      if (mounted.current) setError(true);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [loading, Player]);

  useEffect(() => {
    if (active && !Player && !loading) void loadPlayer();
  }, [active, loadPlayer, loading, Player]);

  if (Player && active) return <Player contentFit={contentFit} height={height} source={mediaSource(item.url)} width={width} />;
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={error ? 'Video unavailable' : active ? 'Loading video' : 'Video paused offscreen'}
    disabled={loading}
    onPress={() => void loadPlayer()}
    style={[styles.videoPlaceholder, { width, height }]}
  >
    <View style={styles.playButton}>{error ? <CircleAlert size={24} color={colors.white} /> : <Play size={25} color={colors.white} fill={colors.white} />}</View>
    <Text style={styles.videoTitle}>{error ? 'Video unavailable' : loading ? 'Starting video…' : 'Video'}</Text>
    <Text style={styles.videoHint}>{error ? 'Try again after updating Amika.' : 'Plays automatically while this post is visible.'}</Text>
  </Pressable>;
}

export const MemoryMediaCarousel = memo(function MemoryMediaCarousel({
  media,
  height,
  detail = false,
  onPressImage,
  playbackEnabled = true,
}: {
  media: MemoryMedia[];
  height: number;
  detail?: boolean;
  onPressImage?: () => void;
  playbackEnabled?: boolean;
}) {
  const isFocused = useIsFocused();
  const scrollRef = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const videoPlaybackEnabled = playbackEnabled && isFocused;
  const setCurrentIndex = useCallback((nextIndex: number) => {
    const bounded = Math.max(0, Math.min(media.length - 1, nextIndex));
    setIndex(bounded);
    scrollRef.current?.scrollTo({ x: bounded * width, animated: true });
  }, [media.length, width]);
  if (!media.length) return null;
  return <View
    style={[styles.frame, { height }]}
    onLayout={(event) => setWidth(Math.round(event.nativeEvent.layout.width))}
  >
    {width ? <ScrollView
      ref={scrollRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      scrollEventThrottle={32}
      onScroll={(event) => {
        const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
        if (nextIndex !== index) setIndex(nextIndex);
      }}
      onMomentumScrollEnd={(event) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
    >
      {media.map((item, mediaIndex) => item.type === 'video'
        ? <VideoSlide active={videoPlaybackEnabled && mediaIndex === index} contentFit={detail ? 'contain' : 'cover'} height={height} item={item} key={`${item.url}-${mediaIndex}`} width={width} />
        : <Pressable accessibilityRole="imagebutton" accessibilityLabel={`Open photo ${mediaIndex + 1} of ${media.length}`} key={`${item.url}-${mediaIndex}`} onPress={onPressImage}>
          {Math.abs(mediaIndex - index) <= 1
            ? <Image source={imageSource(item.url)} style={{ width, height }} contentFit={detail ? 'contain' : 'cover'} cachePolicy="memory-disk" recyclingKey={item.url} enforceEarlyResizing />
            : <View style={{ width, height, backgroundColor: colors.ink }} />}
        </Pressable>)}
    </ScrollView> : null}
    {media.length > 1 ? <>
      <View pointerEvents="none" style={styles.count}><Images size={13} color={colors.white} /><Text style={styles.countText}>{index + 1}/{media.length}</Text></View>
      {index > 0 ? <Pressable accessibilityRole="button" accessibilityLabel="Previous media" onPress={() => setCurrentIndex(index - 1)} style={[styles.arrow, styles.arrowLeft]}><ChevronLeft size={19} color={colors.white} /></Pressable> : null}
      {index < media.length - 1 ? <Pressable accessibilityRole="button" accessibilityLabel="Next media" onPress={() => setCurrentIndex(index + 1)} style={[styles.arrow, styles.arrowRight]}><ChevronRight size={19} color={colors.white} /></Pressable> : null}
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
  count: { position: 'absolute', zIndex: 3, top: 10, right: 10, minHeight: 28, paddingHorizontal: 9, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(20,20,20,.72)' },
  countText: { fontFamily: type.heavy, color: colors.white, fontSize: 11 },
  arrow: { position: 'absolute', zIndex: 4, top: '50%', width: 36, height: 44, marginTop: -22, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,20,20,.62)' },
  arrowLeft: { left: 8 },
  arrowRight: { right: 8 },
  dots: { position: 'absolute', zIndex: 3, left: 0, right: 0, bottom: 10, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.48)' },
  dotActive: { width: 16, backgroundColor: colors.white },
});
