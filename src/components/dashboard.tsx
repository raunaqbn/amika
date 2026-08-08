'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CalendarDays,
  Camera,
  Globe2,
  Heart,
  ImagePlus,
  LoaderCircle,
  LockKeyhole,
  Maximize2,
  MessageCircle,
  MoreHorizontal,
  Send,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { format, formatDistanceToNow, isSameDay, subYears } from 'date-fns';
import { useAuth } from '@/lib/auth-context';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

type Visibility = 'private' | 'friends' | 'public';

type Friend = {
  id: string;
  name: string;
  profileImage?: string | null;
  customProfileImage?: string | null;
  linkedUserId?: string | null;
};

export type FeedMemory = {
  id: string;
  userId: string;
  content: string;
  imageUrl: string | null;
  visibility: Visibility;
  memoryDate: string;
  createdAt: string;
  reactionCount: number;
  commentCount: number;
  reactedByMe: boolean;
  isOwn: boolean;
  author: { id: string; name: string; profileImage: string | null };
  friend: { id: string; name: string; profileImage: string | null } | null;
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; profileImage: string | null };
};

const HOME_FEED_LIMIT = 18;

const VISIBILITY: Record<Visibility, { label: string; icon: typeof LockKeyhole }> = {
  private: { label: 'Only me', icon: LockKeyhole },
  friends: { label: 'Friends only', icon: Users },
  public: { label: 'Public', icon: Globe2 },
};

function DirectionContract() {
  return (
    <span
      hidden
      aria-hidden="true"
      dangerouslySetInnerHTML={{
        __html:
          '<!-- THESIS: Amika is a daily shared memory, not a planning dashboard or performance feed. OWN-WORLD: Graphite shell, periwinkle daily field, citrus action, coral reactions, sky friend tags, precise ink borders, photo contact sheets, and timestamp strips. STORY: Add today’s moment, choose the people and audience, then move directly into the living friendship conversation. FIRST VIEWPORT: Desktop rail at left, full-width daily composer across the main canvas, active friends in its edge, and the first large memory directly below; mobile begins with the same composer and collapses to one chronological stream. FORM: Group Chat Scrapbook, grounded direction five, Daily Contact Sheet staging, seed f06448bd. -->',
      }}
    />
  );
}

function Avatar({ name, src, size = 'md' }: { name: string; src?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const className = `memory-avatar memory-avatar--${size}`;
  if (src) {
    return (
      <span className={className} aria-hidden="true">
        <Image src={src} alt="" fill sizes={size === 'lg' ? '64px' : '40px'} className="object-cover" unoptimized />
      </span>
    );
  }
  return (
    <span className={className} aria-hidden="true">
      {name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()}
    </span>
  );
}

function MemoryImageViewer({ memory, open, onOpenChange }: { memory: FeedMemory; open: boolean; onOpenChange: (open: boolean) => void }) {
  if (!memory.imageUrl) return null;

  const fullDate = format(new Date(memory.memoryDate), 'MMMM d, yyyy');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="memory-image-viewer"
        overlayClassName="memory-image-viewer__overlay"
        preventAutoFocus={false}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Memory photo from {fullDate}</DialogTitle>
        <DialogDescription className="sr-only">
          Full-size photo shared by {memory.author.name}. Press Escape or use the close button to return to the memory.
        </DialogDescription>

        <div className="memory-image-viewer__stage">
          <Image
            src={memory.imageUrl}
            alt={`Memory shared by ${memory.author.name} on ${fullDate}`}
            fill
            sizes="100vw"
            className="object-contain"
            unoptimized
          />
        </div>

        <div className="memory-image-viewer__meta">
          <div>
            <span>{fullDate}</span>
            <strong>{memory.author.name}</strong>
          </div>
          {memory.content && <p>{memory.content}</p>}
        </div>

        <DialogClose asChild>
          <button className="memory-image-viewer__close" type="button" aria-label="Close full-size memory photo">
            <X aria-hidden="true" />
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

export function MemoryCard({ memory, featured, onRefresh }: { memory: FeedMemory; featured?: boolean; onRefresh: () => void }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [reacting, setReacting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const visibility = VISIBILITY[memory.visibility] || VISIBILITY.private;
  const VisibilityIcon = visibility.icon;

  const toggleComments = async () => {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (next && comments.length === 0 && memory.commentCount > 0) {
      const response = await fetch(`/api/memories/${memory.id}/comments`);
      if (response.ok) setComments(await response.json());
    }
  };

  const toggleReaction = async () => {
    if (reacting) return;
    setReacting(true);
    await fetch(`/api/memories/${memory.id}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji: 'heart' }),
    });
    setReacting(false);
    onRefresh();
  };

  const sendComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!comment.trim() || sending) return;
    setSending(true);
    const response = await fetch(`/api/memories/${memory.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: comment.trim() }),
    });
    if (response.ok) {
      setComment('');
      const commentsResponse = await fetch(`/api/memories/${memory.id}/comments`);
      if (commentsResponse.ok) setComments(await commentsResponse.json());
      onRefresh();
    }
    setSending(false);
  };

  const deleteMemory = async () => {
    if (!window.confirm('Delete this memory? This cannot be undone.')) return;
    setDeleting(true);
    const response = await fetch(`/api/memories?id=${memory.id}`, { method: 'DELETE' });
    setDeleting(false);
    setMenuOpen(false);
    if (response.ok) onRefresh();
  };

  return (
    <article className={`memory-post ${featured ? 'memory-post--featured' : ''}`}>
      <header className="memory-post__header">
        <Link className="memory-post__person" href={memory.isOwn ? '/profile' : `/friends/amika/${memory.author.id}`}>
          <Avatar name={memory.author.name} src={memory.author.profileImage} />
          <div>
            <strong>{memory.author.name}</strong>
            <span>
              {formatDistanceToNow(new Date(memory.createdAt), { addSuffix: true })}
              <span aria-hidden="true"> · </span>
              <VisibilityIcon size={12} aria-hidden="true" /> {visibility.label}
            </span>
          </div>
        </Link>
        {memory.isOwn && (
          <div className="memory-post__menu">
            <button className="icon-action" type="button" onClick={() => setMenuOpen((current) => !current)} aria-label="Memory options" aria-expanded={menuOpen}>
              <MoreHorizontal aria-hidden="true" />
            </button>
            {menuOpen && (
              <button type="button" className="memory-post__delete" onClick={deleteMemory} disabled={deleting}>
                <Trash2 aria-hidden="true" /> {deleting ? 'Deleting…' : 'Delete memory'}
              </button>
            )}
          </div>
        )}
      </header>

      {memory.imageUrl ? (
        <button
          className="memory-post__image"
          type="button"
          onClick={() => setImageOpen(true)}
          aria-label={`Expand memory photo shared by ${memory.author.name}`}
        >
          <Image
            src={memory.imageUrl}
            alt={`Memory shared by ${memory.author.name}`}
            fill
            sizes={featured ? '(max-width: 768px) 100vw, 720px' : '(max-width: 768px) 100vw, 420px'}
            className="object-cover"
            unoptimized
          />
          <span className="memory-post__expand" aria-hidden="true"><Maximize2 /></span>
          <time dateTime={memory.memoryDate}>{format(new Date(memory.memoryDate), 'MMM d')}</time>
        </button>
      ) : (
        <div className="memory-post__text-only">
          <Sparkles aria-hidden="true" />
          <p>{memory.content}</p>
          <time dateTime={memory.memoryDate}>{format(new Date(memory.memoryDate), 'MMMM d, yyyy')}</time>
        </div>
      )}

      <div className="memory-post__body">
        {memory.imageUrl && <p>{memory.content}</p>}
        {memory.friend && (memory.isOwn ? (
          <Link className="friend-tag" href={`/friends/${memory.friend.id}`}>with {memory.friend.name}</Link>
        ) : (
          <span className="friend-tag">with {memory.friend.name}</span>
        ))}
      </div>

      <div className="memory-post__actions" aria-label="Memory actions">
        <button
          type="button"
          className={memory.reactedByMe ? 'is-active' : ''}
          onClick={toggleReaction}
          disabled={reacting}
          aria-pressed={memory.reactedByMe}
        >
          <Heart fill={memory.reactedByMe ? 'currentColor' : 'none'} aria-hidden="true" />
          <span>{memory.reactionCount || 'Love'}</span>
        </button>
        <button type="button" onClick={toggleComments} aria-expanded={commentsOpen}>
          <MessageCircle aria-hidden="true" />
          <span>{memory.commentCount || 'Reply'}</span>
        </button>
      </div>

      {commentsOpen && (
        <div className="memory-thread">
          {comments.length === 0 ? (
            <p className="memory-thread__empty">Be the first to add to this memory.</p>
          ) : (
            comments.map((item) => (
              <div className="memory-reply" key={item.id}>
                <Avatar name={item.author.name} src={item.author.profileImage} size="sm" />
                <div>
                  <strong>{item.author.name}</strong>
                  <p>{item.content}</p>
                </div>
                <time dateTime={item.createdAt}>{formatDistanceToNow(new Date(item.createdAt))}</time>
              </div>
            ))
          )}
          <form className="memory-reply-form" onSubmit={sendComment}>
            <label className="sr-only" htmlFor={`reply-${memory.id}`}>Reply to this memory</label>
            <input
              id={`reply-${memory.id}`}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Add to the memory…"
              maxLength={240}
            />
            <button type="submit" disabled={!comment.trim() || sending} aria-label="Send reply">
              {sending ? <LoaderCircle className="spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
            </button>
          </form>
        </div>
      )}

      <MemoryImageViewer memory={memory} open={imageOpen} onOpenChange={setImageOpen} />
    </article>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const [memories, setMemories] = useState<FeedMemory[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [caption, setCaption] = useState('');
  const [friendId, setFriendId] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('friends');
  const [memoryDate, setMemoryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMemories = useCallback(async () => {
    try {
      const response = await fetch(`/api/memories?scope=feed&limit=${HOME_FEED_LIMIT}`);
      if (!response.ok) throw new Error('Could not load your memories.');
      const data = await response.json();
      setMemories(data.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load your memories.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFriends = useCallback(async () => {
    try {
      const response = await fetch('/api/friends?view=compact');
      if (!response.ok) throw new Error('Could not load your friends.');
      const data: Friend[] = await response.json();
      setFriends(data);
      setFriendId((current) => current || data[0]?.id || '');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load your friends.');
    }
  }, []);

  useEffect(() => {
    void loadMemories();
    void loadFriends();
  }, [loadFriends, loadMemories]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const flashback = useMemo(() => {
    const previousYear = subYears(new Date(), 1);
    return memories.find((memory) => isSameDay(new Date(memory.memoryDate), previousYear))
      || memories.find((memory) => new Date(memory.memoryDate).getFullYear() < new Date().getFullYear());
  }, [memories]);

  const onImageSelect = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose a photo file to add to this memory.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('This photo is over 4 MB. Choose a smaller one and try again.');
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const submitMemory = async (event: FormEvent) => {
    event.preventDefault();
    if (!caption.trim()) {
      setError('Add a few words so you will remember this moment.');
      return;
    }
    if (!friendId) {
      setError('Choose the friend who was part of this memory.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      let imageUrl: string | null = null;
      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        const uploadResponse = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!uploadResponse.ok) throw new Error('The photo could not be uploaded. Try another file.');
        imageUrl = (await uploadResponse.json()).url;
      }

      const response = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          friendId,
          content: caption.trim(),
          imageUrl,
          visibility,
          memoryDate,
        }),
      });
      if (!response.ok) throw new Error('Your memory was not saved. Please try again.');

      setCaption('');
      setSelectedImage(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      await loadMemories();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Your memory was not saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="memory-app-page">
      <DirectionContract />
      <header className="memory-daily-band">
        <div className="memory-daily-band__intro">
          <span>{format(new Date(), 'EEEE')}</span>
          <strong>{format(new Date(), 'MMMM d, yyyy')}</strong>
          <p>What is one small moment from today worth remembering?</p>
          <div className="memory-friend-strip" aria-label="Friends in your circle">
            {friends.slice(0, 5).map((friend) => (
              <Link key={friend.id} href={`/friends/${friend.id}`} title={friend.name}>
                <Avatar name={friend.name} src={friend.customProfileImage || friend.profileImage} size="lg" />
              </Link>
            ))}
            <Link className="memory-friend-strip__add" href="/friends" aria-label="Add a friend">
              <Users aria-hidden="true" />
            </Link>
          </div>
        </div>

        <form className="memory-composer" onSubmit={submitMemory}>
          <div className="memory-composer__heading">
            <div>
              <span>Daily drop</span>
              <h1>Today&apos;s memory</h1>
            </div>
            <span className="memory-composer__privacy">
              {visibility === 'private' ? <LockKeyhole aria-hidden="true" /> : visibility === 'public' ? <Globe2 aria-hidden="true" /> : <Users aria-hidden="true" />}
              {VISIBILITY[visibility].label}
            </span>
          </div>

          <div className="memory-composer__main">
            <button
              type="button"
              className={`memory-photo-drop ${imagePreview ? 'has-image' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              aria-label={imagePreview ? 'Change memory photo' : 'Add a photo to this memory'}
            >
              {imagePreview ? (
                <Image src={imagePreview} alt="Selected memory preview" fill className="object-cover" unoptimized />
              ) : (
                <>
                  <ImagePlus aria-hidden="true" />
                  <strong>Add a photo</strong>
                  <span>Optional, but lovely</span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={(event) => onImageSelect(event.target.files?.[0])}
            />
            {imagePreview && (
              <button
                className="memory-photo-remove"
                type="button"
                onClick={() => {
                  if (imagePreview) URL.revokeObjectURL(imagePreview);
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                aria-label="Remove selected photo"
              >
                <X aria-hidden="true" />
              </button>
            )}

            <div className="memory-composer__copy">
              <label htmlFor="memory-caption">A few words about this moment</label>
              <textarea
                id="memory-caption"
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder={`Coffee, a missed train, and ${user?.name?.split(' ')[0] || 'a friend'} making it funny…`}
                maxLength={280}
              />
              <span>{caption.length}/280</span>
            </div>
          </div>

          <div className="memory-composer__controls">
            <label>
              <Users aria-hidden="true" />
              <span className="sr-only">Friend in this memory</span>
              <select value={friendId} onChange={(event) => setFriendId(event.target.value)}>
                <option value="">Tag a friend</option>
                {friends.map((friend) => <option value={friend.id} key={friend.id}>{friend.name}</option>)}
              </select>
            </label>
            <label>
              <CalendarDays aria-hidden="true" />
              <span className="sr-only">Memory date</span>
              <input type="date" value={memoryDate} onChange={(event) => setMemoryDate(event.target.value)} />
            </label>
            <label>
              {visibility === 'private' ? <LockKeyhole aria-hidden="true" /> : visibility === 'public' ? <Globe2 aria-hidden="true" /> : <Users aria-hidden="true" />}
              <span className="sr-only">Who can see this memory</span>
              <select value={visibility} onChange={(event) => setVisibility(event.target.value as Visibility)}>
                <option value="private">Only me</option>
                <option value="friends">Friends only</option>
                <option value="public">Public</option>
              </select>
            </label>
            <button className="memory-composer__submit" type="submit" disabled={saving || !caption.trim() || !friendId}>
              {saving ? <LoaderCircle className="spin" aria-hidden="true" /> : <Camera aria-hidden="true" />}
              {saving ? 'Saving…' : 'Add memory'}
            </button>
          </div>
          {error && <p className="memory-composer__error" role="alert">{error}</p>}
        </form>
      </header>

      <div className="memory-feed-layout">
        <main className="memory-feed" aria-busy={loading}>
          <div className="memory-feed__title">
            <div>
              <span>From your circle</span>
              <h2>Recent memories</h2>
            </div>
            <Link href="/memories">See your archive</Link>
          </div>

          {loading ? (
            <div className="memory-feed__loading"><LoaderCircle className="spin" aria-hidden="true" /> Gathering your memories…</div>
          ) : memories.length === 0 ? (
            <div className="memory-feed__empty">
              <Sparkles aria-hidden="true" />
              <h3>Your first memory starts above.</h3>
              <p>Add the tiny moment you would otherwise forget. It does not need to be a milestone.</p>
            </div>
          ) : (
            <div className="memory-contact-sheet">
              {memories.map((memory, index) => (
                <MemoryCard key={memory.id} memory={memory} featured={index === 0} onRefresh={loadMemories} />
              ))}
            </div>
          )}
        </main>

        <aside className="memory-side-rail" aria-label="Friend activity and flashbacks">
          <section className="memory-flashback">
            <div className="memory-side-rail__heading">
              <div>
                <span>Flashback</span>
                <h2>On this day</h2>
              </div>
              <Sparkles aria-hidden="true" />
            </div>
            {flashback ? (
              <Link href="/memories" className="memory-flashback__memory">
                {flashback.imageUrl && (
                  <span className="memory-flashback__image">
                    <Image src={flashback.imageUrl} alt="" fill className="object-cover" unoptimized />
                  </span>
                )}
                <strong>{format(new Date(flashback.memoryDate), 'MMMM d, yyyy')}</strong>
                <p>{flashback.content}</p>
                <span>Remember this one →</span>
              </Link>
            ) : (
              <div className="memory-flashback__empty">
                <CalendarDays aria-hidden="true" />
                <p>Your past moments will return here as the years fill in.</p>
              </div>
            )}
          </section>

          <section className="memory-active-friends">
            <div className="memory-side-rail__heading">
              <div>
                <span>Your people</span>
                <h2>Friends</h2>
              </div>
              <Link href="/friends">See all</Link>
            </div>
            {friends.slice(0, 6).map((friend) => (
              <Link key={friend.id} href={`/friends/${friend.id}`}>
                <Avatar name={friend.name} src={friend.customProfileImage || friend.profileImage} />
                <span><strong>{friend.name}</strong><small>In your circle</small></span>
                <Send aria-hidden="true" />
              </Link>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}
