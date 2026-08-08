'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, BookOpen, Cake, Camera, Heart, MessageCircle, Sparkles, Users } from 'lucide-react';
import { FriendAvatar } from '@/components/friend-avatar';
import { FeedMemory, MemoryCard } from '@/components/dashboard';
import { useAuth } from '@/lib/auth-context';
import { getInterestLabel, parseInterests } from '@/lib/interests';

type Friend = {
  id: string;
  name: string;
  birthday?: string | null;
  howWeMet?: string | null;
  notes?: string | null;
  interests?: string | null;
  profileImage?: string | null;
  customProfileImage?: string | null;
  linkedUserId?: string | null;
};

export default function FriendProfilePage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [friend, setFriend] = useState<Friend | null>(null);
  const [memories, setMemories] = useState<FeedMemory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    if (!user) return;
    const [friendsResponse, memoriesResponse] = await Promise.all([fetch('/api/friends'), fetch('/api/memories')]);
    if (friendsResponse.ok) {
      const friends = await friendsResponse.json();
      setFriend(friends.find((item: Friend) => item.id === params.id) || null);
    }
    if (memoriesResponse.ok) {
      const data = await memoriesResponse.json();
      setMemories(data.filter((memory: { friendId: string }) => memory.friendId === params.id).map((memory: any) => ({
        ...memory,
        memoryDate: memory.memoryDate || memory.createdAt,
        author: { id: user.id, name: user.name, profileImage: user.profileImage },
        friend: memory.friend ? { ...memory.friend, profileImage: friend?.profileImage || null } : null,
        reactionCount: 0,
        commentCount: 0,
        reactedByMe: false,
        isOwn: true,
      })));
    }
    setLoading(false);
  };

  useEffect(() => { loadProfile(); }, [params.id, user]);
  const interests = useMemo(() => parseInterests(friend?.interests), [friend?.interests]);

  if (loading) return <div className="profile-state">Opening this friendship…</div>;
  if (!friend) return <div className="profile-state"><h1>Friend not found</h1><Link href="/friends">Back to friends</Link></div>;

  return (
    <div className="friend-profile-page">
      <header className="friend-profile-hero">
        <Link href="/friends" aria-label="Back to friends"><ArrowLeft aria-hidden="true" /></Link>
        <div className="friend-profile-hero__identity">
          <FriendAvatar name={friend.name} profileImage={friend.profileImage} customProfileImage={friend.customProfileImage} size="lg" expandable />
          <div><span>In your circle</span><h1>{friend.name}</h1></div>
        </div>
        <div className="friend-profile-hero__actions">
          {friend.linkedUserId && <Link href={`/messages?with=${friend.linkedUserId}`}><MessageCircle aria-hidden="true" /> Message</Link>}
          <Link href="/"><Camera aria-hidden="true" /> Add a memory</Link>
        </div>
      </header>

      <main className="friend-profile-content">
        <aside className="friend-profile-details">
          <section><span><Heart aria-hidden="true" /> Friendship</span><p>{friend.howWeMet || 'Add how you met so this friendship has a beginning.'}</p></section>
          {friend.birthday && <section><span><Cake aria-hidden="true" /> Birthday</span><p>{format(new Date(friend.birthday), 'MMMM d')}</p></section>}
          <section><span><BookOpen aria-hidden="true" /> Private notes</span><p>{friend.notes || 'No private notes yet.'}</p></section>
          {interests.length > 0 && <section><span><Sparkles aria-hidden="true" /> Interests</span><div className="friend-interest-list">{interests.map((interest) => <b key={interest}>{getInterestLabel(interest)}</b>)}</div></section>}
        </aside>

        <section className="friend-profile-memories">
          <div className="friend-profile-memories__heading"><div><span>Shared history</span><h2>Memories with {friend.name}</h2></div><strong>{memories.length}</strong></div>
          {memories.length === 0 ? (
            <div className="friends-empty"><Users aria-hidden="true" /><h2>Your shared history starts with one moment.</h2><p>Add something small you would both remember.</p><Link href="/">Add a memory</Link></div>
          ) : (
            <div className="friend-profile-grid">{memories.map((memory, index) => <MemoryCard key={memory.id} memory={memory} featured={index === 0} onRefresh={loadProfile} />)}</div>
          )}
        </section>
      </main>
    </div>
  );
}
