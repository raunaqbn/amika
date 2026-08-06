'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Compass, Globe2, LoaderCircle, Search, Sparkles } from 'lucide-react';
import { FeedMemory, MemoryCard } from '@/components/dashboard';

export default function ExplorePage() {
  const [memories, setMemories] = useState<FeedMemory[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadMemories = useCallback(async () => {
    const response = await fetch('/api/memories?scope=public');
    if (response.ok) setMemories(await response.json());
    setLoading(false);
  }, []);

  useEffect(() => { loadMemories(); }, [loadMemories]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return memories;
    return memories.filter((memory) =>
      memory.content.toLowerCase().includes(normalized)
      || memory.author.name.toLowerCase().includes(normalized)
      || memory.friend?.name.toLowerCase().includes(normalized)
    );
  }, [memories, query]);

  return (
    <div className="discover-page">
      <header className="discover-hero">
        <div>
          <span><Compass aria-hidden="true" /> Public memories</span>
          <h1>Discover small moments, not highlight reels.</h1>
          <p>Public memories from the wider Amika circle—ordinary days, favorite people, and the details worth keeping.</p>
        </div>
        <div className="discover-hero__note">
          <Globe2 aria-hidden="true" />
          <strong>Public by choice</strong>
          <p>Only memories explicitly shared as Public appear here. Friends-only and private moments stay where they belong.</p>
        </div>
      </header>

      <main className="discover-content">
        <div className="discover-toolbar">
          <div>
            <span>Open camera roll</span>
            <h2>Community memories</h2>
          </div>
          <label>
            <Search aria-hidden="true" />
            <span className="sr-only">Search public memories</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people or moments" />
          </label>
        </div>

        {loading ? (
          <div className="discover-state"><LoaderCircle className="spin" aria-hidden="true" /> Finding public memories…</div>
        ) : filtered.length === 0 ? (
          <div className="discover-state">
            <Sparkles aria-hidden="true" />
            <h2>{query ? 'No moments match that search.' : 'The public roll is waiting for its first memory.'}</h2>
            <p>{query ? 'Try a friend’s name or a different word.' : 'Share one of your own moments publicly when it feels right.'}</p>
            {!query && <Link href="/">Add a memory</Link>}
          </div>
        ) : (
          <div className="discover-grid">
            {filtered.map((memory, index) => (
              <MemoryCard key={memory.id} memory={memory} featured={index % 7 === 0} onRefresh={loadMemories} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
