'use client';

import { Calendar, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { useRef } from 'react';

interface FriendAvatarProps {
  name: string;
  profileImage?: string | null;
  hasUpcomingEvent?: boolean;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
  onImageUpload?: (file: File) => void;
}

export function FriendAvatar({
  name,
  profileImage,
  hasUpcomingEvent = false,
  size = 'md',
  editable = false,
  onImageUpload,
}: FriendAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-16 h-16 text-xl',
    lg: 'w-24 h-24 text-3xl',
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
  };

  return (
    <div className="relative inline-block">
      <Avatar className={`${sizeClasses[size]} bg-[#A8C5A8] text-white`}>
        {profileImage && <AvatarImage src={profileImage} alt={name} />}
        <AvatarFallback className="bg-[#A8C5A8] text-white">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>

      {hasUpcomingEvent && (
        <Badge
          className="absolute -top-1 -right-1 w-6 h-6 p-0 flex items-center justify-center bg-[#D4A5A5] hover:bg-[#D4A5A5] border-2 border-white"
          title="Has upcoming event"
        >
          <Calendar className="w-3 h-3" />
        </Badge>
      )}

      {editable && onImageUpload && (
        <>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            title="Upload profile picture"
          >
            <Upload className="w-6 h-6 text-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </>
      )}
    </div>
  );
}
