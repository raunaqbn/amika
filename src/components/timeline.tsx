'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, FileText } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { formatDistanceToNow, format } from 'date-fns';

interface TimelineEntry {
  id: string;
  type: 'diary' | 'note';
  title: string | null;
  content: string;
  summary: string;
  createdAt: Date;
  friends?: { id: string; name: string }[];
}

export function Timeline() {
  const router = useRouter();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTimeline = async () => {
      try {
        setLoading(true);

        // Fetch diary notes
        const diaryRes = await fetch('/api/diary');
        if (!diaryRes.ok) throw new Error('Failed to fetch diary');

        const diaryNotes = await diaryRes.json();

        // Generate summaries for each diary note
        const entriesWithSummaries = await Promise.all(
          diaryNotes.slice(0, 10).map(async (note: any) => {
            let summary = note.content.substring(0, 50);

            try {
              const summaryRes = await fetch('/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: note.content }),
              });

              if (summaryRes.ok) {
                const data = await summaryRes.json();
                summary = data.summary || summary;
              }
            } catch (err) {
              console.error('Error generating summary:', err);
            }

            return {
              id: note.id,
              type: 'diary' as const,
              title: note.title,
              content: note.content,
              summary,
              createdAt: new Date(note.createdAt),
              friends: note.friends || [],
            };
          })
        );

        // Sort by date descending
        entriesWithSummaries.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );

        setEntries(entriesWithSummaries);
      } catch (error) {
        console.error('Error loading timeline:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTimeline();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card
            key={i}
            className="p-4 border border-[#A8C5A8]/30 bg-white/60 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="p-8 border border-[#A8C5A8]/30 bg-white/60 text-center">
        <FileText className="w-12 h-12 text-[#A8C5A8] mx-auto mb-3" />
        <p className="text-gray-600">No timeline entries yet.</p>
        <p className="text-sm text-gray-500 mt-1">
          Start adding diary entries to build your timeline!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        {/* Timeline vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#A8C5A8]/20" />

        {entries.map((entry) => (
          <div key={entry.id} className="relative pl-12 pb-6">
            {/* Timeline dot */}
            <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full bg-[#A8C5A8] border-2 border-white" />

            <Card
              className="p-4 border border-[#A8C5A8]/30 bg-white/60 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push('/diary')}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-[#A8C5A8]" />
                    <h3 className="font-semibold text-gray-900">
                      {entry.title || 'Diary Entry'}
                    </h3>
                  </div>

                  <p className="text-sm text-[#D4A5A5] font-medium mb-2">
                    {entry.summary}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{format(entry.createdAt, 'PPP')}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(entry.createdAt, { addSuffix: true })}</span>
                  </div>
                </div>
              </div>

              {entry.friends && entry.friends.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {entry.friends.map((friend) => (
                    <Badge
                      key={friend.id}
                      variant="secondary"
                      className="bg-[#A8C5A8]/10 text-[#A8C5A8] text-xs"
                    >
                      {friend.name}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
