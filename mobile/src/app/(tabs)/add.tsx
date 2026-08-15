import React, { useCallback, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/screen';
import { MemoryComposer } from '@/components/memory-composer';
import { MemorySavedCelebration } from '@/components/memory-seedling';

export default function AddScreen() {
  const router = useRouter();
  const { friendId } = useLocalSearchParams<{ friendId?: string }>();
  const [saved, setSaved] = useState(false);
  const dismissSaved = useCallback(() => {
    setSaved(false);
    router.replace('/');
  }, [router]);
  return <><Screen title="Keep today" eyebrow="One honest moment"><MemoryComposer initiallyOpen compact initialFriendId={friendId} onSaved={() => setSaved(true)} /></Screen><MemorySavedCelebration visible={saved} onDismiss={dismissSaved} /></>;
}
