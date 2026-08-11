'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, LoaderCircle, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { StoryViewer, type Story } from '@/components/profile-stories';

type StoryGroup = {
  userId: string;
  name: string;
  image?: string | null;
  stories: Story[];
};

export function HomeStories() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState<{ group: number; story: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/stories?scope=feed', { cache: 'no-store' });
      if (!response.ok) throw new Error('Stories are taking a breather.');
      setStories(await response.json());
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Stories are taking a breather.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const groups = useMemo(() => {
    const map = new Map<string, StoryGroup>();
    stories.forEach((story) => {
      const author = story.author || (story.isOwn && user ? { id: user.id, name: user.name, profileImage: user.profileImage || null } : null);
      if (!author) return;
      const current = map.get(story.userId);
      if (current) current.stories.push(story);
      else map.set(story.userId, { userId: story.userId, name: story.isOwn ? 'Your story' : author.name, image: author.profileImage, stories: [story] });
    });
    return [...map.values()].sort((a, b) => Number(b.userId === user?.id) - Number(a.userId === user?.id));
  }, [stories, user]);

  const postStory = async (file?: File) => {
    if (!file || posting) return;
    if (!file.type.startsWith('image/')) return setError('Stories currently use photos.');
    if (file.size > 4 * 1024 * 1024) return setError('Choose a photo smaller than 4 MB.');
    setPosting(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const upload = await fetch('/api/upload', { method: 'POST', body: form });
      if (!upload.ok) throw new Error('That photo could not be uploaded.');
      const { url } = await upload.json();
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url, visibility: 'friends' }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || 'Your story could not be posted.');
      }
      await load();
    } catch (postError) {
      setError(postError instanceof Error ? postError.message : 'Your story could not be posted.');
    } finally {
      setPosting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const activeGroup = active ? groups[active.group] : null;
  const activeStory = activeGroup && active ? activeGroup.stories[active.story] : null;

  return <section className="home-stories" aria-label="Stories from your circle">
    <div className="home-stories__heading">
      <div><span>Fresh from your circle</span><h2>Stories</h2></div>
      <p>Small moments that stay for 24 hours.</p>
    </div>
    <div className="home-stories__rail">
      <button className="story-bubble story-bubble--add" type="button" onClick={() => fileRef.current?.click()} disabled={posting}>
        <span>{posting ? <LoaderCircle className="spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}</span>
        <strong>{posting ? 'Posting…' : 'Add story'}</strong>
      </button>
      <input ref={fileRef} className="sr-only" type="file" accept="image/*" onChange={(event) => void postStory(event.target.files?.[0])} />
      {loading ? <div className="home-stories__loading"><LoaderCircle className="spin" aria-hidden="true" /><span>Gathering stories…</span></div> : groups.map((group, groupIndex) => {
        const newest = group.stories[group.stories.length - 1];
        return <button className="story-bubble" type="button" key={group.userId} onClick={() => setActive({ group: groupIndex, story: group.stories.length - 1 })} aria-label={`Open ${group.name}`}>
          <span>{newest.imageUrl ? <Image src={newest.imageUrl} alt="" fill sizes="82px" className="object-cover" unoptimized /> : <ImagePlus aria-hidden="true" />}</span>
          <strong>{group.name}</strong>
        </button>;
      })}
    </div>
    {error && <p className="home-stories__error" role="status">{error}</p>}
    {activeGroup && activeStory && active ? <StoryViewer
      story={activeStory}
      ownerName={activeGroup.name}
      ownerImage={activeGroup.image}
      position={active.story}
      total={activeGroup.stories.length}
      onClose={() => setActive(null)}
      onPrevious={() => setActive((current) => current ? { ...current, story: Math.max(0, current.story - 1) } : null)}
      onNext={() => setActive((current) => current ? { ...current, story: Math.min(activeGroup.stories.length - 1, current.story + 1) } : null)}
      onRefresh={load}
      onDeleted={() => { setActive(null); void load(); }}
    /> : null}
  </section>;
}
