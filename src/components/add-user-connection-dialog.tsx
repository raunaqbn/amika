'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { UserPlus, Search, Check, X, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type User = {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
};

type ConnectionStatus = {
  [userId: string]: 'none' | 'pending' | 'sent' | 'accepted';
};

export function AddUserConnectionDialog({ onConnectionSent }: { onConnectionSent?: () => void }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({});
  const [error, setError] = useState<string | null>(null);

  // Fetch existing connections to show status
  useEffect(() => {
    if (open) {
      fetchExistingConnections();
    }
  }, [open]);

  const fetchExistingConnections = async () => {
    try {
      const response = await fetch('/api/connections');
      if (response.ok) {
        const connections = await response.json();
        const status: ConnectionStatus = {};
        connections.forEach((conn: any) => {
          const otherUserId = conn.user.id;
          if (conn.status === 'accepted') {
            status[otherUserId] = 'accepted';
          } else if (conn.status === 'pending') {
            // Check if we sent it or received it
            status[otherUserId] = conn.requesterId === otherUserId ? 'pending' : 'sent';
          }
        });
        setConnectionStatus(status);
      }
    } catch (err) {
      console.error('Error fetching connections:', err);
    }
  };

  // Debounced search
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

  const sendFriendRequest = async (userId: string) => {
    setSendingRequest(userId);
    setError(null);
    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresseeId: userId }),
      });

      if (response.ok) {
        setConnectionStatus({ ...connectionStatus, [userId]: 'sent' });
        onConnectionSent?.();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send request');
      }
    } catch (err) {
      setError('Failed to send friend request');
    } finally {
      setSendingRequest(null);
    }
  };

  const getStatusButton = (user: User) => {
    const status = connectionStatus[user.id] || 'none';

    switch (status) {
      case 'accepted':
        return (
          <Button size="sm" variant="outline" disabled className="text-green-600">
            <Check className="w-4 h-4 mr-1" />
            Friends
          </Button>
        );
      case 'sent':
        return (
          <Button size="sm" variant="outline" disabled className="text-yellow-600">
            Pending
          </Button>
        );
      case 'pending':
        return (
          <Button size="sm" variant="outline" disabled className="text-blue-600">
            Respond
          </Button>
        );
      default:
        return (
          <Button
            size="sm"
            onClick={() => sendFriendRequest(user.id)}
            disabled={sendingRequest === user.id}
            className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
          >
            {sendingRequest === user.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-1" />
                Add
              </>
            )}
          </Button>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-[#A8C5A8] text-[#A8C5A8] hover:bg-[#A8C5A8]/10">
          <UserPlus className="w-4 h-4 mr-2" />
          Find Amika Friends
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Find Amika Friends</DialogTitle>
          <DialogDescription>
            Search for friends who are already on Amika. Connect to share memories, notes, and events.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {searching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      {user.profileImage ? (
                        <AvatarImage src={user.profileImage} alt={user.name} />
                      ) : null}
                      <AvatarFallback className="bg-[#A8C5A8]/20 text-[#A8C5A8]">
                        {user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  {getStatusButton(user)}
                </div>
              ))
            ) : searchQuery.length >= 2 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Enter at least 2 characters to search
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
