'use client';

import { useState, useRef, useEffect, Suspense, lazy, memo } from 'react';
import type { EmojiClickData, Theme } from 'emoji-picker-react';
import { Smile } from 'lucide-react';
import { Button } from './button';

// Lazy load the heavy emoji picker library (~100KB)
const EmojiPickerLib = lazy(() => import('emoji-picker-react').then(mod => ({ default: mod.default })));

// Store Theme enum for use when picker is loaded
const LIGHT_THEME: Theme = 'light' as Theme;

interface EmojiPickerButtonProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
  className?: string;
  buttonVariant?: 'default' | 'outline' | 'ghost';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
}

function EmojiPickerLoading() {
  return (
    <div className="w-[320px] h-[400px] bg-white rounded-lg shadow-lg border flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A8C5A8]"></div>
    </div>
  );
}

function EmojiPickerButtonInner({
  onEmojiSelect,
  disabled = false,
  className = '',
  buttonVariant = 'outline',
  buttonSize = 'sm',
}: EmojiPickerButtonProps) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setShowPicker(false);
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        ref={buttonRef}
        type="button"
        variant={buttonVariant}
        size={buttonSize}
        onClick={() => setShowPicker(!showPicker)}
        disabled={disabled}
        className="border-[#A8C5A8]/60 text-[#A8C5A8] hover:bg-[#A8C5A8]/10"
      >
        <Smile className="w-4 h-4" />
      </Button>

      {showPicker && (
        <div
          ref={pickerRef}
          className="absolute bottom-full right-0 mb-2 z-50"
        >
          <Suspense fallback={<EmojiPickerLoading />}>
            <EmojiPickerLib
              onEmojiClick={handleEmojiClick}
              theme={LIGHT_THEME}
              width={320}
              height={400}
              searchPlaceHolder="Search emoji..."
              previewConfig={{
                showPreview: false,
              }}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const EmojiPickerButton = memo(EmojiPickerButtonInner);
