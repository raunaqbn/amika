'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Camera, MessageCircle, Sparkles, Users } from 'lucide-react';
import { FeedMemory, MemoryCard } from '@/components/dashboard';
import { useAuth } from '@/lib/auth-context';

type Profile = { id: string; name: string; email: string; profileImage: string | null; birthday: string | null };

export default function AmikaFriendProfilePage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memories, setMemories] = useState<FeedMemory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    if (!user) return;
    const [profileResponse, memoriesResponse] = await Promise.all([
      fetch(`/api/amika-friends/${params.id}`),
      fetch(`/api/amika-friends/${params.id}/memories`),
    ]);
    const profileData = profileResponse.ok ? await profileResponse.json() : null;
    if (profileData) setProfile(profileData);
    if (memoriesResponse.ok) {
      const data = await memoriesResponse.json();
      setMemories(data.map((memory: any) => ({
        ...memory,
        friendId: null,
        visibility: memory.sharedWithAmikaFriend ? 'friends' : 'private',
        memoryDate: memory.createdAt,
        author: { id: user.id, name: user.name, profileImage: user.profileImage },
        friend: profileData ? { id: profileData.id, name: profileData.name, profileImage: profileData.profileImage } : null,
        reactionCount: 0,
        commentCount: 0,
        reactedByMe: false,
        isOwn: true,
      })));
    }
    setLoading(false);
  };

  useEffect(() => { loadProfile(); }, [params.id, user]);

  if (loading) return <div className="profile-state">Opening this friendship…</div>;
  if (!profile) return <div className="profile-state"><h1>Profile unavailable</h1><Link href="/friends">Back to friends</Link></div>;

  return (
    <div className="friend-profile-page">
      <header className="friend-profile-hero friend-profile-hero--amika">
        <Link href="/friends" aria-label="Back to friends"><ArrowLeft aria-hidden="true" /></Link>
        <div className="friend-profile-hero__identity">
          <span className="friend-profile-photo">
            {profile.profileImage ? <Image src={profile.profileImage} alt="" fill className="object-cover" unoptimized /> : profile.name.slice(0, 2).toUpperCase()}
          </span>
          <div><span>Friends on Amika</span><h1>{profile.name}</h1></div>
        </div>
        <div className="friend-profile-hero__actions">
          <Link href={`/messages?with=${profile.id}`}><MessageCircle aria-hidden="true" /> Message</Link>
          <Link href="/"><Camera aria-hidden="true" /> Add a memory</Link>
        </div>
      </header>

      <main className="friend-profile-content friend-profile-content--wide">
        <section className="friend-profile-memories">
          <div className="friend-profile-memories__heading"><div><span>Shared history</span><h2>Memories with {profile.name}</h2></div><strong>{memories.length}</strong></div>
          {memories.length === 0 ? (
            <div className="friends-empty"><Sparkles aria-hidden="true" /><h2>Start the shared camera roll.</h2><p>Add a memory, then choose whether {profile.name} can see it.</p><Link href="/">Add a memory</Link></div>
          ) : (
            <div className="friend-profile-grid">{memories.map((memory, index) => <MemoryCard key={memory.id} memory={memory} featured={index === 0} onRefresh={loadProfile} />)}</div>
          )}
        </section>
        <aside className="friend-profile-amika-note"><Users aria-hidden="true" /><strong>Connected on Amika</strong><p>You can message each other and share friends-only memories directly.</p></aside>
      </main>
    </div>
  );
}
