'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, ArrowLeft, User, Share2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface Memory {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  friendId: string;
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
  const [memories, setMemories] = useState<Memory[]>([]);
  const [sharedMemories, setSharedMemories] = useState<SharedMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<Map<string, { id: string; name: string; profileImage?: string | null }>>(new Map());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all data in parallel
      const [memoriesRes, friendsRes, sharedRes] = await Promise.all([
        fetch('/api/memories'),
        fetch('/api/friends'),
        fetch('/api/shared-items?type=received&status=accepted&itemType=memory'),
      ]);

      if (!memoriesRes.ok || !friendsRes.ok) {
        if (memoriesRes.status === 401 || friendsRes.status === 401) {
          router.push('/signin');
          return;
        }
        throw new Error('Failed to fetch data');
      }

      const [memoriesData, friendsData, sharedData] = await Promise.all([
        memoriesRes.json(),
        friendsRes.json(),
        sharedRes.ok ? sharedRes.json() : [],
      ]);

      // Create a map of friends for quick lookup
      const friendsMap = new Map<string, { id: string; name: string; profileImage?: string | null }>();
      friendsData.forEach((friend: { id: string; name: string; profileImage?: string | null }) => {
        friendsMap.set(friend.id, { id: friend.id, name: friend.name, profileImage: friend.profileImage });
      });
      setFriends(friendsMap);

      // Attach friend info to memories
      const memoriesWithFriends = memoriesData.map((memory: Memory) => ({
        ...memory,
        friend: friendsMap.get(memory.friendId) || null,
      }));

      setMemories(memoriesWithFriends);
      setSharedMemories(sharedData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-[#FFFBF5] md:pt-16 pb-20 md:pb-8">
      <div className="px-4 max-w-2xl mx-auto">
        <div className="py-8">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-7 h-7 text-[#D4A5A5]" />
            <h1 className="text-3xl font-bold text-gray-900">Memories</h1>
          </div>
          <p className="text-gray-600">All your cherished moments with friends</p>
        </div>

        {combinedMemories.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-[#A8C5A8]/30">
            <div className="max-w-sm mx-auto">
              <Heart className="w-12 h-12 text-[#D4A5A5] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No memories yet
              </h3>
              <p className="text-gray-600 mb-4">
                Start capturing special moments with your friends!
              </p>
              <Link
                href="/friends"
                className="inline-block px-4 py-2 bg-[#A8C5A8] text-white rounded-lg hover:bg-[#A8C5A8]/90 transition-colors"
              >
                Go to Friends
              </Link>
            </div>
          </Card>
        ) : (
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
                      <div className="relative w-full max-w-md h-48 rounded-lg overflow-hidden mb-2">
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
        )}
      </div>
    </div>
  );
}
