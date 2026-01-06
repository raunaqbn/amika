'use client';

import { Card } from '@/components/ui/card';
import { FriendAvatar } from '@/components/friend-avatar';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Share2, Trophy } from 'lucide-react';

interface Friend {
  id: string;
  name: string;
  birthday?: Date | null;
  lastContact?: Date | null;
  notes?: string | null;
  profileImage?: string | null;
  linkedUserId?: string | null;
  friendshipPoints?: number;
}

interface FriendCardProps {
  friend: Friend;
  isAmikaFriend?: boolean;
}

export function FriendCard({ friend, isAmikaFriend }: FriendCardProps) {
  return (
    <Link href={`/friends/${friend.id}`}>
      <Card className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${isAmikaFriend ? 'border-[#A8C5A8]/40 bg-[#A8C5A8]/5' : 'border-[#A8C5A8]/20'}`}>
        <div className="flex items-start gap-3">
          <FriendAvatar
            name={friend.name}
            profileImage={friend.profileImage}
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
          </div>
          {friend.friendshipPoints !== undefined && friend.friendshipPoints > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">
              <Trophy className="w-3 h-3" />
              {friend.friendshipPoints}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
