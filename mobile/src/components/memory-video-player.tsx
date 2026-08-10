import React from 'react';
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
    instance.staysActiveInBackground = false;
    instance.play();
  });

  return <VideoView player={player} style={{ width, height }} contentFit="contain" nativeControls />;
}
