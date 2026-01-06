'use client';

import { useEffect, useState } from 'react';
import { FriendCard } from '@/components/friend-card';
import { AddFriendDialog } from '@/components/add-friend-dialog';
import { FriendRequests } from '@/components/friend-requests';
import { Input } from '@/components/ui/input';
import { Search, Users, Share2 } from 'lucide-react';

interface Friend {
  id: string;
  name: string;
  birthday?: Date | null;
  lastContact?: Date | null;
  notes?: string | null;
  linkedUserId?: string | null;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchFriends();
  }, [refreshKey]);

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/friends');
      const data = await response.json();
      setFriends(data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionUpdate = () => {
    setRefreshKey((k) => k + 1);
  };

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate Amika friends (linked users) and regular friends
  const amikaFriends = filteredFriends.filter((f) => f.linkedUserId);
  const regularFriends = filteredFriends.filter((f) => !f.linkedUserId);

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

        {/* Friend Requests Section */}
        <FriendRequests key={refreshKey} onUpdate={handleConnectionUpdate} />

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
                <FriendCard key={friend.id} friend={friend} isAmikaFriend />
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
                <FriendCard key={friend.id} friend={friend} />
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
