'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  LockKeyhole,
  PenLine,
  Search,
  Send,
  Sparkles,
  Trash2,
  UsersRound,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MemorySeedling } from '@/components/memory-seedling';
import { useAuth } from '@/lib/auth-context';

/*
THESIS: A private journal should feel like a calm conversation, not a notes database.
OWN-WORLD: Oat cream pages, moss controls, apricot writing surfaces, flax rules, and the Memory Seedling as a quiet listener.
STORY: Begin with one honest thought, optionally let Amika ask a gentle question, keep the draft automatically, then return to a searchable history.
FIRST VIEWPORT: “What’s on your mind?” and one full-width writing invitation lead; a resumable draft and recent entries follow without competing cards.
FORM: Saarthi’s journal-first rhythm adapted into Amika’s established Apricot Moss system for web and mobile.
*/

type Friend = { id: string; name: string; linkedUserId?: string | null };
type DiaryNote = {
  id: string;
  title: string | null;
  content: string;
  analysis: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  friends: Friend[];
};

type StoredDraft = {
  title: string;
  input: string;
  messages: JournalTurn[];
  friendIds: string[];
  updatedAt: string;
};

type JournalTurn = { id: string; role: 'user' | 'assistant'; content: string };

function readDraft(key: string): StoredDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as StoredDraft : null;
  } catch {
    return null;
  }
}

function titleFromBody(body: string) {
  const firstLine = body.split(/\n|[.!?]\s/)[0]?.trim() || '';
  if (!firstLine) return null;
  return firstLine.length > 64 ? `${firstLine.slice(0, 61).trim()}…` : firstLine;
}

export default function DiaryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState<DiaryNote[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedNote, setSelectedNote] = useState<DiaryNote | null>(null);
  const [editingNote, setEditingNote] = useState<DiaryNote | null>(null);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState<StoredDraft | null>(null);
  const draftKey = user ? `amika-journal-draft-v3:${user.id}` : '';

  async function load() {
    setError('');
    try {
      const [notesResponse, friendsResponse] = await Promise.all([
        fetch('/api/diary'),
        fetch('/api/friends'),
      ]);
      if (!notesResponse.ok || !friendsResponse.ok) throw new Error('Your journal could not be opened.');
      const [nextNotes, nextFriends] = await Promise.all([notesResponse.json(), friendsResponse.json()]);
      const ordered = [...nextNotes].sort((a: DiaryNote, b: DiaryNote) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setNotes(ordered);
      setFriends(nextFriends);
      setSelectedNote((current) => current ? ordered.find((note: DiaryNote) => note.id === current.id) || ordered[0] || null : ordered[0] || null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your journal could not be opened.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/signin');
      return;
    }
    setDraft(readDraft(draftKey));
    void load();
  }, [authLoading, draftKey, router, user]);

  const filteredNotes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return notes;
    return notes.filter((note) => [note.title, note.content, note.analysis, ...note.friends.map((friend) => friend.name)].filter(Boolean).join(' ').toLowerCase().includes(term));
  }, [notes, search]);

  function beginWriting(note: DiaryNote | null = null) {
    setEditingNote(note);
    setComposing(true);
  }

  async function deleteNote(note: DiaryNote) {
    if (!window.confirm('Delete this journal entry? This cannot be undone.')) return;
    const response = await fetch(`/api/diary?id=${note.id}`, { method: 'DELETE' });
    if (!response.ok) {
      setError('That entry could not be deleted. Please try again.');
      return;
    }
    const remaining = notes.filter((item) => item.id !== note.id);
    setNotes(remaining);
    setSelectedNote(remaining[0] || null);
  }

  if (authLoading || !user) {
    return <div className="journal-auth-loading"><MemorySeedling pose="rest" size="lg" animated /><span>Opening your private journal…</span></div>;
  }

  if (composing) {
    return (
      <JournalComposer
        draftKey={draftKey}
        friends={friends}
        note={editingNote}
        onClose={() => { setComposing(false); setEditingNote(null); setDraft(readDraft(draftKey)); }}
        onSaved={async (saved) => {
          setComposing(false);
          setEditingNote(null);
          setDraft(null);
          await load();
          setSelectedNote(saved);
        }}
      />
    );
  }

  return (
    <div className="journal-shell">
      <section className="journal-home-hero">
        <div>
          <span>{format(new Date(), 'EEEE, MMMM d')}</span>
          <h1>What’s on your mind?</h1>
          <p>Take a breath. Start anywhere—you do not need to make it coherent yet.</p>
        </div>
        <MemorySeedling pose="listen" size="xl" label="Memory Seedling listening" />
      </section>

      {draft ? (
        <button className="journal-resume" onClick={() => beginWriting()}>
          <span className="journal-action-mark"><PenLine aria-hidden="true" /></span>
          <span>
            <small>Continue draft · {formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true })}</small>
            <strong>{draft.title || titleFromBody([...draft.messages.filter((message) => message.role === 'user').map((message) => message.content), draft.input].join(' ')) || 'Untitled thought'}</strong>
            <span>{draft.input || draft.messages.filter((message) => message.role === 'user').at(-1)?.content || 'Your words are waiting.'}</span>
          </span>
          <span className="journal-action-label">Continue <ArrowRight aria-hidden="true" /></span>
        </button>
      ) : null}

      <button className="journal-begin" onClick={() => beginWriting()}>
        <span className="journal-action-mark"><PenLine aria-hidden="true" /></span>
        <span>
          <strong>Begin writing</strong>
          <span>A thought, a feeling, something that happened—whatever is present.</span>
        </span>
        <span className="journal-action-label">Open journal <ArrowRight aria-hidden="true" /></span>
      </button>

      <div className="journal-activity" aria-label="Journal activity">
        <span>{notes.length ? `${notes.length} ${notes.length === 1 ? 'entry' : 'entries'} in your private journal` : 'A fresh page is waiting'}</span>
        <span><LockKeyhole aria-hidden="true" /> Private by default</span>
      </div>

      <section className="journal-library">
        <header>
          <div>
            <span>Your journal</span>
            <h2>Recent writing</h2>
          </div>
          <label className="journal-search">
            <Search aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your words" aria-label="Search journal entries" />
          </label>
        </header>

        {loading ? (
          <div className="journal-loading" role="status"><MemorySeedling pose="rest" size="lg" animated /><span>Opening your journal…</span></div>
        ) : error ? (
          <div className="journal-load-error" role="alert">
            <MemorySeedling pose="rest" size="lg" />
            <h3>Your journal could not be opened</h3>
            <p>Your entries have not been changed. Check your connection and try again.</p>
            <button onClick={() => void load()}>Try again</button>
          </div>
        ) : filteredNotes.length ? (
          <div className="journal-library-layout">
            <div className="journal-entry-list" aria-label="Journal entries">
              {filteredNotes.map((note) => (
                <button key={note.id} className={selectedNote?.id === note.id ? 'is-active' : ''} onClick={() => setSelectedNote(note)}>
                  <span>{format(new Date(note.updatedAt), 'MMM d, yyyy')}</span>
                  <strong>{note.title?.trim() || 'Untitled entry'}</strong>
                  <p>{note.content}</p>
                  <small>{note.friends.length ? note.friends.map((friend) => friend.name).join(', ') : 'Just you'}</small>
                  <ChevronRight aria-hidden="true" />
                </button>
              ))}
            </div>

            {selectedNote ? (
              <article className="journal-entry-detail">
                <header>
                  <div>
                    <span>{format(new Date(selectedNote.createdAt), 'EEEE, MMMM d, yyyy')}</span>
                    <h2>{selectedNote.title?.trim() || 'Untitled entry'}</h2>
                  </div>
                  <div>
                    <button onClick={() => beginWriting(selectedNote)}><PenLine aria-hidden="true" /> Edit</button>
                    <button className="is-danger" onClick={() => void deleteNote(selectedNote)} aria-label="Delete entry"><Trash2 aria-hidden="true" /></button>
                  </div>
                </header>
                {selectedNote.imageUrl ? <Image src={selectedNote.imageUrl} alt="Attached to this journal entry" width={1200} height={720} unoptimized /> : null}
                <div className="journal-entry-copy">{selectedNote.content}</div>
                {selectedNote.friends.length ? (
                  <div className="journal-entry-people"><UsersRound aria-hidden="true" /><span>People in this note: {selectedNote.friends.map((friend) => friend.name).join(', ')}</span></div>
                ) : null}
                {selectedNote.analysis ? (
                  <aside className="journal-gentle-reflection">
                    <div><MemorySeedling pose="rest" size="sm" /><strong>A gentle reflection</strong></div>
                    <p>{selectedNote.analysis}</p>
                  </aside>
                ) : null}
              </article>
            ) : null}
          </div>
        ) : (
          <div className="journal-empty">
            <MemorySeedling pose="peek" size="xl" />
            <h3>{search ? 'No entries match' : 'A blank page, in a good way'}</h3>
            <p>{search ? 'Try a feeling, a person, or a phrase you remember writing.' : 'Your journal is for the part of a memory that only needs to belong to you.'}</p>
            {!search ? <button onClick={() => beginWriting()}>Write your first entry</button> : null}
          </div>
        )}
      </section>
    </div>
  );
}

function JournalComposer({
  draftKey,
  friends,
  note,
  onClose,
  onSaved,
}: {
  draftKey: string;
  friends: Friend[];
  note: DiaryNote | null;
  onClose: () => void;
  onSaved: (note: DiaryNote) => void;
}) {
  const hydrated = useRef(false);
  const [title, setTitle] = useState(note?.title || '');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>(note?.friends.map((friend) => friend.id) || []);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [responding, setResponding] = useState(false);
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');
  const [messages, setMessages] = useState<JournalTurn[]>([]);
  const [input, setInput] = useState('');
  const transcriptEnd = useRef<HTMLDivElement>(null);
  const storageKey = note ? `${draftKey}:edit:${note.id}` : draftKey;

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const stored = readDraft(storageKey);
    if (stored) {
      setTitle(stored.title);
      setSelectedFriendIds(stored.friendIds);
      setMessages(stored.messages);
      setInput(stored.input);
      setDraftStatus('saved');
      return;
    }
    if (note) setMessages([{ id: `entry-${note.id}`, role: 'user', content: note.content }]);
  }, [note, storageKey]);

  useEffect(() => {
    transcriptEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, responding]);

  useEffect(() => {
    if (!hydrated.current) return;
    const hasWords = input.trim() || messages.some((message) => message.role === 'user' && message.content.trim());
    if (!hasWords) {
      window.localStorage.removeItem(storageKey);
      setDraftStatus('idle');
      return;
    }
    const nextDraft: StoredDraft = {
      title,
      input,
      messages: messages.map(({ id, role, content }) => ({ id, role, content })),
      friendIds: selectedFriendIds,
      updatedAt: new Date().toISOString(),
    };
    setDraftStatus('saving');
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextDraft));
      setDraftStatus('saved');
    } catch {
      setDraftStatus('error');
    }
  }, [input, messages, selectedFriendIds, storageKey, title]);

  const authoredBody = useMemo(() => [
    ...messages.filter((message) => message.role === 'user').map((message) => message.content.trim()),
    input.trim(),
  ].filter(Boolean).join('\n\n'), [input, messages]);
  const wordCount = authoredBody ? authoredBody.split(/\s+/).length : 0;

  async function saveEntry() {
    if (!authoredBody) {
      setSaveError('Write a few honest words before saving this entry.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const friendTags = selectedFriendIds.map((friendId) => ({ friendId, sharedWithFriend: false }));
      const response = await fetch('/api/diary', {
        method: note ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(note ? { id: note.id, imageUrl: note.imageUrl } : {}),
          title: title.trim() || titleFromBody(authoredBody),
          content: authoredBody,
          savedReflection: messages.filter((message) => message.role === 'assistant').at(-1)?.content || null,
          friendIds: selectedFriendIds,
          friendTags,
        }),
      });
      if (!response.ok) throw new Error('Amika could not save this entry. Your draft is still here.');
      const saved = await response.json() as DiaryNote;
      window.localStorage.removeItem(storageKey);
      onSaved({ ...saved, friends: friends.filter((friend) => selectedFriendIds.includes(friend.id)) });
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Amika could not save this entry. Your draft is still here.');
    } finally {
      setSaving(false);
    }
  }

  async function askAmika() {
    if (!input.trim()) {
      setSaveError('Write a few honest words first.');
      return;
    }
    setSaveError('');
    const userTurn: JournalTurn = { id: `user-${Date.now()}`, role: 'user', content: input.trim() };
    const nextMessages = [...messages, userTurn];
    setMessages(nextMessages);
    setInput('');
    setResponding(true);
    try {
      const response = await fetch('/api/journal-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: nextMessages.filter((message) => message.role === 'user').map((message) => message.content).join('\n\n'),
          turns: nextMessages,
        }),
      });
      const result = await response.json() as { message?: string; error?: string };
      if (!response.ok || !result.message) throw new Error(result.error || 'Amika could not respond right now.');
      setMessages([...nextMessages, { id: `amika-${Date.now()}`, role: 'assistant', content: result.message }]);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Amika could not respond right now. Your draft is still here.');
    } finally {
      setResponding(false);
    }
  }

  return (
    <div className="journal-compose-page">
      <header className="journal-compose-header">
        <button onClick={onClose}><ArrowLeft aria-hidden="true" /><span>Back</span></button>
        <div className="journal-compose-brand">
          <MemorySeedling pose="listen" size="sm" />
          <span><strong>Journal with Amika</strong><small>{messages.filter((message) => message.role === 'user').length ? `${messages.filter((message) => message.role === 'user').length} writing turns` : 'Write, reflect, then save'}</small></span>
        </div>
        <span className={`journal-private-status is-${draftStatus}`}><i />{draftStatus === 'saved' ? 'Saved on this device' : draftStatus === 'saving' ? 'Saving draft…' : draftStatus === 'error' ? 'Draft not saved' : 'New reflection'}</span>
      </header>

      <div className="journal-compose-layout">
        <main className="journal-conversation" aria-label="Guided journal conversation">
          <div className="journal-conversation-intro">
            <MemorySeedling pose="listen" size="lg" />
            <div><span>Amika</span><h1>What’s on your mind?</h1><p>Start with one honest thought. I’ll only respond when you ask.</p></div>
          </div>

          <div className="journal-transcript">
            {messages.map((message) => (
              <article key={message.id} className={message.role === 'user' ? 'is-user' : 'is-amika'}>
                {message.role === 'assistant' ? <div className="journal-speaker"><MemorySeedling pose="listen" size="xs" /><span>Amika</span></div> : <span>You wrote</span>}
                {message.role === 'assistant' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                ) : <p>{message.content}</p>}
              </article>
            ))}
            {responding ? <div className="journal-thinking"><MemorySeedling pose="listen" size="xs" animated /><span>Amika is reading your words…</span></div> : null}
            <div ref={transcriptEnd} />
          </div>

          <div className="journal-composer">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={messages.length ? 'Keep writing…' : 'Write what is true before trying to make it tidy…'}
              aria-label="Write your next journal thought"
              maxLength={4000}
              autoFocus
            />
            <div>
              <span>{wordCount} words · {draftStatus === 'error' ? 'Could not save this draft' : 'Draft stays on this device until you save'}</span>
              <button type="button" onClick={() => void askAmika()} disabled={responding || !input.trim()}>Get a response <Send aria-hidden="true" /></button>
            </div>
          </div>
          {saveError ? <p className="journal-compose-error" role="alert">{saveError}</p> : null}
        </main>

        <aside className={settingsOpen ? 'journal-compose-settings is-open' : 'journal-compose-settings'}>
          <button className="journal-settings-toggle" aria-expanded={settingsOpen} aria-controls="journal-entry-details" onClick={() => setSettingsOpen((open) => !open)}>
            <Sparkles aria-hidden="true" /><span>Entry details</span><ChevronRight aria-hidden="true" />
          </button>
          <div className="journal-settings-content" id="journal-entry-details">
            <label><span>Title <small>Optional</small></span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="A small realization" /></label>
            <fieldset>
              <legend>People in this note <small>Private tags</small></legend>
              <p>Tag someone for your own organization. This does not share the entry.</p>
              <div>
                {friends.map((friend) => (
                  <button key={friend.id} type="button" aria-pressed={selectedFriendIds.includes(friend.id)} className={selectedFriendIds.includes(friend.id) ? 'is-selected' : ''} onClick={() => setSelectedFriendIds((current) => current.includes(friend.id) ? current.filter((id) => id !== friend.id) : [...current, friend.id])}>
                    {friend.name}<Check aria-hidden="true" />
                  </button>
                ))}
                {!friends.length ? <span>No friends added yet.</span> : null}
              </div>
            </fieldset>
            <p className="journal-settings-note"><LockKeyhole aria-hidden="true" /> Journal entries stay private unless you explicitly share them elsewhere.</p>
          </div>
        </aside>
      </div>

      <footer className="journal-compose-footer">
        <span><Sparkles aria-hidden="true" /> Amika asks one gentle question at a time.</span>
        <button onClick={() => void saveEntry()} disabled={saving || responding || !authoredBody}>
          {saving ? <span className="journal-saving-dot" /> : <Check aria-hidden="true" />}
          {saving ? 'Keeping entry…' : note ? 'Save changes' : 'Finish & keep entry'}
        </button>
      </footer>
    </div>
  );
}
