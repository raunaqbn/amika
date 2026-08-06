'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { ArrowLeft, LoaderCircle, MessageCircle, Search, Send, Sparkles, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

type Thread = {
  id: string;
  name: string;
  profileImage: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

type Message = {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string; profileImage: string | null };
};

function MessageAvatar({ thread }: { thread: Pick<Thread, 'name' | 'profileImage'> }) {
  return (
    <span className="messages-avatar">
      {thread.profileImage ? (
        <Image src={thread.profileImage} alt="" fill className="object-cover" unoptimized />
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

  const loadThreads = useCallback(async () => {
    const response = await fetch('/api/messages');
    if (!response.ok) {
      setError('Messages could not be loaded. Refresh the page to try again.');
      setLoading(false);
      return;
    }
    const data = await response.json();
    setThreads(data);
    const requestedId = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('with')
      : null;
    setSelectedId((current) => current || (requestedId && data.some((thread: Thread) => thread.id === requestedId) ? requestedId : data[0]?.id || ''));
    setLoading(false);
  }, []);

  const loadConversation = useCallback(async (friendId: string) => {
    if (!friendId) return;
    const response = await fetch(`/api/messages?with=${friendId}`);
    if (response.ok) setMessages(await response.json());
  }, []);

  useEffect(() => { loadThreads(); }, [loadThreads]);
  useEffect(() => { loadConversation(selectedId); }, [loadConversation, selectedId]);
  useEffect(() => {
    const interval = window.setInterval(() => {
      loadThreads();
      if (selectedId) loadConversation(selectedId);
    }, 15000);
    return () => window.clearInterval(interval);
  }, [loadConversation, loadThreads, selectedId]);

  const selectedThread = threads.find((thread) => thread.id === selectedId) || null;
  const visibleThreads = useMemo(
    () => threads.filter((thread) => thread.name.toLowerCase().includes(query.toLowerCase())),
    [query, threads]
  );

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim() || !selectedId || sending) return;
    setSending(true);
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId: selectedId, content: draft.trim() }),
    });
    if (response.ok) {
      setDraft('');
      await Promise.all([loadConversation(selectedId), loadThreads()]);
    } else {
      const data = await response.json().catch(() => ({}));
      setError(data.error || 'Your message was not sent.');
    }
    setSending(false);
  };

  return (
    <div className="messages-page">
      <section className={`messages-list ${selectedThread ? 'has-selection' : ''}`} aria-label="Conversations">
        <header>
          <div>
            <span>Close friends</span>
            <h1>Messages</h1>
          </div>
          <Link href="/friends" aria-label="Find a friend to message"><Users aria-hidden="true" /></Link>
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
            <p>Connect with a friend, then send the first message from here.</p>
            <Link href="/friends">Find friends</Link>
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
              <div><strong>{selectedThread.name}</strong><span>In your circle</span></div>
              <Link href={`/friends/amika/${selectedThread.id}`}>View profile</Link>
            </header>

            <div className="messages-stream" aria-live="polite">
              <div className="messages-day"><span>Shared conversation</span></div>
              {messages.length === 0 ? (
                <div className="messages-first">
                  <Sparkles aria-hidden="true" />
                  <h2>Start with the memory that made you think of them.</h2>
                  <p>Messages stay between you and {selectedThread.name}.</p>
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
              <textarea id="message-draft" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Message ${selectedThread.name}…`} rows={1} maxLength={1000} />
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
    </div>
  );
}
