'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Plane, Users, Check, Loader2 } from 'lucide-react';

interface Friend {
  id: string;
  name: string;
  profileImage?: string | null;
  customProfileImage?: string | null;
  linkedUserId?: string | null;
}

interface PlanTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friends: Friend[];
  onTripCreated?: () => void;
}

export function PlanTripDialog({
  open,
  onOpenChange,
  friends,
  onTripCreated,
}: PlanTripDialogProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setTitle('');
      setDescription('');
      setSelectedFriendIds([]);
      setError(null);
    }
  }, [open]);

  const toggleFriend = (friendId: string) => {
    setSelectedFriendIds(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a trip title');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          collaboratorFriendIds: selectedFriendIds.length > 0 ? selectedFriendIds : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create trip');
      }

      const trip = await response.json();
      onTripCreated?.();
      onOpenChange(false);

      // Navigate to the trip planning page
      router.push(`/trips/${trip.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getProfileImage = (friend: Friend) => {
    return friend.customProfileImage || friend.profileImage || null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-[#A8C5A8]" />
            Plan a Trip
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Trip Title *</label>
            <Input
              placeholder="e.g., Summer Trip to Japan"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea
              placeholder="Brief description of the trip..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Add Friends to Planning
            </label>
            <p className="text-xs text-muted-foreground">
              Select friends to collaborate on this trip
            </p>

            {friends.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No friends to add. You can add collaborators later.
              </div>
            ) : (
              <div className="max-h-[200px] overflow-y-auto border rounded-lg">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    onClick={() => !saving && toggleFriend(friend.id)}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-accent transition-colors ${
                      selectedFriendIds.includes(friend.id) ? 'bg-[#A8C5A8]/10' : ''
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getProfileImage(friend) || undefined} />
                      <AvatarFallback className="bg-[#D4A5A5] text-white text-xs">
                        {friend.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{friend.name}</p>
                      {friend.linkedUserId && (
                        <p className="text-xs text-muted-foreground">Amika user</p>
                      )}
                    </div>
                    {selectedFriendIds.includes(friend.id) && (
                      <div className="w-5 h-5 rounded-full bg-[#A8C5A8] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedFriendIds.length > 0 && (
              <p className="text-xs text-[#A8C5A8]">
                {selectedFriendIds.length} friend{selectedFriendIds.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !title.trim()}
              className="bg-[#A8C5A8] hover:bg-[#97b497] text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plane className="w-4 h-4 mr-2" />
                  Start Planning
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
