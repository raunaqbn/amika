import React, { memo, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Images } from 'lucide-react-native';
import { imageSource, mediaSource } from '@/lib/api';
import { colors, type } from '@/lib/theme';
import type { MemoryMedia } from '@/types';

function VideoSlide({ height, item, width }: { height: number; item: MemoryMedia; width: number }) {
  const source = useMemo(() => mediaSource(item.url), [item.url]);
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = false;
  });
  return <VideoView player={player} style={{ width, height }} contentFit="contain" nativeControls allowsPictureInPicture />;
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
        ? <VideoSlide height={height} item={item} key={`${item.url}-${mediaIndex}`} width={width} />
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
  count: { position: 'absolute', top: 10, right: 10, minHeight: 28, paddingHorizontal: 9, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(20,20,20,.72)' },
  countText: { fontFamily: type.heavy, color: colors.white, fontSize: 11 },
  dots: { position: 'absolute', left: 0, right: 0, bottom: 10, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.48)' },
  dotActive: { width: 16, backgroundColor: colors.white },
});
