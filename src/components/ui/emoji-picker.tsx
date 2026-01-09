'use client';

import { useState, useRef, useEffect } from 'react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { Smile } from 'lucide-react';
import { Button } from './button';

interface EmojiPickerButtonProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
  className?: string;
  buttonVariant?: 'default' | 'outline' | 'ghost';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
}

export function EmojiPickerButton({
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
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={Theme.LIGHT}
            width={320}
            height={400}
            searchPlaceHolder="Search emoji..."
            previewConfig={{
              showPreview: false,
            }}
          />
        </div>
      )}
    </div>
  );
}
