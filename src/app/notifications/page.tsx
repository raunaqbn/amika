'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Bell, BookOpen, Check, Heart, LoaderCircle, MessageCircle, X } from 'lucide-react';
import { FriendRequests } from '@/components/friend-requests';
import { revalidateNotifications, useNotificationCount } from '@/hooks/use-data';

type SharedItem = {
  id: string;
  itemType: 'memory' | 'note';
  message: string | null;
  createdAt: string;
  sharedBy: { id: string; name: string; profileImage: string | null };
  item?: { id: string; title?: string; content?: string; imageUrl?: string | null };
};

type MessageThread = {
  id: string;
  name: string;
  profileImage: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  kind: 'direct' | 'group';
};

export default function NotificationsPage() {
  const [items, setItems] = useState<SharedItem[]>([]);
  const [messages, setMessages] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState('');
  const { pendingCount } = useNotificationCount();

  const loadNotifications = useCallback(async () => {
    const [itemsResponse, messagesResponse] = await Promise.all([
      fetch('/api/shared-items?type=received&status=pending'),
      fetch('/api/messages'),
    ]);
    if (itemsResponse.ok) setItems(await itemsResponse.json());
    if (messagesResponse.ok) setMessages((await messagesResponse.json()).filter((thread: MessageThread) => thread.unreadCount > 0));
    setLoading(false);
    revalidateNotifications();
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const respond = async (id: string, status: 'accepted' | 'rejected') => {
    setProcessing(id);
    const response = await fetch('/api/shared-items', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (response.ok) await loadNotifications();
    setProcessing('');
  };

  return (
    <div className="notifications-page">
      <header className="notifications-hero">
        <div>
          <span><Bell aria-hidden="true" /> What changed</span>
          <h1>Notifications</h1>
          <p>Friend requests, shared memories, journal notes, and new messages from your circle.</p>
        </div>
        <strong>{pendingCount}</strong>
      </header>

      <main className="notifications-content">
        <section className="notification-section">
          <div className="notification-section__heading"><span>Friend requests</span><h2>People reaching out</h2></div>
          <FriendRequests onUpdate={loadNotifications} />
        </section>

        <section className="notification-section">
          <div className="notification-section__heading"><span>Inbox</span><h2>Shared with you</h2></div>
          {loading ? (
            <div className="notification-empty"><LoaderCircle className="spin" aria-hidden="true" /> Checking your inbox…</div>
          ) : items.length === 0 ? (
            <div className="notification-empty"><Heart aria-hidden="true" /><p>No new shared memories or notes.</p></div>
          ) : (
            <div className="notification-list">
              {items.map((item) => (
                <article key={item.id}>
                  <span className="notification-avatar">
                    {item.sharedBy.profileImage ? <Image src={item.sharedBy.profileImage} alt="" fill className="object-cover" unoptimized /> : item.sharedBy.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <span>{item.itemType === 'memory' ? <Heart aria-hidden="true" /> : <BookOpen aria-hidden="true" />} {item.itemType}</span>
                    <h3>{item.sharedBy.name} shared {item.itemType === 'memory' ? 'a memory' : 'a journal note'}.</h3>
                    <p>{item.item?.title || item.item?.content || item.message || 'Open it to see what they shared.'}</p>
                    <time>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</time>
                  </div>
                  <div className="notification-actions">
                    <button type="button" onClick={() => respond(item.id, 'accepted')} disabled={processing === item.id}><Check aria-hidden="true" /> Keep</button>
                    <button type="button" onClick={() => respond(item.id, 'rejected')} disabled={processing === item.id}><X aria-hidden="true" /> Dismiss</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="notification-section">
          <div className="notification-section__heading"><span>Messages</span><h2>Unread conversations</h2></div>
          {messages.length === 0 ? (
            <div className="notification-empty"><MessageCircle aria-hidden="true" /><p>You are caught up on messages.</p></div>
          ) : (
            <div className="notification-list notification-list--messages">
              {messages.map((thread) => (
                <Link key={thread.id} href={`/messages?${thread.kind === 'group' ? 'thread' : 'with'}=${thread.id}`}>
                  <span className="notification-avatar">
                    {thread.profileImage ? <Image src={thread.profileImage} alt="" fill className="object-cover" unoptimized /> : thread.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div><h3>{thread.name}</h3><p>{thread.lastMessage}</p></div>
                  <strong>{thread.unreadCount}</strong>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
