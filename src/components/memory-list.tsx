'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ShareItemDialog } from '@/components/share-item-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, Image as ImageIcon, X, Share2, Eye, EyeOff, Edit, Check } from 'lucide-react';
import { MemoryMediaCarousel, type MemoryMedia } from '@/components/memory-media-carousel';

interface Memory {
  id: string;
  content: string;
  imageUrl?: string | null;
  media?: MemoryMedia[];
  sharedWithFriend?: boolean;
  friendIds?: string[];
  createdAt: Date;
}

interface MemoryListProps {
  friendId: string;
  friendName?: string;
  linkedUserId?: string | null; // If set, this friend is an Amika user
  memories: Memory[];
  onUpdate: () => void;
  allFriends?: { id: string; name: string; linkedUserId?: string | null }[];
}

export function MemoryList({ friendId, friendName, linkedUserId, memories, onUpdate, allFriends = [] }: MemoryListProps) {
  const [newMemory, setNewMemory] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [shareWithFriend, setShareWithFriend] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editSelectedImage, setEditSelectedImage] = useState<File | null>(null);
  const [editSelectedFriends, setEditSelectedFriends] = useState<string[]>([]);
  const [editShareWithFriend, setEditShareWithFriend] = useState(false);
  const [saving, setSaving] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const isAmikaFriend = Boolean(linkedUserId);

  // Image viewer state
  const [viewerImageUrl, setViewerImageUrl] = useState<string | null>(null);

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

  const openEditDialog = (memory: Memory) => {
    setEditingMemory(memory);
    setEditContent(memory.content);
    setEditImagePreview(memory.imageUrl || null);
    setEditSelectedImage(null);
    // Set selected friends - use friendIds if available, otherwise use friendId
    setEditSelectedFriends(memory.friendIds || [friendId]);
    setEditShareWithFriend(false);
    setEditDialogOpen(true);
  };

  const handleEditImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setEditSelectedImage(compressedFile);

      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    }

    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  const handleEditRemoveImage = () => {
    setEditSelectedImage(null);
    setEditImagePreview(null);
  };

  const handleSaveEdit = async () => {
    if (!editingMemory || !editContent.trim()) return;

    setSaving(true);
    try {
      let imageUrl = editingMemory.imageUrl;

      // Upload new image if one was selected
      if (editSelectedImage) {
        const formData = new FormData();
        formData.append('file', editSelectedImage);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const data = await uploadRes.json();
          imageUrl = data.url;
        }
      } else if (editImagePreview === null) {
        // Image was removed
        imageUrl = null;
      }

      const response = await fetch('/api/memories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingMemory.id,
          content: editContent.trim(),
          imageUrl,
          friendIds: editSelectedFriends,
          sharedWithFriend: editShareWithFriend,
        }),
      });

      if (response.ok) {
        setEditDialogOpen(false);
        setEditingMemory(null);
        onUpdate();
      } else {
        throw new Error('Failed to update memory');
      }
    } catch (error) {
      console.error('Error updating memory:', error);
      alert('Failed to update memory. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Get Amika friends from selected friends for sharing option
  const getSelectedAmikaFriends = () => {
    return editSelectedFriends
      .map(id => allFriends.find(f => f.id === id))
      .filter(f => f?.linkedUserId) as typeof allFriends;
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
                  {(memory.media?.length || memory.imageUrl) && <div className="w-full max-w-md h-64 overflow-hidden rounded-lg">
                    <MemoryMediaCarousel
                      media={memory.media?.length ? memory.media : [{ type: 'image', url: memory.imageUrl! }]}
                      label="Memory"
                      onOpen={() => {
                        const image = (memory.media || []).find((item) => item.type === 'image')?.url || memory.imageUrl;
                        if (image) setViewerImageUrl(image);
                      }}
                    />
                  </div>}
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(memory.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(memory)}
                    className="text-gray-400 hover:text-[#A8C5A8]"
                    title="Edit memory"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
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

      {/* Edit Memory Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-w-[95vw] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Memory</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            <div className="space-y-2">
              <label className="text-sm font-medium">Memory</label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                placeholder="What happened?"
              />
            </div>

            <div className="space-y-2">
              {editImagePreview && (
                <div className="relative inline-block">
                  <img
                    src={editImagePreview}
                    alt="Memory preview"
                    className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleEditRemoveImage}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => editFileInputRef.current?.click()}
                className="border-[#A8C5A8]/60 text-[#A8C5A8]"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                {editImagePreview ? 'Change Image' : 'Add Image'}
              </Button>
              <input
                ref={editFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleEditImageSelect}
                className="hidden"
              />
            </div>

            {/* Multi-friend tagging - only show if we have multiple friends */}
            {allFriends.length > 1 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Tag friends</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {allFriends.map((friend) => (
                    <label
                      key={friend.id}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={editSelectedFriends.includes(friend.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditSelectedFriends([...editSelectedFriends, friend.id]);
                          } else {
                            setEditSelectedFriends(editSelectedFriends.filter(id => id !== friend.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-[#A8C5A8] focus:ring-[#A8C5A8]"
                      />
                      {friend.name}
                      {friend.linkedUserId && (
                        <span className="text-xs px-1.5 py-0.5 bg-[#A8C5A8]/20 text-[#A8C5A8] rounded-full">
                          Amika
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Share with Amika friends option */}
            {getSelectedAmikaFriends().length > 0 && (
              <div className="space-y-2 p-3 bg-[#A8C5A8]/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[#A8C5A8]" />
                  <span className="text-sm font-medium">Share with Amika friends</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-share-memory"
                    checked={editShareWithFriend}
                    onCheckedChange={setEditShareWithFriend}
                  />
                  <Label htmlFor="edit-share-memory" className="text-sm text-gray-600">
                    Share with {getSelectedAmikaFriends().map(f => f.name).join(', ')}
                  </Label>
                </div>
                <p className="text-xs text-gray-500">
                  The memory will appear in their Amika app
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving || !editContent.trim() || editSelectedFriends.length === 0}
              className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Dialog */}
      <Dialog open={!!viewerImageUrl} onOpenChange={(open) => !open && setViewerImageUrl(null)}>
        <DialogContent className="sm:max-w-3xl max-w-[95vw] p-0 bg-black/95 border-none" showCloseButton={false}>
          <div className="relative">
            <button
              onClick={() => setViewerImageUrl(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            {viewerImageUrl && (
              <img
                src={viewerImageUrl}
                alt="Memory"
                className="w-full h-auto max-h-[85vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
