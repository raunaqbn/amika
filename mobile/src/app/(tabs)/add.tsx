import React from 'react';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/screen';
import { MemoryComposer } from '@/components/memory-composer';

export default function AddScreen() {
  const router = useRouter();
  return <Screen title="Keep today" eyebrow="One honest moment"><MemoryComposer initiallyOpen compact onSaved={() => router.replace('/')} /></Screen>;
}
