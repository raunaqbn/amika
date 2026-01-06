'use client';

import { useEffect, useState } from 'react';
import { FriendCard } from '@/components/friend-card';
import { AddFriendDialog } from '@/components/add-friend-dialog';
import { AddUserConnectionDialog } from '@/components/add-user-connection-dialog';
import { ConnectedFriendsList } from '@/components/friend-requests';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Users, UserPlus } from 'lucide-react';

interface Friend {
  id: string;
  name: string;
  birthday?: Date | null;
  lastContact?: Date | null;
  notes?: string | null;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('my-friends');

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

  const handleConnectionUpdate = () => {
    setRefreshKey((k) => k + 1);
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
    <div className="px-4 max-w-2xl mx-auto md:pt-16 pb-20 md:pb-8">
      <div className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Friends</h1>
            <p className="text-gray-600 mt-1">{friends.length} friends</p>
          </div>
          <div className="flex gap-2">
            <AddUserConnectionDialog onConnectionSent={handleConnectionUpdate} />
            <AddFriendDialog onAdd={fetchFriends} />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="my-friends" className="flex-1">
              <Users className="w-4 h-4 mr-2" />
              My Friends
            </TabsTrigger>
            <TabsTrigger value="amika-friends" className="flex-1">
              <UserPlus className="w-4 h-4 mr-2" />
              Amika Friends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-friends">
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
          </TabsContent>

          <TabsContent value="amika-friends">
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Connect with friends who are also on Amika to share memories, notes, and events.
              </p>
              <ConnectedFriendsList key={refreshKey} onUpdate={handleConnectionUpdate} />
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Click &ldquo;Find Amika Friends&rdquo; to search for friends</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
