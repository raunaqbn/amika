'use client';

import { FormEvent, KeyboardEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Check, LoaderCircle, MessageCircle, Search, Send, Sparkles, SquarePen, Users, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

type Thread = {
  id: string;
  name: string;
  profileImage: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  kind: 'direct' | 'group';
  memberCount?: number;
  members?: ChatPerson[];
};

type ChatPerson = {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
};

type Message = {
  id: string;
  senderId: string;
  recipientId: string | null;
  threadId?: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string; profileImage: string | null };
};

const CONVERSATION_POLL_MS = 2_000;
const THREAD_POLL_MS = 5_000;

function sameMessages(current: Message[], next: Message[]) {
  return current.length === next.length && current.every((message, index) => {
    const candidate = next[index];
    if (!candidate) return false;
    return message.id === candidate.id
      && message.content === candidate.content
      && message.createdAt === candidate.createdAt;
  });
}

function sameThreads(current: Thread[], next: Thread[]) {
  return current.length === next.length && current.every((thread, index) => {
    const candidate = next[index];
    if (!candidate) return false;
    return thread.id === candidate.id
      && thread.kind === candidate.kind
      && thread.name === candidate.name
      && thread.lastMessage === candidate.lastMessage
      && thread.lastMessageAt === candidate.lastMessageAt
      && thread.unreadCount === candidate.unreadCount
      && thread.memberCount === candidate.memberCount;
  });
}

function MessageAvatar({ thread }: { thread: Pick<Thread, 'name' | 'profileImage'> & Partial<Pick<Thread, 'kind'>> }) {
  return (
    <span className="messages-avatar">
      {thread.profileImage ? (
        <Image src={thread.profileImage} alt="" fill className="object-cover" unoptimized />
      ) : thread.kind === 'group' ? (
        <Users aria-hidden="true" />
      ) : (
        thread.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
      )}
    </span>
  );
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [draftThread, setDraftThread] = useState<Thread | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [people, setPeople] = useState<ChatPerson[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [composerQuery, setComposerQuery] = useState('');
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const [composerError, setComposerError] = useState('');
  const loadingThreadsRef = useRef(false);
  const loadingConversationsRef = useRef(new Set<string>());
  const activeConversationRef = useRef('');
  const streamRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const needsInitialScrollRef = useRef(true);

  const loadThreads = useCallback(async () => {
    if (loadingThreadsRef.current) return;
    loadingThreadsRef.current = true;
    try {
      const response = await fetch('/api/messages', { cache: 'no-store' });
      if (!response.ok) {
        setError('Messages could not be loaded. Refresh the page to try again.');
        setLoading(false);
        return;
      }
      const data: Thread[] = await response.json();
      const existingThreads = data.filter((thread) => Boolean(thread.lastMessageAt));
      setThreads((current) => sameThreads(current, existingThreads) ? current : existingThreads);
      const requestedId = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('with') || new URLSearchParams(window.location.search).get('thread')
        : null;
      setSelectedId((current) => current || (requestedId && existingThreads.some((thread) => thread.id === requestedId) ? requestedId : existingThreads[0]?.id || ''));
      setLoading(false);
    } catch {
      setError('Messages could not be loaded. Check your connection and try again.');
      setLoading(false);
    } finally {
      loadingThreadsRef.current = false;
    }
  }, []);

  const loadConversation = useCallback(async (thread: Pick<Thread, 'id' | 'kind'> | null) => {
    if (!thread) return;
    const parameter = thread.kind === 'group' ? 'thread' : 'with';
    const path = `/api/messages?${parameter}=${encodeURIComponent(thread.id)}`;
    if (loadingConversationsRef.current.has(path)) return;
    loadingConversationsRef.current.add(path);
    try {
      const response = await fetch(path, { cache: 'no-store' });
      if (response.ok && activeConversationRef.current === path) {
        const nextMessages: Message[] = await response.json();
        setMessages((current) => sameMessages(current, nextMessages) ? current : nextMessages);
      }
    } catch {
      // Keep the current conversation visible and retry on the next realtime tick.
    } finally {
      loadingConversationsRef.current.delete(path);
    }
  }, []);

  useEffect(() => { loadThreads(); }, [loadThreads]);
  const selectedThread = threads.find((thread) => thread.id === selectedId) || (draftThread?.id === selectedId ? draftThread : null);
  const selectedKind = selectedThread?.kind;
  activeConversationRef.current = selectedId && selectedKind
    ? `/api/messages?${selectedKind === 'group' ? 'thread' : 'with'}=${encodeURIComponent(selectedId)}`
    : '';
  useEffect(() => {
    needsInitialScrollRef.current = true;
    shouldStickToBottomRef.current = true;
  }, [selectedId]);
  useEffect(() => {
    if (!selectedId || !selectedKind) return;
    loadConversation({ id: selectedId, kind: selectedKind });
  }, [loadConversation, selectedId, selectedKind]);
  useEffect(() => {
    const refreshConversation = () => {
      if (document.visibilityState !== 'visible' || !selectedId || !selectedKind) return;
      loadConversation({ id: selectedId, kind: selectedKind });
    };
    const refreshAll = () => {
      if (document.visibilityState !== 'visible') return;
      loadThreads();
      refreshConversation();
    };
    const conversationInterval = window.setInterval(refreshConversation, CONVERSATION_POLL_MS);
    const threadInterval = window.setInterval(loadThreads, THREAD_POLL_MS);
    window.addEventListener('focus', refreshAll);
    document.addEventListener('visibilitychange', refreshAll);
    return () => {
      window.clearInterval(conversationInterval);
      window.clearInterval(threadInterval);
      window.removeEventListener('focus', refreshAll);
      document.removeEventListener('visibilitychange', refreshAll);
    };
  }, [loadConversation, loadThreads, selectedId, selectedKind]);

  useLayoutEffect(() => {
    const stream = streamRef.current;
    if (!stream || !messages.length) return;
    if (needsInitialScrollRef.current || shouldStickToBottomRef.current) {
      stream.scrollTop = stream.scrollHeight;
      needsInitialScrollRef.current = false;
    }
  }, [messages, selectedId]);

  useEffect(() => {
    if (!composerOpen) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setComposerOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [composerOpen]);

  const visibleThreads = useMemo(
    () => threads.filter((thread) => thread.name.toLowerCase().includes(query.toLowerCase())),
    [query, threads]
  );
  const visiblePeople = useMemo(() => {
    const normalizedQuery = composerQuery.trim().toLowerCase();
    if (!normalizedQuery) return people;
    return people.filter((person) => `${person.name} ${person.email}`.toLowerCase().includes(normalizedQuery));
  }, [composerQuery, people]);

  const openComposer = async () => {
    setComposerOpen(true);
    setSelectedPeople([]);
    setComposerQuery('');
    setComposerError('');
    if (people.length) return;
    setPeopleLoading(true);
    const response = await fetch('/api/connections?accepted=true');
    if (response.ok) setPeople(await response.json());
    else setComposerError('Your friends could not be loaded. Close this window and try again.');
    setPeopleLoading(false);
  };

  const togglePerson = (personId: string) => {
    setSelectedPeople((current) => current.includes(personId)
      ? current.filter((id) => id !== personId)
      : [...current, personId]);
  };

  const startChat = async () => {
    if (!selectedPeople.length || creatingChat) return;
    const selected = people.filter((person) => selectedPeople.includes(person.id));
    setComposerError('');
    if (selected.length === 1) {
      const person = selected[0];
      const thread: Thread = {
        id: person.id,
        name: person.name,
        profileImage: person.profileImage,
        lastMessage: null,
        lastMessageAt: null,
        unreadCount: 0,
        kind: 'direct',
      };
      setDraftThread(thread);
      setSelectedId(thread.id);
      setMessages([]);
      setComposerOpen(false);
      return;
    }

    setCreatingChat(true);
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberIds: selectedPeople }),
    });
    if (response.ok) {
      const thread: Thread = await response.json();
      setDraftThread(thread);
      setSelectedId(thread.id);
      setMessages([]);
      setComposerOpen(false);
    } else {
      const data = await response.json().catch(() => ({}));
      setComposerError(data.error || 'The group chat could not be created. Try again.');
    }
    setCreatingChat(false);
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim() || !selectedId || !selectedThread || sending) return;
    setSending(true);
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectedThread.kind === 'group'
        ? { threadId: selectedId, content: draft.trim() }
        : { recipientId: selectedId, content: draft.trim() }),
    });
    if (response.ok) {
      setDraft('');
      shouldStickToBottomRef.current = true;
      await Promise.all([loadConversation(selectedThread), loadThreads()]);
      setDraftThread(null);
    } else {
      const data = await response.json().catch(() => ({}));
      setError(data.error || 'Your message was not sent.');
    }
    setSending(false);
  };

  const handleDraftKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  return (
    <div className="messages-page">
      <section className={`messages-list ${selectedThread ? 'has-selection' : ''}`} aria-label="Conversations">
        <header>
          <div>
            <span>Close friends</span>
            <h1>Messages</h1>
          </div>
          <button type="button" onClick={openComposer} aria-label="Start a new chat"><SquarePen aria-hidden="true" /></button>
        </header>
        <label className="messages-search">
          <Search aria-hidden="true" />
          <span className="sr-only">Search conversations</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a friend" />
        </label>

        {loading ? (
          <div className="messages-state"><LoaderCircle className="spin" aria-hidden="true" /> Loading conversations…</div>
        ) : visibleThreads.length === 0 ? (
          <div className="messages-state">
            <MessageCircle aria-hidden="true" />
            <strong>No conversations yet.</strong>
            <p>Start a chat with one friend or bring a few friends together.</p>
            <button type="button" onClick={openComposer}>Start a new chat</button>
          </div>
        ) : (
          <div className="messages-threads">
            {visibleThreads.map((thread) => (
              <button key={thread.id} type="button" className={thread.id === selectedId ? 'is-active' : ''} onClick={() => setSelectedId(thread.id)}>
                <MessageAvatar thread={thread} />
                <span>
                  <strong>{thread.name}</strong>
                  <small>{thread.lastMessage || 'Start a conversation'}</small>
                </span>
                <span className="messages-thread__meta">
                  {thread.lastMessageAt && <time>{formatDistanceToNow(new Date(thread.lastMessageAt))}</time>}
                  {thread.unreadCount > 0 && <b>{thread.unreadCount}</b>}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className={`messages-conversation ${selectedThread ? 'is-open' : ''}`} aria-label={selectedThread ? `Conversation with ${selectedThread.name}` : 'Conversation'}>
        {selectedThread ? (
          <>
            <header>
              <button className="messages-back" type="button" onClick={() => setSelectedId('')} aria-label="Back to conversations">
                <ArrowLeft aria-hidden="true" />
              </button>
              <MessageAvatar thread={selectedThread} />
              <div><strong>{selectedThread.name}</strong><span>{selectedThread.kind === 'group' ? `${selectedThread.memberCount || selectedThread.members?.length || 0} people` : 'In your circle'}</span></div>
              {selectedThread.kind === 'direct' ? <Link href={`/friends/amika/${selectedThread.id}`}>View profile</Link> : null}
            </header>

            <div
              ref={streamRef}
              className="messages-stream"
              aria-live="polite"
              onScroll={(event) => {
                const stream = event.currentTarget;
                const distanceFromBottom = stream.scrollHeight - stream.clientHeight - stream.scrollTop;
                shouldStickToBottomRef.current = distanceFromBottom < 80;
              }}
            >
              <div className="messages-day"><span>Shared conversation</span></div>
              {messages.length === 0 ? (
                <div className="messages-first">
                  <Sparkles aria-hidden="true" />
                  <h2>{selectedThread.kind === 'group' ? 'Give everyone something to gather around.' : 'Start with the memory that made you think of them.'}</h2>
                  <p>{selectedThread.kind === 'group' ? 'Only the friends in this group can see these messages.' : `Messages stay between you and ${selectedThread.name}.`}</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const own = message.senderId === user?.id;
                  const showDate = index === 0 || format(new Date(messages[index - 1].createdAt), 'yyyy-MM-dd') !== format(new Date(message.createdAt), 'yyyy-MM-dd');
                  return (
                    <div key={message.id}>
                      {showDate && <div className="messages-day"><span>{format(new Date(message.createdAt), 'MMMM d')}</span></div>}
                      <div className={`message-bubble-row ${own ? 'is-own' : ''}`}>
                        {!own && <MessageAvatar thread={{ name: message.sender.name, profileImage: message.sender.profileImage }} />}
                        <div className="message-bubble">
                          {!own && selectedThread.kind === 'group' ? <strong>{message.sender.name}</strong> : null}
                          <p>{message.content}</p>
                          <time dateTime={message.createdAt}>{format(new Date(message.createdAt), 'h:mm a')}</time>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form className="message-compose" onSubmit={sendMessage}>
              <label className="sr-only" htmlFor="message-draft">Message {selectedThread.name}</label>
              <textarea
                id="message-draft"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleDraftKeyDown}
                placeholder={`Message ${selectedThread.name}…`}
                rows={1}
                maxLength={1000}
                aria-describedby="message-draft-hint"
                aria-keyshortcuts="Enter"
              />
              <span id="message-draft-hint" className="sr-only">Press Enter to send. Press Shift and Enter for a new line.</span>
              <button type="submit" disabled={!draft.trim() || sending} aria-label="Send message">
                {sending ? <LoaderCircle className="spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
              </button>
            </form>
          </>
        ) : (
          <div className="messages-blank">
            <MessageCircle aria-hidden="true" />
            <h2>Your friends, one message away.</h2>
            <p>Choose a conversation or find someone in your circle.</p>
          </div>
        )}
        {error && <p className="messages-error" role="alert">{error}</p>}
      </section>
      {composerOpen ? (
        <div className="new-chat-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setComposerOpen(false); }}>
          <section className="new-chat-dialog" role="dialog" aria-modal="true" aria-labelledby="new-chat-title">
            <header>
              <div><span>New conversation</span><h2 id="new-chat-title">Who’s in this chat?</h2></div>
              <button type="button" onClick={() => setComposerOpen(false)} aria-label="Close new chat"><X aria-hidden="true" /></button>
            </header>
            <label className="new-chat-search">
              <Search aria-hidden="true" />
              <span className="sr-only">Find a friend</span>
              <input autoFocus value={composerQuery} onChange={(event) => setComposerQuery(event.target.value)} placeholder="Search your friends" />
            </label>
            {selectedPeople.length > 1 ? <p className="new-chat-note"><Users aria-hidden="true" /> You’re starting a group chat with {selectedPeople.length} friends.</p> : null}
            <div className="new-chat-people" aria-label="Friends">
              {peopleLoading ? <div className="new-chat-status"><LoaderCircle className="spin" aria-hidden="true" /> Loading your circle…</div>
                : visiblePeople.length ? visiblePeople.map((person) => {
                  const selected = selectedPeople.includes(person.id);
                  return <button key={person.id} type="button" aria-pressed={selected} onClick={() => togglePerson(person.id)}>
                    <MessageAvatar thread={{ name: person.name, profileImage: person.profileImage }} />
                    <span><strong>{person.name}</strong><small>{person.email}</small></span>
                    <b aria-hidden="true">{selected ? <Check /> : null}</b>
                  </button>;
                }) : <div className="new-chat-status"><MessageCircle aria-hidden="true" /><strong>{composerQuery ? 'No friends match that search.' : 'No friends to message yet.'}</strong><Link href="/friends">Find friends</Link></div>}
            </div>
            {composerError ? <p className="new-chat-error" role="alert">{composerError}</p> : null}
            <footer>
              <span>{selectedPeople.length ? `${selectedPeople.length} selected` : 'Choose one or more friends'}</span>
              <button type="button" disabled={!selectedPeople.length || creatingChat} onClick={startChat}>
                {creatingChat ? <LoaderCircle className="spin" aria-hidden="true" /> : selectedPeople.length > 1 ? <Users aria-hidden="true" /> : <MessageCircle aria-hidden="true" />}
                {selectedPeople.length > 1 ? 'Start group chat' : 'Start chat'}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}
