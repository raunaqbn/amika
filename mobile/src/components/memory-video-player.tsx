import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';

export function MemoryVideoPlayer({
  height,
  source,
  width,
}: {
  height: number;
  source: VideoSource | null;
  width: number;
}) {
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = false;
    instance.play();
  });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') player.pause();
    });
    return () => {
      player.pause();
      subscription.remove();
    };
  }, [player]);

  return <VideoView player={player} style={{ width, height }} contentFit="contain" nativeControls />;
}
