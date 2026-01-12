'use client';

import { useState, useMemo, useCallback } from 'react';
import { FriendCard } from '@/components/friend-card';
import { AddFriendDialog } from '@/components/add-friend-dialog';
import { FriendRequests } from '@/components/friend-requests';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, Users, Share2, Trophy, TrendingUp, Heart, Calendar } from 'lucide-react';
import { useFriends } from '@/hooks/use-data';

interface Friend {
  id: string;
  name: string;
  birthday?: Date | null;
  lastContact?: Date | null;
  notes?: string | null;
  linkedUserId?: string | null;
  friendshipPoints?: number;
  eventsCount?: number;
  memoriesCount?: number;
  notesCount?: number;
}

export default function FriendsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Use SWR for cached data fetching
  const {
    friends,
    isLoading: loading,
    refresh: refreshFriends,
  } = useFriends();

  const handleConnectionUpdate = () => {
    refreshFriends();
  };

  const handleRemoveFriend = useCallback(async (friendId: string) => {
    try {
      const response = await fetch(`/api/friends?id=${friendId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        // Revalidate friends cache
        refreshFriends();
      }
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  }, [refreshFriends]);

  // Memoize filtered friends and their separation
  const { filteredFriends, amikaFriends, regularFriends } = useMemo(() => {
    const filtered = friends.filter((friend) =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return {
      filteredFriends: filtered,
      amikaFriends: filtered.filter((f) => f.linkedUserId),
      regularFriends: filtered.filter((f) => !f.linkedUserId),
    };
  }, [friends, searchQuery]);

  // Memoize metrics calculations
  const metrics = useMemo(() => {
    const totalPoints = friends.reduce((sum, f) => sum + (f.friendshipPoints || 0), 0);
    const activeFriends = friends.filter(f => (f.friendshipPoints || 0) > 0).length;
    const avgPoints = friends.length > 0 ? Math.round(totalPoints / friends.length) : 0;

    return { totalPoints, activeFriends, avgPoints };
  }, [friends]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A8C5A8]" />
      </div>
    );
  }

  return (
    <div className="px-4 max-w-2xl mx-auto md:pt-16 pb-20 md:pb-8">
      <div className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Friends</h1>
            <p className="text-gray-600 mt-1">
              {friends.length} friends
              {amikaFriends.length > 0 && (
                <span className="text-[#A8C5A8] ml-2">
                  ({amikaFriends.length} on Amika)
                </span>
              )}
            </p>
          </div>
          <AddFriendDialog onAdd={handleConnectionUpdate} />
        </div>

        {/* Overall Metrics Section */}
        {friends.length > 0 && (
          <Card className="p-4 mb-6 border-[#A8C5A8]/20 bg-gradient-to-r from-[#A8C5A8]/5 to-yellow-50/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-2xl font-bold text-gray-900">
                    {metrics.totalPoints}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Total Points</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Heart className="w-4 h-4 text-[#D4A5A5]" />
                  <span className="text-2xl font-bold text-gray-900">
                    {friends.length}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Friends</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="w-4 h-4 text-[#A8C5A8]" />
                  <span className="text-2xl font-bold text-gray-900">
                    {metrics.activeFriends}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Active</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Calendar className="w-4 h-4 text-[#D4A5A5]" />
                  <span className="text-2xl font-bold text-gray-900">
                    {metrics.avgPoints}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Avg Points</p>
              </div>
            </div>
          </Card>
        )}

        {/* Friend Requests Section */}
        <FriendRequests onUpdate={handleConnectionUpdate} />

        {friends.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Amika Friends Section */}
        {amikaFriends.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="w-4 h-4 text-[#A8C5A8]" />
              <h2 className="text-sm font-semibold text-gray-700">Amika Friends</h2>
              <span className="text-xs px-2 py-0.5 bg-[#A8C5A8]/20 text-[#A8C5A8] rounded-full">
                Sharing enabled
              </span>
            </div>
            <div className="space-y-3">
              {amikaFriends.map((friend) => (
                <FriendCard key={friend.id} friend={friend} isAmikaFriend onRemove={handleRemoveFriend} />
              ))}
            </div>
          </div>
        )}

        {/* Regular Friends Section */}
        {regularFriends.length > 0 && (
          <div>
            {amikaFriends.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-700">Other Friends</h2>
              </div>
            )}
            <div className="space-y-3">
              {regularFriends.map((friend) => (
                <FriendCard key={friend.id} friend={friend} onRemove={handleRemoveFriend} />
              ))}
            </div>
          </div>
        )}

        {filteredFriends.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchQuery
                ? 'No friends found matching your search.'
                : 'No friends yet. Add your first friend above!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
