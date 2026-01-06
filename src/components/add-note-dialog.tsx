'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Image as ImageIcon, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface Friend {
  id: string;
  name: string;
}

interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friends: Friend[];
  onNoteSaved?: () => void;
}

export function AddNoteDialog({
  open,
  onOpenChange,
  friends,
  onNoteSaved,
}: AddNoteDialogProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setTitle('');
      setContent('');
      setSelectedFriends([]);
      setSelectedImage(null);
      setImagePreview(null);
    }
  }, [open]);

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
            0.85
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      const compressedFile = await compressImage(file);

      if (compressedFile.size > 4 * 1024 * 1024) {
        alert('Image is still too large after compression. Please use a smaller image.');
        return;
      }

      setSelectedImage(compressedFile);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSave = async () => {
    if (!content.trim()) return;

    setSaving(true);
    try {
      let imageUrl = null;

      // Upload new image if one was selected
      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const data = await uploadRes.json();
          imageUrl = data.url;
        }
      }

      const payload = {
        title: title.trim() || null,
        content,
        imageUrl,
        friendIds: selectedFriends,
      };

      const response = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      const savedNote = await response.json();
      onOpenChange(false);
      onNoteSaved?.();

      // Navigate to the diary page with the new note selected
      router.push(`/diary?id=${savedNote.id}`);
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-w-[95vw] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>New note</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="What's on your mind?"
            />
          </div>

          {/* Chat with Amika link */}
          <Link
            href="/mirror"
            className="flex items-center gap-3 p-3 rounded-lg border border-[#A8C5A8]/30 bg-[#A8C5A8]/5 hover:bg-[#A8C5A8]/10 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#A8C5A8]/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#A8C5A8]" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Chat with Amika</p>
              <p className="text-xs text-gray-500">Talk through your thoughts with your AI coach</p>
            </div>
          </Link>

          <div className="space-y-2">
            <label className="text-sm font-medium">Image (optional)</label>
            {imagePreview && (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Note preview"
                  className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="border-[#A8C5A8]/60 text-[#A8C5A8]"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              {imagePreview ? 'Change Image' : 'Add Image'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tag friends</label>
            {friends.length === 0 ? (
              <p className="text-sm text-gray-500">
                Add friends first to tag them here.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {friends.map((friend) => (
                  <label
                    key={friend.id}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFriends.includes(friend.id)}
                      onChange={() => toggleFriend(friend.id)}
                      className="h-4 w-4 rounded border-gray-300 text-[#A8C5A8] focus:ring-[#A8C5A8]"
                    />
                    {friend.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
          >
            {saving ? 'Saving...' : 'Save note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
