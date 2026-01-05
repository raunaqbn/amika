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

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions (max 1920px on longest side)
          const maxSize = 1920;
          if (width > height && width > maxSize) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width / height) * maxSize;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to blob with quality adjustment
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Compression failed'));
              }
            },
            'image/jpeg',
            0.85 // 85% quality - good balance between quality and size
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload) return;

    try {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Compress the image
      const compressedFile = await compressImage(file);

      // Check if still too large (should be rare after compression)
      if (compressedFile.size > 4 * 1024 * 1024) {
        alert('Image is still too large after compression. Please use a smaller image.');
        return;
      }

      onImageUpload(compressedFile);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    }

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
