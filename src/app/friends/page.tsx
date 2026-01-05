'use client';

import { useEffect, useState } from 'react';
import { FriendCard } from '@/components/friend-card';
import { AddFriendDialog } from '@/components/add-friend-dialog';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface Friend {
  id: string;
  name: string;
  birthday?: Date | null;
  lastContact?: Date | null;
  notes?: string | null;
  avatarUrl?: string | null;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFriends();
  }, []);

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

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A8C5A8]" />
      </div>
    );
  }

  return (
    <div className="pb-20 px-4 max-w-2xl mx-auto">
      <div className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Friends</h1>
            <p className="text-gray-600 mt-1">{friends.length} friends</p>
          </div>
          <AddFriendDialog onAdd={fetchFriends} />
        </div>

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
      </div>

      <div className="space-y-3">
        {filteredFriends.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchQuery
                ? 'No friends found matching your search.'
                : 'No friends yet. Add your first friend above!'}
            </p>
          </div>
        ) : (
          filteredFriends.map((friend) => (
            <FriendCard key={friend.id} friend={friend} />
          ))
        )}
      </div>
    </div>
  );
}
