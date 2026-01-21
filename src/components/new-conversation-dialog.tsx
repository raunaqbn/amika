'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Users, User, Check, X } from 'lucide-react';
import { Conversation, Friend } from '@/hooks/use-data';

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friends: Friend[];
  onConversationCreated: (conversation: Conversation) => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function NewConversationDialog({
  open,
  onOpenChange,
  friends,
  onConversationCreated,
}: NewConversationDialogProps) {
  const [activeTab, setActiveTab] = useState<'direct' | 'group'>('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter friends by search query
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    return friends.filter(f =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [friends, searchQuery]);

  const handleSelectFriend = useCallback((friendId: string, linkedUserId: string) => {
    if (activeTab === 'direct') {
      setSelectedFriends([linkedUserId]);
    } else {
      setSelectedFriends(prev => {
        if (prev.includes(linkedUserId)) {
          return prev.filter(id => id !== linkedUserId);
        }
        return [...prev, linkedUserId];
      });
    }
  }, [activeTab]);

  const handleCreateConversation = useCallback(async () => {
    if (selectedFriends.length === 0) {
      setError('Please select at least one friend');
      return;
    }

    if (activeTab === 'group' && !groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantIds: selectedFriends,
          name: activeTab === 'group' ? groupName.trim() : undefined,
          isGroup: activeTab === 'group',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create conversation');
      }

      const conversation = await response.json();
      resetForm();
      onConversationCreated(conversation);
    } catch (err: any) {
      setError(err.message || 'Failed to create conversation');
    } finally {
      setCreating(false);
    }
  }, [selectedFriends, activeTab, groupName, onConversationCreated]);

  const resetForm = useCallback(() => {
    setSearchQuery('');
    setSelectedFriends([]);
    setGroupName('');
    setError(null);
  }, []);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as 'direct' | 'group');
    setSelectedFriends([]);
    setError(null);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  }, [onOpenChange, resetForm]);

  // Get selected friends' details for display
  const selectedFriendsDetails = useMemo(() => {
    return friends.filter(f => f.linkedUserId && selectedFriends.includes(f.linkedUserId));
  }, [friends, selectedFriends]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="direct" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Direct
            </TabsTrigger>
            <TabsTrigger value="group" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Group
            </TabsTrigger>
          </TabsList>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[#A8C5A8]/30 focus:border-[#A8C5A8] focus:ring-[#A8C5A8]"
            />
          </div>

          {activeTab === 'group' && (
            <div className="mb-4">
              <Label htmlFor="groupName" className="text-sm font-medium text-gray-700">
                Group Name
              </Label>
              <Input
                id="groupName"
                type="text"
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="mt-1 border-[#A8C5A8]/30 focus:border-[#A8C5A8] focus:ring-[#A8C5A8]"
              />
            </div>
          )}

          {/* Selected friends chips for group chat */}
          {activeTab === 'group' && selectedFriendsDetails.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedFriendsDetails.map(friend => (
                <div
                  key={friend.id}
                  className="flex items-center gap-1 bg-[#A8C5A8]/20 text-[#A8C5A8] px-2 py-1 rounded-full text-sm"
                >
                  <span>{friend.name}</span>
                  <button
                    onClick={() => friend.linkedUserId && handleSelectFriend(friend.id, friend.linkedUserId)}
                    className="hover:text-[#97B897]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <TabsContent value="direct" className="mt-0">
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredFriends.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  {searchQuery ? 'No friends match your search' : 'No friends on Amika yet'}
                </p>
              ) : (
                filteredFriends.map(friend => {
                  const isSelected = friend.linkedUserId && selectedFriends.includes(friend.linkedUserId);
                  return (
                    <button
                      key={friend.id}
                      onClick={() => friend.linkedUserId && handleSelectFriend(friend.id, friend.linkedUserId)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-[#A8C5A8]/20 border-[#A8C5A8]'
                          : 'hover:bg-gray-50 border-transparent'
                      } border`}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={friend.profileImage || undefined} alt={friend.name} />
                        <AvatarFallback className="bg-[#A8C5A8]/20 text-[#A8C5A8]">
                          {getInitials(friend.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 text-left font-medium text-gray-900">
                        {friend.name}
                      </span>
                      {isSelected && (
                        <Check className="w-5 h-5 text-[#A8C5A8]" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="group" className="mt-0">
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredFriends.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  {searchQuery ? 'No friends match your search' : 'No friends on Amika yet'}
                </p>
              ) : (
                filteredFriends.map(friend => {
                  const isSelected = friend.linkedUserId && selectedFriends.includes(friend.linkedUserId);
                  return (
                    <button
                      key={friend.id}
                      onClick={() => friend.linkedUserId && handleSelectFriend(friend.id, friend.linkedUserId)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-[#A8C5A8]/20 border-[#A8C5A8]'
                          : 'hover:bg-gray-50 border-transparent'
                      } border`}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={friend.profileImage || undefined} alt={friend.name} />
                        <AvatarFallback className="bg-[#A8C5A8]/20 text-[#A8C5A8]">
                          {getInitials(friend.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 text-left font-medium text-gray-900">
                        {friend.name}
                      </span>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-[#A8C5A8] bg-[#A8C5A8]'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <p className="text-sm text-red-500 mt-2">{error}</p>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="border-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateConversation}
            disabled={selectedFriends.length === 0 || creating}
            className="bg-[#A8C5A8] hover:bg-[#97B897] text-white"
          >
            {creating ? 'Creating...' : activeTab === 'direct' ? 'Start Chat' : 'Create Group'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
