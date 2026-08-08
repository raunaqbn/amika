'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Archive, LoaderCircle, Plus, Search } from 'lucide-react';
import { FeedMemory, MemoryCard } from '@/components/dashboard';
import { useAuth } from '@/lib/auth-context';

type Filter = 'all' | 'private' | 'friends' | 'public';

export default function MemoriesPage() {
  const { user } = useAuth();
  const [memories, setMemories] = useState<FeedMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const loadMemories = useCallback(async () => {
    if (!user) return;
    const response = await fetch('/api/memories');
    if (response.ok) {
      const data = await response.json();
      setMemories(data.map((memory: any) => ({
        ...memory,
        memoryDate: memory.memoryDate || memory.createdAt,
        author: { id: user.id, name: user.name, profileImage: user.profileImage },
        friend: memory.friend ? { ...memory.friend, profileImage: null } : null,
        reactionCount: 0,
        commentCount: 0,
        reactedByMe: false,
        isOwn: true,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadMemories(); }, [loadMemories]);

  const visible = useMemo(() => memories.filter((memory) => {
    if (filter !== 'all' && memory.visibility !== filter) return false;
    const normalized = query.trim().toLowerCase();
    return !normalized || memory.content.toLowerCase().includes(normalized) || memory.friend?.name.toLowerCase().includes(normalized);
  }), [filter, memories, query]);

  return (
    <div className="archive-page">
      <header className="archive-header">
        <div>
          <span><Archive aria-hidden="true" /> Your camera roll</span>
          <h1>Memory archive</h1>
          <p>Every small day you chose to keep, ordered by when it happened.</p>
        </div>
        <Link href="/"><Plus aria-hidden="true" /> Add today&apos;s memory</Link>
      </header>

      <main className="archive-content">
        <div className="archive-toolbar">
          <div className="archive-filters" aria-label="Filter memories">
            {(['all', 'private', 'friends', 'public'] as Filter[]).map((item) => (
              <button key={item} type="button" className={filter === item ? 'is-active' : ''} onClick={() => setFilter(item)}>
                {item === 'all' ? 'All memories' : item === 'friends' ? 'Shared memories' : item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
          <label>
            <Search aria-hidden="true" />
            <span className="sr-only">Search your memories</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your archive" />
          </label>
        </div>

        {loading ? (
          <div className="discover-state"><LoaderCircle className="spin" aria-hidden="true" /> Opening your archive…</div>
        ) : visible.length === 0 ? (
          <div className="discover-state"><Archive aria-hidden="true" /><h2>No memories here yet.</h2><p>Change the filter or add a new moment from home.</p></div>
        ) : (
          <div className="archive-grid">
            {visible.map((memory, index) => <MemoryCard key={memory.id} memory={memory} featured={index % 8 === 0} onRefresh={loadMemories} />)}
          </div>
        )}
      </main>
    </div>
  );
}
