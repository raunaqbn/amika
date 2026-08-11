'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Images } from 'lucide-react';

export type MemoryMedia = {
  type: 'image' | 'video';
  url: string;
  width?: number;
  height?: number;
  durationMs?: number;
};

function AutoVideo({ src, label, controls }: { src: string; label: string; controls: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.45) void video.play().catch(() => {});
      else video.pause();
    }, { threshold: [0, 0.45, 0.8] });
    observer.observe(video);
    return () => observer.disconnect();
  }, [src]);

  return <video ref={ref} src={src} autoPlay muted loop playsInline controls={controls} preload="metadata" aria-label={label} />;
}

export function MemoryMediaCarousel({ media, label, onOpen, detail = false }: {
  media: MemoryMedia[];
  label: string;
  onOpen?: () => void;
  detail?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const active = media[Math.min(index, media.length - 1)];
  if (!active) return null;
  const previous = () => setIndex((current) => (current - 1 + media.length) % media.length);
  const next = () => setIndex((current) => (current + 1) % media.length);

  return <div className={`memory-media-carousel ${detail ? 'memory-media-carousel--detail' : ''}`}>
    {active.type === 'image' ? <button type="button" className="memory-media-carousel__stage" onClick={onOpen} aria-label={`Open ${label}, photo ${index + 1} of ${media.length}`}>
      <Image src={active.url} alt={label} fill sizes={detail ? '100vw' : '(max-width: 820px) 100vw, 420px'} className="object-contain" unoptimized />
    </button> : <div className="memory-media-carousel__stage">
      <AutoVideo src={active.url} controls={detail} label={`${label}, video ${index + 1} of ${media.length}`} />
    </div>}
    {media.length > 1 && <>
      <span className="memory-media-carousel__count"><Images aria-hidden="true" />{index + 1}/{media.length}</span>
      <button className="memory-media-carousel__arrow memory-media-carousel__arrow--left" type="button" onClick={previous} aria-label="Previous photo or video"><ChevronLeft aria-hidden="true" /></button>
      <button className="memory-media-carousel__arrow memory-media-carousel__arrow--right" type="button" onClick={next} aria-label="Next photo or video"><ChevronRight aria-hidden="true" /></button>
      <div className="memory-media-carousel__dots" aria-hidden="true">{media.map((_, dot) => <span className={dot === index ? 'is-active' : ''} key={dot} />)}</div>
    </>}
  </div>;
}
