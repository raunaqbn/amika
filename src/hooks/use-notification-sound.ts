'use client';

import { useCallback, useRef } from 'react';

/**
 * Hook that provides a function to play a notification sound.
 * Uses Web Audio API to generate a pleasant notification tone.
 */
export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      // Create audio context lazily (required for user gesture policy)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      // Resume context if suspended (browser autoplay policy)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const now = audioContext.currentTime;

      // Create a pleasant two-tone notification sound
      // First tone - higher pitch
      const oscillator1 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();

      oscillator1.connect(gainNode1);
      gainNode1.connect(audioContext.destination);

      oscillator1.frequency.setValueAtTime(880, now); // A5 note
      oscillator1.type = 'sine';

      gainNode1.gain.setValueAtTime(0, now);
      gainNode1.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gainNode1.gain.linearRampToValueAtTime(0, now + 0.15);

      oscillator1.start(now);
      oscillator1.stop(now + 0.15);

      // Second tone - slightly lower, creates a pleasant "ding" effect
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();

      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);

      oscillator2.frequency.setValueAtTime(1320, now + 0.1); // E6 note
      oscillator2.type = 'sine';

      gainNode2.gain.setValueAtTime(0, now + 0.1);
      gainNode2.gain.linearRampToValueAtTime(0.2, now + 0.12);
      gainNode2.gain.linearRampToValueAtTime(0, now + 0.3);

      oscillator2.start(now + 0.1);
      oscillator2.stop(now + 0.3);

    } catch (error) {
      // Silently fail if audio is not supported
      console.debug('Could not play notification sound:', error);
    }
  }, []);

  return { playNotificationSound };
}
