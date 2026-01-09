'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Search,
  UserPlus,
  Loader2,
  Link2,
  Copy,
  CheckCircle,
  Users,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type User = {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
};

type Friend = {
  id: string;
  name: string;
  email: string | null;
  profileImage: string | null;
  linkedUserId: string | null;
};

type Collaborator = {
  id: string;
  friendId: string;
  friendName: string;
  linkedUserId: string | null;
};

interface ShareEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventPlanId: string;
  eventPlanTitle: string;
  existingCollaborators: Collaborator[];
  joinToken: string | null;
  onCollaboratorAdded: () => void;
  onJoinTokenGenerated: (token: string) => void;
  onJoinTokenRevoked: () => void;
}

export function ShareEventDialog({
  open,
  onOpenChange,
  eventPlanId,
  eventPlanTitle,
  existingCollaborators,
  joinToken,
  onCollaboratorAdded,
  onJoinTokenGenerated,
  onJoinTokenRevoked,
}: ShareEventDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [addingUser, setAddingUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [generatingLink, setGeneratingLink] = useState(false);
  const [revokingLink, setRevokingLink] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSearchResults([]);
      setError(null);
      setCopied(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      fetchFriends();
    }
  }, [open]);

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      const response = await fetch('/api/friends');
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      }
    } catch (err) {
      console.error('Error fetching friends:', err);
    } finally {
      setLoadingFriends(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchUsers = async () => {
    setSearching(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const users = await response.json();
        setSearchResults(users);
      } else {
        const data = await response.json();
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      setError('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const addCollaborator = async (friendId: string) => {
    setAddingUser(friendId);
    setError(null);
    try {
      const response = await fetch(`/api/event-plans/${eventPlanId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendIds: [friendId] }),
      });

      if (response.ok) {
        onCollaboratorAdded();
        setFriends(friends.filter(f => f.id !== friendId));
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add collaborator');
      }
    } catch (err) {
      setError('Failed to add collaborator');
    } finally {
      setAddingUser(null);
    }
  };

  const generateInviteLink = async () => {
    setGeneratingLink(true);
    setError(null);
    try {
      const response = await fetch(`/api/event-plans/${eventPlanId}/join`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        onJoinTokenGenerated(data.joinToken);
      } else {
        setError(data.error || 'Failed to generate link');
      }
    } catch (err) {
      setError('Failed to generate invite link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const revokeInviteLink = async () => {
    if (!confirm('Are you sure you want to disable the invite link? Anyone with the link will no longer be able to join.')) {
      return;
    }

    setRevokingLink(true);
    setError(null);
    try {
      const response = await fetch(`/api/event-plans/${eventPlanId}/join`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onJoinTokenRevoked();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to disable link');
      }
    } catch (err) {
      setError('Failed to disable link');
    } finally {
      setRevokingLink(false);
    }
  };

  const getInviteUrl = () => {
    if (!joinToken) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/event-plans/join/${joinToken}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getInviteUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy link');
    }
  };

  const availableFriends = friends.filter(
    friend => !existingCollaborators.some(c => c.friendId === friend.id)
  );

  const filteredSearchResults = searchResults.filter(user => {
    const isCollaborator = existingCollaborators.some(c => c.linkedUserId === user.id);
    if (isCollaborator) return false;
    const isFriend = friends.some(f => f.linkedUserId === user.id);
    return isFriend;
  });

  const getFriendForUser = (userId: string) => {
    return friends.find(f => f.linkedUserId === userId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#A8C5A8]" />
            Share Event Plan
          </DialogTitle>
          <DialogDescription>
            Invite friends to collaborate on &quot;{eventPlanTitle}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Search for Amika users */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Search Amika Users</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="max-h-[150px] overflow-y-auto space-y-2">
              {searching ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredSearchResults.length > 0 ? (
                filteredSearchResults.map((user) => {
                  const friend = getFriendForUser(user.id);
                  if (!friend) return null;
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          {user.profileImage && (
                            <AvatarImage src={user.profileImage} alt={user.name} />
                          )}
                          <AvatarFallback className="bg-[#A8C5A8]/20 text-[#A8C5A8] text-xs">
                            {user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addCollaborator(friend.id)}
                        disabled={addingUser === friend.id}
                        className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
                      >
                        {addingUser === friend.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })
              ) : searchQuery.length >= 2 ? (
                <p className="text-center py-2 text-sm text-muted-foreground">
                  No friends found matching &quot;{searchQuery}&quot;
                </p>
              ) : null}
            </div>
          </div>

          {/* Quick add from friends list */}
          {availableFriends.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Add from Friends</label>
              <div className="max-h-[150px] overflow-y-auto space-y-2">
                {loadingFriends ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  availableFriends.slice(0, 5).map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          {friend.profileImage && (
                            <AvatarImage src={friend.profileImage} alt={friend.name} />
                          )}
                          <AvatarFallback className="bg-[#D4A5A5]/20 text-[#D4A5A5] text-xs">
                            {friend.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{friend.name}</p>
                          {friend.linkedUserId && (
                            <p className="text-xs text-green-600">Amika user</p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addCollaborator(friend.id)}
                        disabled={addingUser === friend.id}
                        className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
                      >
                        {addingUser === friend.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Invite Link Section */}
          <div className="space-y-3 pt-4 border-t">
            <label className="text-sm font-medium">Or share an invite link</label>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can sign in and join the event planning
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={joinToken ? getInviteUrl() : 'Click Generate to create a link'}
                  className="flex-1 bg-gray-50 text-sm"
                />
                {joinToken ? (
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    className="shrink-0"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                ) : (
                  <Button
                    onClick={generateInviteLink}
                    className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 shrink-0"
                    disabled={generatingLink}
                  >
                    {generatingLink ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Link2 className="w-4 h-4 mr-1" />
                    )}
                    Generate
                  </Button>
                )}
              </div>

              {joinToken && (
                <div className="flex justify-end">
                  <Button
                    onClick={revokeInviteLink}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={revokingLink}
                  >
                    {revokingLink ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : null}
                    Disable Link
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Existing Collaborators */}
          {existingCollaborators.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <label className="text-sm font-medium">Current Collaborators</label>
              <div className="space-y-2">
                {existingCollaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg"
                  >
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="bg-[#D4A5A5]/20 text-[#D4A5A5] text-xs">
                        {collab.friendName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{collab.friendName}</span>
                    {collab.linkedUserId && (
                      <span className="text-xs text-green-600">Amika user</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
