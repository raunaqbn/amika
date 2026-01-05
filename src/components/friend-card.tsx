'use client';

import { Card } from '@/components/ui/card';
import { FriendAvatar } from '@/components/friend-avatar';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Friend {
  id: string;
  name: string;
  birthday?: Date | null;
  lastContact?: Date | null;
  notes?: string | null;
  profileImage?: string | null;
}

export function FriendCard({ friend }: { friend: Friend }) {
  return (
    <Link href={`/friends/${friend.id}`}>
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-[#A8C5A8]/20">
        <div className="flex items-start gap-3">
          <FriendAvatar
            name={friend.name}
            profileImage={friend.profileImage}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{friend.name}</h3>
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
        </div>
      </Card>
    </Link>
  );
}
