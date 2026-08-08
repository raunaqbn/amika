'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Camera, MessageCircle, Search, UserRoundPlus, Users } from 'lucide-react';
import { AddFriendDialog } from '@/components/add-friend-dialog';
import { FriendRequests } from '@/components/friend-requests';
import { FriendAvatar } from '@/components/friend-avatar';
import { useFriends } from '@/hooks/use-data';

type Friend = {
  id: string;
  name: string;
  notes?: string | null;
  profileImage?: string | null;
  customProfileImage?: string | null;
  linkedUserId?: string | null;
  memoriesCount?: number;
  lastEngagedAt?: Date | string | null;
};

export default function FriendsPage() {
  const [query, setQuery] = useState('');
  const { friends, isLoading, refresh } = useFriends();
  const visible = useMemo(
    () => friends
      .filter((friend) => friend.name.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => new Date(b.lastEngagedAt || 0).getTime() - new Date(a.lastEngagedAt || 0).getTime()),
    [friends, query]
  );

  return (
    <div className="friends-page">
      <header className="friends-hero">
        <div>
          <span><Users aria-hidden="true" /> Your circle</span>
          <h1>Friends make the memory.</h1>
          <p>Find the people already on Amika, invite someone new, and keep your shared history in one place.</p>
        </div>
        <div className="friends-hero__action"><AddFriendDialog onAdd={refresh} /></div>
      </header>

      <main className="friends-content">
        <FriendRequests onUpdate={refresh} />
        <div className="friends-toolbar">
          <div><span>People you know</span><h2>{friends.length} {friends.length === 1 ? 'friend' : 'friends'}</h2></div>
          <label>
            <Search aria-hidden="true" />
            <span className="sr-only">Search friends</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find someone" />
          </label>
        </div>

        {isLoading ? (
          <div className="friends-empty">Loading your circle…</div>
        ) : visible.length === 0 ? (
          <div className="friends-empty">
            <UserRoundPlus aria-hidden="true" />
            <h2>{query ? 'No friend matches that search.' : 'Your circle starts with one person.'}</h2>
            <p>{query ? 'Try a different name.' : 'Add a friend and begin collecting the little moments you share.'}</p>
          </div>
        ) : (
          <div className="friends-grid">
            {visible.map((friend: Friend) => (
              <article key={friend.id} className="friend-tile">
                <Link href={`/friends/${friend.id}`} className="friend-tile__main">
                  <FriendAvatar name={friend.name} profileImage={friend.profileImage} customProfileImage={friend.customProfileImage} size="lg" />
                  <div>
                    <h2>{friend.name}</h2>
                    <p>{friend.notes || (friend.linkedUserId ? 'Sharing memories on Amika' : 'Part of your private circle')}</p>
                  </div>
                </Link>
                <div className="friend-tile__footer">
                  <span><Camera aria-hidden="true" /> {friend.memoriesCount || 0} memories</span>
                  {friend.linkedUserId ? (
                    <Link href={`/messages?with=${friend.linkedUserId}`}><MessageCircle aria-hidden="true" /> Message</Link>
                  ) : (
                    <span className="friend-tile__private">Private profile</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
