import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/screen';
import { MemoryComposer } from '@/components/memory-composer';
import { MemorySavedCelebration } from '@/components/pebble-pair';

export default function AddScreen() {
  const router = useRouter();
  const { friendId } = useLocalSearchParams<{ friendId?: string }>();
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => router.replace('/'), 1900);
    return () => clearTimeout(timer);
  }, [router, saved]);
  return <><Screen title="Keep today" eyebrow="One honest moment"><MemoryComposer initiallyOpen compact initialFriendId={friendId} onSaved={() => setSaved(true)} /></Screen><MemorySavedCelebration visible={saved} /></>;
}
