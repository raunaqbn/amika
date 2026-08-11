import React from 'react';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';

export function MemoryVideoPlayer({
  contentFit,
  height,
  source,
  width,
}: {
  contentFit: 'contain' | 'cover';
  height: number;
  source: VideoSource | null;
  width: number;
}) {
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.staysActiveInBackground = false;
    instance.play();
  });

  return <VideoView player={player} style={{ width, height }} contentFit={contentFit} nativeControls={false} />;
}
