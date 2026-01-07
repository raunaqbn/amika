'use client';

import { Calendar, Eye, ImagePlus, User, Image as ImageIcon, Camera, FolderOpen, X, RotateCcw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface FriendAvatarProps {
  name: string;
  profileImage?: string | null;  // Default/synced profile image
  customProfileImage?: string | null;  // User-uploaded custom image
  hasUpcomingEvent?: boolean;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
  onImageUpload?: (file: File) => void;
  onResetToDefault?: () => void;  // Callback to reset to default image
  linkedUserId?: string | null;
  friendId?: string;
}

export function FriendAvatar({
  name,
  profileImage,
  customProfileImage,
  hasUpcomingEvent = false,
  size = 'md',
  editable = false,
  onImageUpload,
  onResetToDefault,
  linkedUserId,
  friendId,
}: FriendAvatarProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [changeImageMenuOpen, setChangeImageMenuOpen] = useState(false);

  // Display custom image if set, otherwise fall back to default/synced image
  const displayImage = customProfileImage || profileImage;

  // Determine if there's a default image to reset to
  // For Amika friends: the default is the linked user's profile image (profileImage)
  // For regular friends: the default is no image (initials)
  const hasDefaultImage = linkedUserId ? !!profileImage : false;
  const isUsingCustomImage = !!customProfileImage;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-24 h-24 text-2xl',
    lg: 'w-32 h-32 text-4xl',
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

  const handleViewProfile = () => {
    setMenuOpen(false);
    if (linkedUserId) {
      router.push(`/friends/amika/${linkedUserId}`);
    }
  };

  const handleTakePhoto = () => {
    setChangeImageMenuOpen(false);
    setMenuOpen(false);
    cameraInputRef.current?.click();
  };

  const handleChooseFromLibrary = () => {
    setChangeImageMenuOpen(false);
    setMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleResetToDefault = () => {
    setMenuOpen(false);
    if (onResetToDefault) {
      onResetToDefault();
    }
  };

  return (
    <div className="relative inline-block">
      <Avatar
        className={`${sizeClasses[size]} bg-[#A8C5A8] text-white ${editable ? 'cursor-pointer' : ''}`}
        onClick={editable ? () => setMenuOpen(true) : undefined}
      >
        {displayImage && <AvatarImage src={displayImage} alt={name} />}
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

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Menu Dialog */}
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="sm:max-w-sm p-0 rounded-2xl overflow-hidden" showCloseButton={false}>
          <div className="bg-white">
            {/* 1. Upload Picture Option - Available for all friends */}
            {onImageUpload && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setChangeImageMenuOpen(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <ImagePlus className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900">Upload Picture</span>
              </button>
            )}

            {/* 2. Use Default Option - Available for all friends */}
            {onResetToDefault && (isUsingCustomImage || (!linkedUserId && displayImage)) && (
              <button
                onClick={handleResetToDefault}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <RotateCcw className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900">Use Default</span>
                {linkedUserId && hasDefaultImage && (
                  <span className="text-xs text-gray-400 ml-auto">Friend&apos;s photo</span>
                )}
              </button>
            )}

            {/* 3. View Picture Option */}
            {displayImage && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setImageViewerOpen(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <Eye className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900">View Picture</span>
              </button>
            )}

            {/* View Profile Option (only for Amika friends) */}
            {linkedUserId && (
              <button
                onClick={handleViewProfile}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900">View Profile</span>
              </button>
            )}

            {/* Cancel Button */}
            <button
              onClick={() => setMenuOpen(false)}
              className="w-full py-3 text-[#D4A5A5] font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Image Menu Dialog */}
      <Dialog open={changeImageMenuOpen} onOpenChange={setChangeImageMenuOpen}>
        <DialogContent className="sm:max-w-sm p-0 rounded-2xl overflow-hidden" showCloseButton={false}>
          <div className="bg-white">
            <button
              onClick={handleChooseFromLibrary}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <ImageIcon className="w-5 h-5 text-gray-600" />
              <span className="text-gray-900">Photo Library</span>
            </button>

            <button
              onClick={handleTakePhoto}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <Camera className="w-5 h-5 text-gray-600" />
              <span className="text-gray-900">Take Photo</span>
            </button>

            <button
              onClick={handleChooseFromLibrary}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <FolderOpen className="w-5 h-5 text-gray-600" />
              <span className="text-gray-900">Choose File</span>
            </button>

            {/* Cancel Button */}
            <button
              onClick={() => setChangeImageMenuOpen(false)}
              className="w-full py-3 text-[#D4A5A5] font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Dialog */}
      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="sm:max-w-lg p-0 bg-black/95 border-none" showCloseButton={false}>
          <div className="relative">
            <button
              onClick={() => setImageViewerOpen(false)}
              className="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            {displayImage && (
              <img
                src={displayImage}
                alt={name}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
