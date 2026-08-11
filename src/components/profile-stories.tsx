'use client';

import Image from 'next/image';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ChevronLeft, ChevronRight, Globe2, Heart, ImagePlus, LoaderCircle, LockKeyhole, Plus, Send, Trash2, X } from 'lucide-react';

export type Story = {
  id: string;
  userId: string;
  content: string | null;
  imageUrl: string;
  visibility: 'public' | 'friends';
  createdAt: string;
  expiresAt: string;
  reactionCount: number;
  commentCount: number;
  reactedByMe: boolean;
  isOwn: boolean;
  author?: { id: string; name: string; profileImage: string | null };
};

type StoryComment = {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; profileImage: string | null };
};

export function ProfileStories({
  ownerId,
  ownerName,
  ownerImage,
  canPost = false,
}: {
  ownerId: string;
  ownerName: string;
  ownerImage?: string | null;
  canPost?: boolean;
}) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [composing, setComposing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'friends'>('public');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const loadStories = useCallback(async () => {
    const response = await fetch(`/api/stories?userId=${encodeURIComponent(ownerId)}`, { cache: 'no-store' });
    if (response.ok) setStories(await response.json());
    setLoading(false);
  }, [ownerId]);

  useEffect(() => { void loadStories(); }, [loadStories]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const chooseImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Choose a photo for your story.');
    if (file.size > 4 * 1024 * 1024) return setError('Choose a photo smaller than 4 MB.');
    if (preview) URL.revokeObjectURL(preview);
    setSelectedImage(file);
    setPreview(URL.createObjectURL(file));
    setError('');
    setComposing(true);
  };

  const resetComposer = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSelectedImage(null);
    setCaption('');
    setVisibility('public');
    setComposing(false);
    setError('');
  };

  const publish = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedImage || saving) return;
    setSaving(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', selectedImage);
      const upload = await fetch('/api/upload', { method: 'POST', body: form });
      if (!upload.ok) throw new Error('The photo could not be uploaded.');
      const { url } = await upload.json();
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url, content: caption, visibility }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || 'Your story could not be posted.');
      }
      resetComposer();
      await loadStories();
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Your story could not be posted.');
    } finally {
      setSaving(false);
    }
  };

  if (!canPost && !loading && stories.length === 0) return null;

  return (
    <section className="profile-stories" aria-label={`${ownerName}'s stories`}>
      <div className="profile-stories__heading">
        <div><span>Only on this profile</span><h2>{canPost ? 'Your stories' : `${ownerName}'s stories`}</h2></div>
        <p>Photos disappear after 24 hours and never enter the home feed.</p>
      </div>

      <div className="profile-stories__rail">
        {canPost && (
          <button className="story-bubble story-bubble--add" type="button" onClick={() => fileRef.current?.click()}>
            <span><Plus aria-hidden="true" /></span>
            <strong>Add story</strong>
          </button>
        )}
        <input ref={fileRef} className="sr-only" type="file" accept="image/*" onChange={(event) => chooseImage(event.target.files?.[0])} />
        {loading ? (
          <div className="profile-stories__loading"><LoaderCircle className="spin" aria-hidden="true" /> Checking for fresh stories…</div>
        ) : stories.map((story, index) => (
          <button className="story-bubble" type="button" key={story.id} onClick={() => setActiveIndex(index)} aria-label={`Open ${ownerName}'s story, ${formatDistanceToNow(new Date(story.expiresAt))} remaining`}>
            <span>{story.imageUrl ? <Image src={story.imageUrl} alt="" fill sizes="82px" className="object-cover" unoptimized /> : <ImagePlus aria-hidden="true" />}</span>
            <strong>{index === stories.length - 1 ? 'Newest' : `Story ${index + 1}`}</strong>
          </button>
        ))}
      </div>

      {composing && preview && (
        <form className="story-composer" onSubmit={publish}>
          <div className="story-composer__preview"><Image src={preview} alt="Story preview" fill sizes="220px" className="object-cover" unoptimized /></div>
          <div className="story-composer__fields">
            <div><span>New 24-hour story</span><h3>Share a moment people choose to open.</h3></div>
            <label htmlFor="story-caption">Caption <small>{caption.length}/280</small></label>
            <textarea id="story-caption" value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={280} placeholder="Add a little context…" />
            <label htmlFor="story-visibility">Audience</label>
            <div className="story-composer__audience">
              <Globe2 aria-hidden="true" />
              <select id="story-visibility" value={visibility} onChange={(event) => setVisibility(event.target.value as 'public' | 'friends')}>
                <option value="public">Public — anyone who visits your profile</option>
                <option value="friends">Friends only</option>
              </select>
            </div>
            <p className="story-composer__note"><LockKeyhole aria-hidden="true" /> Public is the default. This stays off Home either way.</p>
            {error && <p className="story-composer__error" role="alert">{error}</p>}
            <div className="story-composer__actions">
              <button type="button" onClick={resetComposer}>Cancel</button>
              <button type="submit" disabled={saving}>{saving ? <LoaderCircle className="spin" aria-hidden="true" /> : <Send aria-hidden="true" />}{saving ? 'Posting…' : 'Post story'}</button>
            </div>
          </div>
        </form>
      )}

      {activeIndex !== null && stories[activeIndex] && (
        <StoryViewer
          story={stories[activeIndex]}
          ownerName={ownerName}
          ownerImage={ownerImage}
          position={activeIndex}
          total={stories.length}
          onClose={() => setActiveIndex(null)}
          onPrevious={() => setActiveIndex((current) => current === null ? null : Math.max(0, current - 1))}
          onNext={() => setActiveIndex((current) => current === null ? null : Math.min(stories.length - 1, current + 1))}
          onRefresh={loadStories}
          onDeleted={() => { setActiveIndex(null); void loadStories(); }}
        />
      )}
    </section>
  );
}

export function StoryViewer({ story, ownerName, ownerImage, position, total, onClose, onPrevious, onNext, onRefresh, onDeleted }: {
  story: Story; ownerName: string; ownerImage?: string | null; position: number; total: number;
  onClose: () => void; onPrevious: () => void; onNext: () => void; onRefresh: () => Promise<void>; onDeleted: () => void;
}) {
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [comment, setComment] = useState('');
  const [threadOpen, setThreadOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const loadComments = useCallback(async () => {
    const response = await fetch(`/api/stories/${story.id}/comments`);
    if (response.ok) setComments(await response.json());
  }, [story.id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') onPrevious();
      if (event.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNext, onPrevious]);

  useEffect(() => { setComments([]); setThreadOpen(false); }, [story.id]);
  const timeLeft = useMemo(() => formatDistanceToNow(new Date(story.expiresAt)), [story.expiresAt]);

  const toggleReaction = async () => {
    await fetch(`/api/stories/${story.id}/reactions`, { method: 'POST' });
    await onRefresh();
  };
  const openThread = async () => { setThreadOpen(true); await loadComments(); };
  const sendComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!comment.trim() || sending) return;
    setSending(true);
    const response = await fetch(`/api/stories/${story.id}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: comment.trim() }) });
    if (response.ok) { setComment(''); await loadComments(); await onRefresh(); }
    setSending(false);
  };
  const deleteStory = async () => {
    if (!window.confirm('Delete this story now?')) return;
    const response = await fetch(`/api/stories?id=${story.id}`, { method: 'DELETE' });
    if (response.ok) onDeleted();
  };

  return (
    <div className="story-viewer" role="dialog" aria-modal="true" aria-label={`${ownerName}'s story`}>
      <button className="story-viewer__backdrop" type="button" onClick={onClose} aria-label="Close story" />
      <article className="story-viewer__card">
        <div className="story-viewer__progress" aria-label={`Story ${position + 1} of ${total}`}>
          {Array.from({ length: total }, (_, index) => <span key={index} className={index <= position ? 'is-complete' : ''} />)}
        </div>
        <header>
          <span className="story-viewer__avatar">{ownerImage ? <Image src={ownerImage} alt="" fill sizes="38px" className="object-cover" unoptimized /> : ownerName.slice(0, 1)}</span>
          <div><strong>{ownerName}</strong><span>{timeLeft} left · {story.visibility === 'public' ? 'Public' : 'Friends'}</span></div>
          {story.isOwn && <button type="button" onClick={deleteStory} aria-label="Delete story"><Trash2 aria-hidden="true" /></button>}
          <button type="button" onClick={onClose} aria-label="Close story"><X aria-hidden="true" /></button>
        </header>
        <div className="story-viewer__image"><Image src={story.imageUrl} alt={story.content || `Story by ${ownerName}`} fill sizes="(max-width: 620px) 100vw, 430px" className="object-contain" priority unoptimized /></div>
        {story.content && <p className="story-viewer__caption">{story.content}</p>}
        <div className="story-viewer__social">
          <button className={story.reactedByMe ? 'is-active' : ''} type="button" onClick={toggleReaction} aria-pressed={story.reactedByMe}><Heart fill={story.reactedByMe ? 'currentColor' : 'none'} aria-hidden="true" /> {story.reactionCount || 'Love'}</button>
          <button type="button" onClick={openThread}>Reply {story.commentCount ? `· ${story.commentCount}` : ''}</button>
        </div>
        {total > 1 && <><button className="story-viewer__previous" type="button" onClick={onPrevious} disabled={position === 0} aria-label="Previous story"><ChevronLeft /></button><button className="story-viewer__next" type="button" onClick={onNext} disabled={position === total - 1} aria-label="Next story"><ChevronRight /></button></>}
        {threadOpen && (
          <div className="story-thread">
            <div className="story-thread__heading"><strong>Replies</strong><button type="button" onClick={() => setThreadOpen(false)} aria-label="Close replies"><X /></button></div>
            <div className="story-thread__list">{comments.length ? comments.map((item) => <div key={item.id}><strong>{item.author.name}</strong><p>{item.content}</p></div>) : <p>No replies yet. Start the conversation.</p>}</div>
            <form onSubmit={sendComment}><label className="sr-only" htmlFor={`story-reply-${story.id}`}>Reply to story</label><input id={`story-reply-${story.id}`} value={comment} onChange={(event) => setComment(event.target.value)} maxLength={240} placeholder="Send a reply…" autoFocus /><button type="submit" disabled={!comment.trim() || sending} aria-label="Send reply">{sending ? <LoaderCircle className="spin" /> : <Send />}</button></form>
          </div>
        )}
      </article>
    </div>
  );
}
