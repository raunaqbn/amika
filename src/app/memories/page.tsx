'use client';

import { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Share2, Plus, Image as ImageIcon, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { formatDistanceToNow, format } from 'date-fns';
import { useMemoriesPageData } from '@/hooks/use-data';

interface Friend {
  id: string;
  name: string;
  profileImage?: string | null;
  linkedUserId?: string | null;
}

interface Memory {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  friendId: string;
  friendIds?: string[];
  friend?: {
    id: string;
    name: string;
    profileImage?: string | null;
  } | null;
  sharedWithFriend?: boolean;
}

interface SharedMemory {
  id: string;
  itemId: string;
  sharedByUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  sharedBy: {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
  };
  item?: {
    id: string;
    content?: string;
    imageUrl?: string | null;
    createdAt?: string;
  };
}

export default function MemoriesPage() {
  const router = useRouter();

  // Use SWR hooks for cached data fetching
  const {
    friends: friendsData,
    memories: memoriesData,
    sharedMemories: sharedMemoriesData,
    isLoading: loading,
    error,
    refreshAll,
  } = useMemoriesPageData();

  // Create a map of friends for quick lookup
  const { friendsMap, friendsList } = useMemo(() => {
    const map = new Map<string, Friend>();
    const list: Friend[] = [];
    friendsData.forEach((friend: Friend) => {
      map.set(friend.id, {
        id: friend.id,
        name: friend.name,
        profileImage: friend.profileImage,
        linkedUserId: friend.linkedUserId,
      });
      list.push({
        id: friend.id,
        name: friend.name,
        profileImage: friend.profileImage,
        linkedUserId: friend.linkedUserId,
      });
    });
    return { friendsMap: map, friendsList: list };
  }, [friendsData]);

  // Attach friend info to memories
  const memories = useMemo(() => {
    return memoriesData.map((memory: Memory) => ({
      ...memory,
      friend: friendsMap.get(memory.friendId) || null,
    }));
  }, [memoriesData, friendsMap]);

  const sharedMemories = sharedMemoriesData;

  // Add Memory form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [shareWithFriends, setShareWithFriends] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image viewer state
  const [viewerImageUrl, setViewerImageUrl] = useState<string | null>(null);

  // Handle auth errors
  if (error?.status === 401) {
    router.push('/signin');
  }

  // Image compression helper
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const img = new window.Image();
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

  const resetForm = () => {
    setNewContent('');
    setSelectedFriendIds([]);
    setSelectedImage(null);
    setImagePreview(null);
    setShareWithFriends(false);
  };

  const handleAddMemory = async () => {
    if (!newContent.trim() || selectedFriendIds.length === 0) return;

    setSaving(true);
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
          friendId: selectedFriendIds[0],
          friendIds: selectedFriendIds,
          content: newContent.trim(),
          imageUrl,
          sharedWithFriend: shareWithFriends,
        }),
      });

      if (response.ok) {
        resetForm();
        setShowAddForm(false);
        refreshAll();
      } else {
        throw new Error('Failed to create memory');
      }
    } catch (error) {
      console.error('Error adding memory:', error);
      alert('Failed to add memory. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Get Amika friends from selected friends
  const getSelectedAmikaFriends = () => {
    return selectedFriendIds
      .map(id => friendsList.find(f => f.id === id))
      .filter(f => f?.linkedUserId) as Friend[];
  };

  // Combine own memories and shared memories into a single timeline
  const combinedMemories = [
    ...memories.map((m) => ({
      id: m.id,
      type: 'own' as const,
      content: m.content,
      imageUrl: m.imageUrl,
      createdAt: new Date(m.createdAt),
      friendId: m.friendId,
      friendName: m.friend?.name || 'Unknown',
      friendImage: m.friend?.profileImage || null,
      sharedWithFriend: m.sharedWithFriend,
    })),
    ...sharedMemories.map((s) => ({
      id: s.id,
      type: 'shared' as const,
      content: s.item?.content || '',
      imageUrl: s.item?.imageUrl || null,
      createdAt: new Date(s.item?.createdAt || s.createdAt),
      sharedById: s.sharedByUserId,
      sharedByName: s.sharedBy.name,
      sharedByImage: s.sharedBy.profileImage,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A8C5A8]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] pt-14 md:pt-16 pb-20 md:pb-8">
      <div className="px-4 max-w-2xl mx-auto">
        <div className="py-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Heart className="w-7 h-7 text-[#D4A5A5]" />
              <h1 className="text-3xl font-bold text-gray-900">Memories</h1>
            </div>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Memory
            </Button>
          </div>
          <p className="text-gray-600">All your cherished moments with friends</p>
        </div>

        {/* Add Memory Form */}
        {showAddForm && (
          <Card className="p-4 mb-6 border-[#A8C5A8]/30 bg-white">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">New Memory</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Memory</label>
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={4}
                  placeholder="What happened?"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tag friends</label>
                {friendsList.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    <Link href="/friends" className="text-[#A8C5A8] hover:underline">
                      Add friends first
                    </Link>{' '}
                    to tag them in memories.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {friendsList.map((friend) => (
                      <label
                        key={friend.id}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFriendIds.includes(friend.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFriendIds([...selectedFriendIds, friend.id]);
                            } else {
                              setSelectedFriendIds(selectedFriendIds.filter(id => id !== friend.id));
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
                )}
              </div>

              <div className="space-y-2">
                {imagePreview && (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Memory preview"
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

              {/* Share with Amika friends option */}
              {getSelectedAmikaFriends().length > 0 && (
                <div className="space-y-2 p-3 bg-[#A8C5A8]/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-[#A8C5A8]" />
                    <span className="text-sm font-medium">Share with Amika friends</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="share-memory"
                      checked={shareWithFriends}
                      onCheckedChange={setShareWithFriends}
                    />
                    <Label htmlFor="share-memory" className="text-sm text-gray-600">
                      Share with {getSelectedAmikaFriends().map(f => f.name).join(', ')}
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500">
                    The memory will appear in their Amika app
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddMemory}
                  disabled={saving || !newContent.trim() || selectedFriendIds.length === 0}
                  className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
                >
                  {saving ? 'Saving...' : 'Add Memory'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {combinedMemories.length === 0 && !showAddForm ? (
          <Card className="p-12 text-center border-dashed border-[#A8C5A8]/30">
            <div className="max-w-sm mx-auto">
              <Heart className="w-12 h-12 text-[#D4A5A5] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No memories yet
              </h3>
              <p className="text-gray-600 mb-4">
                Start capturing special moments with your friends!
              </p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Memory
              </Button>
            </div>
          </Card>
        ) : combinedMemories.length > 0 ? (
          <div className="space-y-4">
            {combinedMemories.map((memory) => (
              <Card
                key={memory.id}
                className="p-4 border-[#A8C5A8]/20 bg-white/80 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <Link
                    href={
                      memory.type === 'own'
                        ? `/friends/${memory.friendId}`
                        : '#'
                    }
                    className={memory.type === 'own' ? 'hover:opacity-80' : ''}
                  >
                    <Avatar className="w-10 h-10">
                      {memory.type === 'own' && memory.friendImage ? (
                        <AvatarImage src={memory.friendImage} alt={memory.friendName} />
                      ) : memory.type === 'shared' && memory.sharedByImage ? (
                        <AvatarImage src={memory.sharedByImage} alt={memory.sharedByName} />
                      ) : null}
                      <AvatarFallback className="bg-[#A8C5A8]/20 text-[#A8C5A8]">
                        {memory.type === 'own'
                          ? memory.friendName?.slice(0, 2).toUpperCase()
                          : memory.sharedByName?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {memory.type === 'own' ? (
                        <Link
                          href={`/friends/${memory.friendId}`}
                          className="font-medium text-gray-900 hover:text-[#A8C5A8]"
                        >
                          {memory.friendName}
                        </Link>
                      ) : (
                        <span className="font-medium text-gray-900 flex items-center gap-1">
                          <Share2 className="w-3 h-3 text-[#A8C5A8]" />
                          Shared by {memory.sharedByName}
                        </span>
                      )}
                      {memory.type === 'own' && memory.sharedWithFriend && (
                        <span className="text-xs px-2 py-0.5 bg-[#A8C5A8]/20 text-[#A8C5A8] rounded-full">
                          Shared
                        </span>
                      )}
                    </div>

                    <p className="text-gray-700 whitespace-pre-wrap mb-2">
                      {memory.content}
                    </p>

                    {memory.imageUrl && (
                      <div
                        className="relative w-full max-w-md h-48 rounded-lg overflow-hidden mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setViewerImageUrl(memory.imageUrl)}
                      >
                        <Image
                          src={memory.imageUrl}
                          alt="Memory"
                          fill
                          className="object-cover"
                          sizes="(max-width: 448px) 100vw, 448px"
                        />
                      </div>
                    )}

                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(memory.createdAt, { addSuffix: true })}
                      {' '}&middot;{' '}
                      {format(memory.createdAt, 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : null}
      </div>

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
