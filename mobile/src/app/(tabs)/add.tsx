import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/screen';
import { MemoryComposer } from '@/components/memory-composer';

export default function AddScreen() {
  const router = useRouter();
  const { friendId } = useLocalSearchParams<{ friendId?: string }>();
  return <Screen title="Keep today" eyebrow="One honest moment"><MemoryComposer initiallyOpen compact initialFriendId={friendId} onSaved={() => router.replace('/')} /></Screen>;
}
