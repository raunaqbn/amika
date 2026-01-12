'use client';

import { useState, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FriendAvatar } from '@/components/friend-avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Share2, Trophy, Trash2, Calendar, Camera, BookOpen } from 'lucide-react';

interface Friend {
  id: string;
  name: string;
  birthday?: Date | null;
  lastContact?: Date | null;
  notes?: string | null;
  profileImage?: string | null;
  customProfileImage?: string | null;
  linkedUserId?: string | null;
  friendshipPoints?: number;
  eventsCount?: number;
  memoriesCount?: number;
  notesCount?: number;
}

interface FriendCardProps {
  friend: Friend;
  isAmikaFriend?: boolean;
  onRemove?: (friendId: string) => void;
}

// Memoized FriendCard to prevent unnecessary re-renders in lists
export const FriendCard = memo(function FriendCard({ friend, isAmikaFriend, onRemove }: FriendCardProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirmDialog(true);
  };

  const handleConfirmRemove = async () => {
    if (!onRemove) return;
    setIsRemoving(true);
    try {
      await onRemove(friend.id);
    } finally {
      setIsRemoving(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <>
      <Link href={`/friends/${friend.id}`}>
        <Card className={`p-4 hover:shadow-md transition-shadow cursor-pointer group ${isAmikaFriend ? 'border-[#A8C5A8]/40 bg-[#A8C5A8]/5' : 'border-[#A8C5A8]/20'}`}>
          <div className="flex items-start gap-3">
            <FriendAvatar
              name={friend.name}
              profileImage={friend.profileImage}
              customProfileImage={friend.customProfileImage}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 truncate">{friend.name}</h3>
                {isAmikaFriend && (
                  <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 bg-[#A8C5A8]/20 text-[#A8C5A8] rounded-full">
                    <Share2 className="w-3 h-3" />
                  </span>
                )}
              </div>
              {friend.lastContact && (
                <p className="text-sm text-gray-500">
                  Last contact: {formatDistanceToNow(new Date(friend.lastContact), { addSuffix: true })}
                </p>
              )}
              {friend.notes && (
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                  {friend.notes}
                </p>
              )}
              {/* Stats row */}
              {((friend.eventsCount ?? 0) > 0 || (friend.memoriesCount ?? 0) > 0 || (friend.notesCount ?? 0) > 0) && (
                <div className="flex items-center gap-3 mt-2">
                  {(friend.eventsCount ?? 0) > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500" title="Planned events">
                      <Calendar className="w-3 h-3" />
                      <span>{friend.eventsCount}</span>
                    </div>
                  )}
                  {(friend.memoriesCount ?? 0) > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500" title="Memories">
                      <Camera className="w-3 h-3" />
                      <span>{friend.memoriesCount}</span>
                    </div>
                  )}
                  {(friend.notesCount ?? 0) > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500" title="Diary notes">
                      <BookOpen className="w-3 h-3" />
                      <span>{friend.notesCount}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {friend.friendshipPoints !== undefined && friend.friendshipPoints > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">
                  <Trophy className="w-3 h-3" />
                  {friend.friendshipPoints}
                </div>
              )}
              {onRemove && (
                <button
                  onClick={handleRemoveClick}
                  className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove friend"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </Card>
      </Link>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Friend</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <span className="font-medium text-gray-900">{friend.name}</span> from your friends list? This will also delete all memories and events associated with this friend.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRemove}
              disabled={isRemoving}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isRemoving ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
