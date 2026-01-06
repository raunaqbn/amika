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
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Share2, Loader2, Check, Users } from 'lucide-react';

type ConnectedFriend = {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
};

type ShareItemDialogProps = {
  itemType: 'memory' | 'note' | 'event';
  itemId: string;
  itemTitle?: string;
  trigger?: React.ReactNode;
  onShared?: () => void;
};

export function ShareItemDialog({ itemType, itemId, itemTitle, trigger, onShared }: ShareItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState<ConnectedFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState<string | null>(null);
  const [sharedWith, setSharedWith] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchFriends();
    }
  }, [open]);

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/connections?accepted=true');
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      }
    } catch (err) {
      console.error('Error fetching friends:', err);
    } finally {
      setLoading(false);
    }
  };

  const shareWithFriend = async (friendId: string) => {
    setSharing(friendId);
    setError(null);
    try {
      const response = await fetch('/api/shared-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sharedWithUserId: friendId,
          itemType,
          itemId,
          message: message || undefined,
        }),
      });

      if (response.ok) {
        setSharedWith(new Set([...sharedWith, friendId]));
        onShared?.();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to share');
      }
    } catch (err) {
      setError('Failed to share item');
    } finally {
      setSharing(null);
    }
  };

  const getItemTypeLabel = () => {
    switch (itemType) {
      case 'memory':
        return 'memory';
      case 'note':
        return 'diary note';
      case 'event':
        return 'event';
      default:
        return 'item';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-[#A8C5A8]">
            <Share2 className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Share {getItemTypeLabel()}</DialogTitle>
          <DialogDescription>
            {itemTitle ? (
              <>Share &ldquo;{itemTitle}&rdquo; with your Amika friends.</>
            ) : (
              <>Share this {getItemTypeLabel()} with your Amika friends.</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Add a message (optional)</label>
            <Textarea
              placeholder="Hey, check this out!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="mt-1"
            />
          </div>

          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">Share with</label>
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : friends.length > 0 ? (
                friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        {friend.profileImage ? (
                          <AvatarImage src={friend.profileImage} alt={friend.name} />
                        ) : null}
                        <AvatarFallback className="bg-[#A8C5A8]/20 text-[#A8C5A8]">
                          {friend.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{friend.name}</p>
                        <p className="text-sm text-muted-foreground">{friend.email}</p>
                      </div>
                    </div>
                    {sharedWith.has(friend.id) ? (
                      <Button size="sm" variant="outline" disabled className="text-green-600">
                        <Check className="w-4 h-4 mr-1" />
                        Shared
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => shareWithFriend(friend.id)}
                        disabled={sharing === friend.id}
                        className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
                      >
                        {sharing === friend.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Share2 className="w-4 h-4 mr-1" />
                            Share
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No Amika friends yet</p>
                  <p className="text-sm">Connect with friends to share items</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
