'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ShareItemDialog } from '@/components/share-item-dialog';
import { useState, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, Image as ImageIcon, X, Share2, Eye, EyeOff } from 'lucide-react';

interface Memory {
  id: string;
  content: string;
  imageUrl?: string | null;
  sharedWithFriend?: boolean;
  createdAt: Date;
}

interface MemoryListProps {
  friendId: string;
  friendName?: string;
  linkedUserId?: string | null; // If set, this friend is an Amika user
  memories: Memory[];
  onUpdate: () => void;
}

export function MemoryList({ friendId, friendName, linkedUserId, memories, onUpdate }: MemoryListProps) {
  const [newMemory, setNewMemory] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [shareWithFriend, setShareWithFriend] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAmikaFriend = Boolean(linkedUserId);

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

  const handleAddMemory = async () => {
    if (!newMemory.trim()) return;

    setLoading(true);
    try {
      let imageUrl = null;

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

      const response = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          friendId,
          content: newMemory,
          imageUrl,
          sharedWithFriend: isAmikaFriend ? shareWithFriend : false,
        }),
      });

      if (response.ok) {
        setNewMemory('');
        setSelectedImage(null);
        setImagePreview(null);
        setShareWithFriend(false);
        onUpdate();
      }
    } catch (error) {
      console.error('Error adding memory:', error);
      alert('Failed to add memory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    if (!confirm('Delete this memory?')) return;

    try {
      const response = await fetch(`/api/memories?id=${memoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error deleting memory:', error);
    }
  };

  const handleToggleSharing = async (memoryId: string, currentShared: boolean) => {
    try {
      const response = await fetch('/api/memories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: memoryId,
          sharedWithFriend: !currentShared,
        }),
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating memory sharing:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Add a Memory</label>
        <Textarea
          value={newMemory}
          onChange={(e) => setNewMemory(e.target.value)}
          placeholder="Something special you remember about this friend..."
          rows={3}
        />

        {imagePreview && (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Memory preview"
              className="w-full max-w-xs h-48 object-cover rounded-lg border border-gray-200"
            />
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {isAmikaFriend && (
          <div className="flex items-center gap-2 p-2 bg-[#A8C5A8]/10 rounded-lg">
            <Switch
              id="share-memory"
              checked={shareWithFriend}
              onCheckedChange={setShareWithFriend}
            />
            <Label htmlFor="share-memory" className="text-sm">
              Share with {friendName || 'friend'}
            </Label>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="border-[#A8C5A8]/60 text-[#A8C5A8]"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Add Image
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <Button
            onClick={handleAddMemory}
            disabled={loading || !newMemory.trim()}
            className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
          >
            {loading ? 'Adding...' : 'Add Memory'}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {memories.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No memories yet. Add your first one above!</p>
        ) : (
          memories.map((memory) => (
            <Card key={memory.id} className="p-4 border-[#A8C5A8]/20">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-gray-700">{memory.content}</p>
                  {memory.imageUrl && (
                    <img
                      src={memory.imageUrl}
                      alt="Memory"
                      className="w-full max-w-md h-48 object-cover rounded-lg"
                    />
                  )}
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(memory.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex gap-1">
                  {isAmikaFriend && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleSharing(memory.id, memory.sharedWithFriend || false)}
                      className={memory.sharedWithFriend ? 'text-[#A8C5A8]' : 'text-gray-400'}
                      title={memory.sharedWithFriend ? 'Shared' : 'Not shared'}
                    >
                      {memory.sharedWithFriend ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                  )}
                  {!isAmikaFriend && (
                    <ShareItemDialog
                      itemType="memory"
                      itemId={memory.id}
                      itemTitle={memory.content.slice(0, 50)}
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-[#A8C5A8]"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      }
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMemory(memory.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
